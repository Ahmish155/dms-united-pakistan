import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { AiBatchLogModel } from './ai.model';
import { PersonModel } from '../people/person.model';
import { UnitModel } from '../units/unit.model';
import { IndividualMeetingModel } from '../meetings/meeting.model';
import { DialogueForumModel, DfAttendanceModel, DfMentorModel } from '../df/df.model';
import { GroupMeetingModel, GmAttendanceModel } from '../gm/gm.model';
import { RmmModel, RmmTargetModel } from '../rmm/rmm.model';
import { PersonStage, OrganizationalResponsibility, OperationalStatus } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';
import { getLiveAiContext } from './aiContext';
import { ENV } from '../../config/env';

// Allowed Collections for Read-Only Aggregations
const ALLOWED_COLLECTIONS = new Set([
  'people',
  'units',
  'individualmeetings',
  'dialogueforums',
  'dfattendances',
  'groupmeetings',
  'gmattendances',
  'rmms',
  'rmmtargets',
  'dmms',
  'dmmtargets',
  'workspacesettings'
]);

// Forbidden Mutative Pipeline Stages / Operators
const FORBIDDEN_OPERATORS = [
  '$out',
  '$merge',
  '$delete',
  '$update',
  '$drop',
  '$set',
  '$unset',
  'dropDatabase',
  'deleteMany',
  'deleteOne',
  'updateMany',
  'updateOne'
];

export class AiService {
  private static getGeminiClient(): GoogleGenAI | null {
    const apiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Phase 2: Unstructured Text-to-Database Ingestion
   * Strict Schema Enforcement using gemini-2.5-flash with temperature: 0
   * Human-in-the-loop: Does NOT write to MongoDB. Returns structured JSON for frontend review.
   */
  static async parseRawText(workspaceId: string, rawText: string) {
    const ai = this.getGeminiClient();
    const liveContext = await getLiveAiContext(workspaceId);

    const antiHallucinationPrompt = `
Extract structured records from the provided raw text for review before saving into the Dawati Management System.

Instructions:
1. Extract data strictly from the provided input text using the exact schemas and business rules defined in context.
2. If any value, date, or field is missing, ambiguous, or not explicitly stated, return null. Never guess, assume, or invent data.
3. Match names against active units and roles defined in the workspace context.

Raw Input Text:
"""
${rawText}
"""
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: antiHallucinationPrompt,
          config: {
            systemInstruction: liveContext,
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                people: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      fullName: { type: Type.STRING },
                      contactNumber: { type: Type.STRING, nullable: true },
                      unitName: { type: Type.STRING, nullable: true },
                      currentStage: {
                        type: Type.STRING,
                        enum: ['MADU', 'MDF', 'RABTAKAR', 'DAEEN', 'OTHER'],
                        nullable: true
                      },
                      operationalStatus: {
                        type: Type.STRING,
                        enum: ['PIPELINE', 'ACTIVE', 'INACTIVE', 'FREEZED', 'DROPPED'],
                        nullable: true
                      },
                      rabtakarName: { type: Type.STRING, nullable: true },
                      daeenName: { type: Type.STRING, nullable: true },
                      notes: { type: Type.STRING, nullable: true }
                    },
                    required: ['fullName']
                  }
                },
                meetings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      personName: { type: Type.STRING },
                      meetingDate: { type: Type.STRING, nullable: true },
                      unitName: { type: Type.STRING, nullable: true },
                      primaryDaeenName: { type: Type.STRING, nullable: true },
                      rabtakarName: { type: Type.STRING, nullable: true },
                      comments: { type: Type.STRING, nullable: true }
                    },
                    required: ['personName']
                  }
                },
                rmm: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      unitName: { type: Type.STRING, nullable: true },
                      rmmDate: { type: Type.STRING, nullable: true },
                      weekStartDate: { type: Type.STRING, nullable: true },
                      weekEndDate: { type: Type.STRING, nullable: true },
                      plannedMaduMeetings: { type: Type.NUMBER, nullable: true },
                      plannedMdfMeetings: { type: Type.NUMBER, nullable: true },
                      comments: { type: Type.STRING, nullable: true }
                    }
                  }
                },
                dialogueForums: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      unitName: { type: Type.STRING, nullable: true },
                      date: { type: Type.STRING, nullable: true },
                      mentorName: { type: Type.STRING, nullable: true },
                      topic: { type: Type.STRING, nullable: true },
                      comments: { type: Type.STRING, nullable: true },
                      attendeeNames: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              required: ['summary']
            }
          }
        });

        const parsedJson = JSON.parse(response.text || '{}');
        return parsedJson;
      } catch (err: any) {
        console.warn('Gemini parser API returned error, falling back to heuristic parser:', err.message);
      }
    }

    // Heuristic Fallback
    return this.heuristicParser(workspaceId, rawText);
  }

  /**
   * Commit verified AI batch to database upon explicit human approval ("Approve & Save")
   */
  static async commitBatch(workspaceId: string, parsedData: any, userId: string) {
    const wId = new Types.ObjectId(workspaceId);
    const uId = new Types.ObjectId(userId);
    const batchId = `ai_batch_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const createdEntities: Array<{ entityType: any; entityId: Types.ObjectId }> = [];

    // Preload lookup maps
    const [units, people, mentors] = await Promise.all([
      UnitModel.find({ workspaceId: wId, isActive: true }).lean(),
      PersonModel.find({ workspaceId: wId, isArchived: false }).lean(),
      DfMentorModel.find({ workspaceId: wId, isActive: true }).lean()
    ]);

    const unitMap = new Map<string, Types.ObjectId>();
    units.forEach((u: any) => {
      unitMap.set(u.name.toLowerCase().trim(), u._id);
      unitMap.set(u.code.toLowerCase().trim(), u._id);
    });

    const peopleMap = new Map<string, Types.ObjectId>();
    people.forEach((p: any) => {
      peopleMap.set(p.fullName.toLowerCase().trim(), p._id);
    });

    const defaultUnitId = units[0]?._id;

    // 1. Commit People
    if (parsedData.people && Array.isArray(parsedData.people)) {
      for (const pData of parsedData.people) {
        if (!pData.fullName || typeof pData.fullName !== 'string') continue;
        const count = await PersonModel.countDocuments({ workspaceId: wId });
        const internalId = `P-${String(count + 1).padStart(4, '0')}`;

        let unitId = pData.currentStage === PersonStage.DAEEN ? undefined : defaultUnitId;
        if (pData.unitName && unitMap.has(pData.unitName.toLowerCase().trim())) {
          unitId = unitMap.get(pData.unitName.toLowerCase().trim())!;
        }

        const rabtakarId = pData.rabtakarName && peopleMap.has(pData.rabtakarName.toLowerCase().trim())
          ? peopleMap.get(pData.rabtakarName.toLowerCase().trim())
          : undefined;

        const daeenId = pData.daeenName && peopleMap.has(pData.daeenName.toLowerCase().trim())
          ? peopleMap.get(pData.daeenName.toLowerCase().trim())
          : undefined;

        const person = await PersonModel.create({
          workspaceId: wId,
          internalId,
          fullName: pData.fullName.trim(),
          contactNumber: pData.contactNumber,
          currentUnitId: pData.currentStage === PersonStage.DAEEN ? undefined : unitId,
          currentStage: pData.currentStage || PersonStage.MADU,
          operationalStatus: pData.operationalStatus || OperationalStatus.ACTIVE,
          primaryRabtakarId: rabtakarId,
          defaultDaeenId: daeenId,
          notes: pData.notes || 'Imported via AI Data Assistant',
          roles: pData.currentStage === PersonStage.DAEEN ? [OrganizationalResponsibility.DAEEN] : [],
          isArchived: false
        });

        peopleMap.set(person.fullName.toLowerCase().trim(), person._id);
        createdEntities.push({ entityType: 'Person', entityId: person._id });
      }
    }

    // 2. Commit Meetings
    if (parsedData.meetings && Array.isArray(parsedData.meetings)) {
      for (const mData of parsedData.meetings) {
        const personId = mData.personName ? peopleMap.get(mData.personName.toLowerCase().trim()) : undefined;
        if (!personId) continue;

        let unitId = defaultUnitId;
        if (mData.unitName && unitMap.has(mData.unitName.toLowerCase().trim())) {
          unitId = unitMap.get(mData.unitName.toLowerCase().trim())!;
        }

        const rabtakarId = mData.rabtakarName && peopleMap.has(mData.rabtakarName.toLowerCase().trim())
          ? peopleMap.get(mData.rabtakarName.toLowerCase().trim())
          : undefined;

        const daeenId = mData.primaryDaeenName && peopleMap.has(mData.primaryDaeenName.toLowerCase().trim())
          ? peopleMap.get(mData.primaryDaeenName.toLowerCase().trim())
          : undefined;

        const count = await IndividualMeetingModel.countDocuments({ workspaceId: wId, personId });

        const meeting = await IndividualMeetingModel.create({
          workspaceId: wId,
          personId,
          meetingDate: mData.meetingDate ? new Date(mData.meetingDate) : new Date(),
          meetingNumber: count + 1,
          unitId,
          rabtakarId: rabtakarId || personId,
          primaryDaeenId: daeenId || personId,
          comments: mData.comments || 'Recorded via AI Assistant',
          createdById: uId
        });

        createdEntities.push({ entityType: 'IndividualMeeting', entityId: meeting._id });
      }
    }

    // 3. Commit RMM Weekly Conclusions
    if (parsedData.rmm && Array.isArray(parsedData.rmm)) {
      for (const rData of parsedData.rmm) {
        let unitId = defaultUnitId;
        if (rData.unitName && unitMap.has(rData.unitName.toLowerCase().trim())) {
          unitId = unitMap.get(rData.unitName.toLowerCase().trim())!;
        }

        const rmm = await RmmModel.create({
          workspaceId: wId,
          unitId,
          rmmDate: rData.rmmDate ? new Date(rData.rmmDate) : new Date(),
          weekStartDate: rData.weekStartDate ? new Date(rData.weekStartDate) : new Date(),
          weekEndDate: rData.weekEndDate ? new Date(rData.weekEndDate) : new Date(),
          plannedMaduMeetings: rData.plannedMaduMeetings || 0,
          plannedMdfMeetings: rData.plannedMdfMeetings || 0,
          comments: rData.comments || 'Extracted via AI Assistant',
          createdById: uId,
          status: 'ACTIVE'
        });

        createdEntities.push({ entityType: 'Rmm', entityId: rmm._id });
      }
    }

    // 4. Commit Dialogue Forums
    if (parsedData.dialogueForums && Array.isArray(parsedData.dialogueForums)) {
      for (const dfData of parsedData.dialogueForums) {
        let unitId = defaultUnitId;
        if (dfData.unitName && unitMap.has(dfData.unitName.toLowerCase().trim())) {
          unitId = unitMap.get(dfData.unitName.toLowerCase().trim())!;
        }

        let mentorId = mentors[0]?._id;
        if (dfData.mentorName) {
          const m = mentors.find((x) => x.name.toLowerCase() === dfData.mentorName.toLowerCase().trim());
          if (m) mentorId = m._id;
        }

        const df = await DialogueForumModel.create({
          workspaceId: wId,
          unitId,
          date: dfData.date ? new Date(dfData.date) : new Date(),
          mentorId,
          topic: dfData.topic || 'Dialogue Forum',
          comments: dfData.comments || 'Recorded via AI Assistant',
          createdById: uId
        });

        if (dfData.attendeeNames && Array.isArray(dfData.attendeeNames)) {
          for (const name of dfData.attendeeNames) {
            const pid = peopleMap.get(name.toLowerCase().trim());
            if (pid) {
              await DfAttendanceModel.create({
                workspaceId: wId,
                dfId: df._id,
                personId: pid,
                category: 'MADU',
                status: 'ATTENDED'
              });
            }
          }
        }

        createdEntities.push({ entityType: 'DialogueForum', entityId: df._id });
      }
    }

    // Log Batch for One-Click Undo
    await AiBatchLogModel.create({
      workspaceId: wId,
      batchId,
      rawText: parsedData.summary || 'AI Batch Ingestion',
      summary: `Created ${createdEntities.length} entities: ${createdEntities.map((e) => e.entityType).join(', ')}`,
      createdEntities,
      userId: uId,
      isReverted: false
    });

    return {
      batchId,
      totalCreated: createdEntities.length,
      createdEntitiesSummary: createdEntities.map((e) => e.entityType),
      message: 'All extracted entities successfully verified and committed to workspace!'
    };
  }

  /**
   * One-Click Undo a committed batch
   */
  static async undoBatch(workspaceId: string, batchId: string, _userId: string) {
    const wId = new Types.ObjectId(workspaceId);
    const batchLog = await AiBatchLogModel.findOne({ workspaceId: wId, batchId });

    if (!batchLog) {
      throw new AppError('AI Batch record not found', 404);
    }
    if (batchLog.isReverted) {
      throw new AppError('This batch has already been reverted', 400);
    }

    let deletedCount = 0;
    for (const item of batchLog.createdEntities) {
      if (item.entityType === 'Person') {
        await PersonModel.deleteOne({ _id: item.entityId });
        deletedCount++;
      } else if (item.entityType === 'IndividualMeeting') {
        await IndividualMeetingModel.deleteOne({ _id: item.entityId });
        deletedCount++;
      } else if (item.entityType === 'DialogueForum') {
        await DfAttendanceModel.deleteMany({ dfId: item.entityId });
        await DialogueForumModel.deleteOne({ _id: item.entityId });
        deletedCount++;
      } else if (item.entityType === 'GroupMeeting') {
        await GmAttendanceModel.deleteMany({ gmId: item.entityId });
        await GroupMeetingModel.deleteOne({ _id: item.entityId });
        deletedCount++;
      } else if (item.entityType === 'Rmm') {
        await RmmTargetModel.deleteMany({ rmmId: item.entityId });
        await RmmModel.deleteOne({ _id: item.entityId });
        deletedCount++;
      }
    }

    batchLog.isReverted = true;
    await batchLog.save();

    return {
      success: true,
      batchId,
      deletedCount,
      message: `Batch ${batchId} was successfully reverted (${deletedCount} entities removed).`
    };
  }

  /**
   * Phase 3: Natural Language Database Q&A via Text-to-Aggregation Pipeline
   * 1. Translates question into a strictly read-only MongoDB aggregation pipeline.
   * 2. Inspects and blocks any mutative stage ($out, $merge, $delete, etc.).
   * 3. Executes pipeline in MongoDB so the database handles all counting, filtering, and math.
   * 4. Passes raw JSON DB result back to Gemini with strict grounded anti-hallucination prompt.
   */
  static async executeQuery(workspaceId: string, question: string) {
    const ai = this.getGeminiClient();
    const liveContext = await getLiveAiContext(workspaceId);
    const wId = new Types.ObjectId(workspaceId);

    if (!ai) {
      // Fallback if API key is not configured
      return this.heuristicQueryFallback(workspaceId, question);
    }

    // Step 1: Text-to-Aggregation Pipeline
    const pipelinePrompt = `
You are a senior MongoDB aggregation architect. Convert the user's natural language question into a STRICT, READ-ONLY MongoDB Aggregation Pipeline for the Dawati Management System.

Question: "${question}"

Rules:
1. Target Collection MUST be one of: ${Array.from(ALLOWED_COLLECTIONS).join(', ')}.
2. The pipeline MUST be a valid JSON array of aggregation stages.
3. The very first stage MUST be a $match stage that includes "workspaceId": "${workspaceId}".
4. For date filtering (e.g. "today", "last 3 days", "last 7 days", "this month"), use the exact ISO date string anchors provided in the LIVE TEMPORAL context with "$gte" or "$lte".
5. Use $lookup to join related collections when needed (e.g. joining "people" to get names for rabtakarId, personId, or primaryDaeenId, or joining "units" for unit names).
6. NEVER include mutative operators ($out, $merge, $delete, $update, $set, $unset, $drop).
7. Return JSON ONLY with this exact format:
{
  "collection": "individualmeetings",
  "pipeline": [
    { "$match": { "workspaceId": "${workspaceId}" } }
  ]
}
`;

    let generatedPipelineObj: { collection: string; pipeline: any[] };

    try {
      const pipelineRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: pipelinePrompt,
        config: {
          systemInstruction: liveContext,
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              collection: {
                type: Type.STRING,
                enum: Array.from(ALLOWED_COLLECTIONS)
              },
              pipeline: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT }
              }
            },
            required: ['collection', 'pipeline']
          }
        }
      });

      generatedPipelineObj = JSON.parse(pipelineRes.text || '{}');
    } catch (err: any) {
      console.warn('Gemini pipeline generation failed, falling back to heuristic:', err.message);
      return this.heuristicQueryFallback(workspaceId, question);
    }

    const { collection, pipeline } = generatedPipelineObj;

    // Step 2: Strict Read-Only Security Inspection
    if (!collection || !ALLOWED_COLLECTIONS.has(collection.toLowerCase().trim())) {
      throw new AppError(`Invalid or unauthorized collection: "${collection}"`, 403);
    }

    if (!Array.isArray(pipeline)) {
      throw new AppError('Generated pipeline must be a valid JSON array', 400);
    }

    const pipelineStr = JSON.stringify(pipeline);
    for (const forbidden of FORBIDDEN_OPERATORS) {
      if (pipelineStr.includes(forbidden)) {
        throw new AppError(`Mutative or forbidden operator detected in pipeline: ${forbidden}`, 403);
      }
    }

    // Step 3: Sanitize and enforce workspaceId + BSON conversions
    const sanitizedPipeline = this.sanitizePipeline(pipeline, wId);

    // Step 4: Execute database aggregation
    let rawResult: any[] = [];
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new AppError('Database connection is not available', 500);
      }
      rawResult = await db.collection(collection.toLowerCase().trim()).aggregate(sanitizedPipeline).toArray();
    } catch (dbErr: any) {
      console.error('Aggregation execution failed:', dbErr.message);
      throw new AppError(`Failed to execute MongoDB aggregation: ${dbErr.message}`, 500);
    }

    // Step 5: Grounded Response Generation
    const groundedPrompt = `
Answer the user's question using ONLY the exact database output provided below.
Do not extrapolate or add outside facts.
If the database returns empty or zero results, clearly state that no matching records were found.
Respond naturally and politely in the language used by the user:
- If the user asked in Roman Urdu (e.g. "mujy sab maudeen ki list chahiya", "pichlay 3 dinu main kitni meetings hoi"), respond in fluent Roman Urdu.
- If the user asked in Urdu, respond in Urdu script.
- If the user asked in English, respond in English.

User's Question: "${question}"

Target Collection Queried: "${collection}"
Database Aggregation Result (Count: ${rawResult.length}):
${JSON.stringify(rawResult.slice(0, 50), null, 2)}
`;

    let finalAnswer = '';
    try {
      const answerRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: groundedPrompt,
        config: {
          systemInstruction: liveContext,
          temperature: 0
        }
      });
      finalAnswer = answerRes.text || 'No response generated.';
    } catch (err: any) {
      finalAnswer = `Database query returned ${rawResult.length} record(s): ${JSON.stringify(rawResult.slice(0, 10))}`;
    }

    return {
      answer: finalAnswer,
      collection,
      pipeline: sanitizedPipeline,
      rawResultCount: rawResult.length,
      rawResult: rawResult.slice(0, 25),
      question
    };
  }

  /**
   * Recursively sanitize pipeline stages:
   * - Enforce workspaceId at stage 0
   * - Convert 24-char hex strings in match clauses to ObjectId
   * - Convert ISO date strings to real Date instances for proper BSON date comparison
   */
  private static sanitizePipeline(pipeline: any[], workspaceId: Types.ObjectId): any[] {
    const clean = pipeline.map((stage) => this.deepConvertTypes(stage));

    // Enforce workspaceId in the very first stage
    if (clean.length === 0 || !clean[0].$match) {
      clean.unshift({ $match: { workspaceId } });
    } else {
      clean[0].$match.workspaceId = workspaceId;
    }

    return clean;
  }

  private static deepConvertTypes(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepConvertTypes(item));
    }

    if (typeof obj === 'object') {
      const res: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
          // Check for ISO Date
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
            res[k] = new Date(v);
          }
          // Check for ObjectId (24 hex characters)
          else if (/^[0-9a-fA-F]{24}$/.test(v) && (k.endsWith('Id') || k === '_id' || k === 'workspaceId')) {
            res[k] = new Types.ObjectId(v);
          } else {
            res[k] = v;
          }
        } else {
          res[k] = this.deepConvertTypes(v);
        }
      }
      return res;
    }

    return obj;
  }

  /**
   * Fallback rule-based parser when Gemini API key is absent
   */
  private static async heuristicParser(workspaceId: string, text: string) {
    const wId = new Types.ObjectId(workspaceId);
    const units = await UnitModel.find({ workspaceId: wId, isActive: true }).select('name').lean();
    const defaultUnitName = units[0]?.name || 'Default Unit';

    const people: any[] = [];
    const meetings: any[] = [];
    const rmm: any[] = [];
    const dialogueForums: any[] = [];

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Check for RMM
      if (lower.includes('rmm') || lower.includes('weekly') || lower.includes('target')) {
        const maduMatch = line.match(/(\d+)\s*madu/i);
        const mdfMatch = line.match(/(\d+)\s*mdf/i);
        rmm.push({
          unitName: defaultUnitName,
          rmmDate: new Date().toISOString().split('T')[0],
          weekStartDate: new Date().toISOString().split('T')[0],
          weekEndDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          plannedMaduMeetings: maduMatch ? parseInt(maduMatch[1], 10) : 5,
          plannedMdfMeetings: mdfMatch ? parseInt(mdfMatch[1], 10) : 2,
          comments: line
        });
      }
      // Check for Dialogue Forum
      else if (lower.includes('dialogue') || lower.includes('df') || lower.includes('forum')) {
        dialogueForums.push({
          unitName: defaultUnitName,
          date: new Date().toISOString().split('T')[0],
          topic: line.replace(/(dialogue forum|df|forum)/i, '').trim() || 'Dialogue Forum Session',
          comments: line,
          attendeeNames: []
        });
      }
      // Check for Meeting
      else if (lower.includes('meeting') || lower.includes('mulaqat') || lower.includes('guftagu')) {
        const words = line.split(/[ ,:]+/).filter((w) => w.length > 2);
        meetings.push({
          personName: words[1] || 'New Contact',
          unitName: defaultUnitName,
          comments: line,
          meetingDate: new Date().toISOString().split('T')[0]
        });
      }
      // Check for Person
      else if (lower.includes('madu') || lower.includes('contact') || lower.includes('naya')) {
        const cleaned = line.replace(/^(naya|new|madu|contact)[: -]*/i, '').trim();
        const parts = cleaned.split(/[,;-]+/);
        people.push({
          fullName: parts[0]?.trim() || 'New Contact',
          currentStage: PersonStage.MADU,
          operationalStatus: OperationalStatus.ACTIVE,
          unitName: defaultUnitName,
          notes: line
        });
      }
    }

    return {
      summary: `Heuristic extracted: ${people.length} people, ${meetings.length} meetings, ${rmm.length} RMM, ${dialogueForums.length} DFs`,
      people,
      meetings,
      rmm,
      dialogueForums
    };
  }

  /**
   * Fallback Q&A when Gemini API key is absent
   */
  private static async heuristicQueryFallback(workspaceId: string, question: string) {
    const wId = new Types.ObjectId(workspaceId);
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [people, meetings3d, meetings7d, units] = await Promise.all([
      PersonModel.find({ workspaceId: wId, isArchived: false }).populate('currentUnitId', 'name').lean(),
      IndividualMeetingModel.find({ workspaceId: wId, meetingDate: { $gte: threeDaysAgo } }).populate('personId', 'fullName').populate('primaryDaeenId', 'fullName').lean(),
      IndividualMeetingModel.find({ workspaceId: wId, meetingDate: { $gte: sevenDaysAgo } }).lean(),
      UnitModel.find({ workspaceId: wId, isActive: true }).select('name').lean()
    ]);

    const maduList = people.filter((p: any) => p.currentStage === PersonStage.MADU);
    const q = question.toLowerCase();

    if (q.includes('madu') || q.includes('maudeen') || q.includes('madueen') || q.includes('list')) {
      const formatted = maduList.map((m: any, idx: number) =>
        `${idx + 1}. **${m.fullName}** — Unit: ${m.currentUnitId?.name || 'N/A'}, Status: ${m.operationalStatus || 'ACTIVE'}`
      ).join('\n');

      return {
        answer: `Aap ke sector mein total **${maduList.length}** Madueen darj hain:\n\n${formatted || 'Abhi tak koi Madu darj nahi kiya gaya.'}`,
        collection: 'people',
        pipeline: [{ $match: { workspaceId: wId, currentStage: 'MADU', isArchived: false } }],
        rawResultCount: maduList.length,
        rawResult: maduList.slice(0, 10),
        question
      };
    }

    if (q.includes('3 din') || q.includes('3 days') || q.includes('teen din')) {
      return {
        answer: `Pichlay 3 dinon mein total **${meetings3d.length}** Individual Meetings (IM) munaqid hui hain.`,
        collection: 'individualmeetings',
        pipeline: [{ $match: { workspaceId: wId, meetingDate: { $gte: threeDaysAgo } } }],
        rawResultCount: meetings3d.length,
        rawResult: meetings3d,
        question
      };
    }

    if (q.includes('7 din') || q.includes('week') || q.includes('hafte') || q.includes('sat din')) {
      return {
        answer: `Pichlay 7 dinon (is hafte) mein total **${meetings7d.length}** Individual Meetings munaqid hui hain.`,
        collection: 'individualmeetings',
        pipeline: [{ $match: { workspaceId: wId, meetingDate: { $gte: sevenDaysAgo } } }],
        rawResultCount: meetings7d.length,
        rawResult: meetings7d,
        question
      };
    }

    return {
      answer: `Workspace Snapshot:\n- Total Units: ${units.length}\n- Total People: ${people.length} (Madu: ${maduList.length})\n- Meetings in last 7 days: ${meetings7d.length}`,
      collection: 'people',
      pipeline: [{ $match: { workspaceId: wId } }],
      rawResultCount: people.length,
      rawResult: people.slice(0, 5),
      question
    };
  }
}
