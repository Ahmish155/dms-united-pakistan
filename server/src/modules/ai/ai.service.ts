import { Types } from 'mongoose';
import crypto from 'crypto';
import { AiBatchLogModel } from './ai.model';
import { PersonModel } from '../people/person.model';
import { UnitModel } from '../units/unit.model';
import { IndividualMeetingModel } from '../meetings/meeting.model';
import { DialogueForumModel, DfAttendanceModel, DfMentorModel } from '../df/df.model';
import { GroupMeetingModel, GmAttendanceModel } from '../gm/gm.model';
import { RmmModel, RmmTargetModel } from '../rmm/rmm.model';
import { PersonStage, OrganizationalResponsibility, OperationalStatus } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

const GEMINI_SYSTEM_INSTRUCTION = `
You are the AI Data Engine & Ingestion Assistant for the Dawati Management System (DMS) in Pakistan.
The organizational hierarchy and business rules are:
1. Sector Workspace: top-level dawati sector with Units.
2. Units: geographical dawati units (e.g. Unit 1, Gulraiz, Satellite Town).
3. People & Stages:
   - MADU: newly approached contact / candidate. Associated with a Rabtakar and Unit.
   - MDF: promoted contact actively participating in Dialogue Forums.
   - RABTAKAR: responsible member connecting Madu/MDF. Can serve multiple units simultaneously.
   - DAEEN: sector-wide preaching/instruction resource (does NOT belong to any single unit).
   - Operational Statuses: ACTIVE, INACTIVE, PIPELINE, FREEZED, DROPPED.
4. Meetings & Sessions:
   - Individual Meeting (IM): one-on-one session with Madu/MDF, Rabtakar, and Daeen.
   - Dialogue Forum (DF): unit-level intellectual forum led by a Mentor with attendance.
   - Group Meeting (GM): group congregation led by a Facilitator with attendance.
   - RMM: weekly planning meeting per unit setting weekly targets.
   - DMM: monthly planning meeting per sector setting monthly targets.
`;

export class AiService {
  private static getGeminiApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  private static async callGemini(prompt: string, jsonMode = false): Promise<string> {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }] }
    };

    if (jsonMode) {
      body.generationConfig = { responseMimeType: 'application/json' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Parse raw text (notes, WhatsApp summaries, rosters, meeting records) into structured actions
   */
  static async parseRawText(workspaceId: string, rawText: string) {
    const wId = new Types.ObjectId(workspaceId);
    const [units, people, mentors] = await Promise.all([
      UnitModel.find({ workspaceId: wId, isActive: true }).select('name code').lean(),
      PersonModel.find({ workspaceId: wId, isArchived: false }).select('fullName currentStage internalId currentUnitId').lean(),
      DfMentorModel.find({ workspaceId: wId, isActive: true }).select('name').lean()
    ]);

    const contextDesc = `
Available Workspace Units: ${units.map((u: any) => u.name).join(', ') || 'None yet'}
Available Existing People: ${people.map((p: any) => `${p.fullName} (${p.currentStage})`).slice(0, 30).join(', ')}
Available Mentors: ${mentors.map((m: any) => m.name).join(', ') || 'None yet'}
`;

    try {
      const prompt = `
Extract structured records from the following raw text for insertion into the Dawati Management System.
${contextDesc}

Raw Text to Extract:
"""
${rawText}
"""

Return a valid JSON object matching this schema:
{
  "summary": "Brief explanation of what was extracted",
  "people": [
    {
      "fullName": "Name",
      "contactNumber": "Optional phone",
      "currentStage": "MADU | MDF | RABTAKAR | DAEEN | OTHER",
      "operationalStatus": "ACTIVE | PIPELINE | FREEZED | DROPPED",
      "unitName": "Unit name if specified",
      "rabtakarName": "Rabtakar name if mentioned",
      "daeenName": "Daeen name if mentioned",
      "notes": "Any notes"
    }
  ],
  "meetings": [
    {
      "personName": "Madu or attendee name",
      "unitName": "Unit name",
      "rabtakarName": "Rabtakar name",
      "primaryDaeenName": "Daeen name",
      "meetingDate": "YYYY-MM-DD",
      "comments": "Meeting notes"
    }
  ],
  "rmm": [
    {
      "unitName": "Unit name",
      "rmmDate": "YYYY-MM-DD",
      "weekStartDate": "YYYY-MM-DD",
      "weekEndDate": "YYYY-MM-DD",
      "plannedMaduMeetings": 0,
      "plannedMdfMeetings": 0,
      "comments": "Weekly targets summary"
    }
  ],
  "dialogueForums": [
    {
      "topic": "Topic of discussion",
      "unitName": "Unit name",
      "mentorName": "Mentor name",
      "date": "YYYY-MM-DD",
      "attendeeNames": ["Attendee 1", "Attendee 2"],
      "comments": "Comments"
    }
  ]
}
`;

      const jsonStr = await this.callGemini(prompt, true);
      const parsed = JSON.parse(jsonStr);
      return parsed;
    } catch (err: any) {
      console.warn('Gemini parser fallback activated:', err.message);
      // Fallback: heuristic extraction from text lines
      return this.heuristicExtraction(rawText, units, people);
    }
  }

  private static heuristicExtraction(rawText: string, units: any[], people: any[]) {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const extractedPeople: any[] = [];
    const extractedMeetings: any[] = [];
    let summary = `Parsed ${lines.length} lines of text using heuristic fallback.`;

    for (const line of lines) {
      // Check for bullet person entry
      if (line.toLowerCase().includes('madu') || line.toLowerCase().includes('name:') || line.startsWith('-') || line.startsWith('•')) {
        const cleaned = line.replace(/^[-•*]\s*/, '').replace(/madu:?/i, '').trim();
        const parts = cleaned.split(/[,–-]/).map((p) => p.trim());
        if (parts[0] && parts[0].length >= 2) {
          extractedPeople.push({
            fullName: parts[0],
            contactNumber: parts.find((p) => /^\+?[0-9]{7,15}$/.test(p)),
            currentStage: line.toLowerCase().includes('mdf')
              ? PersonStage.MDF
              : line.toLowerCase().includes('dae')
              ? PersonStage.DAEEN
              : line.toLowerCase().includes('rabtakar')
              ? PersonStage.RABTAKAR
              : PersonStage.MADU,
            operationalStatus: line.toLowerCase().includes('pipeline')
              ? OperationalStatus.PIPELINE
              : OperationalStatus.ACTIVE,
            unitName: units[0]?.name || '',
            notes: line
          });
        }
      }
    }

    return {
      summary,
      people: extractedPeople,
      meetings: extractedMeetings,
      rmm: [],
      dialogueForums: []
    };
  }

  /**
   * Commit parsed records to database and log batch for 1-click Undo
   */
  static async commitBatch(workspaceId: string, parsedData: any, userId: string) {
    const wId = new Types.ObjectId(workspaceId);
    const uId = new Types.ObjectId(userId);
    const batchId = `BATCH-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const createdEntities: Array<{
      entityType: 'Person' | 'IndividualMeeting' | 'DialogueForum' | 'GroupMeeting' | 'Rmm' | 'Dmm';
      entityId: Types.ObjectId;
    }> = [];

    // Pre-load reference maps
    const [units, existingPeople, mentors] = await Promise.all([
      UnitModel.find({ workspaceId: wId, isActive: true }),
      PersonModel.find({ workspaceId: wId, isArchived: false }),
      DfMentorModel.find({ workspaceId: wId, isActive: true })
    ]);

    const unitMap = new Map<string, Types.ObjectId>();
    for (const u of units) unitMap.set(u.name.toLowerCase().trim(), u._id);
    const defaultUnitId = units[0]?._id;

    const peopleMap = new Map<string, Types.ObjectId>();
    for (const p of existingPeople) peopleMap.set(p.fullName.toLowerCase().trim(), p._id);

    // 1. Commit People
    if (parsedData.people && Array.isArray(parsedData.people)) {
      for (const pData of parsedData.people) {
        if (!pData.fullName) continue;

        let unitId = defaultUnitId;
        if (pData.unitName && unitMap.has(pData.unitName.toLowerCase().trim())) {
          unitId = unitMap.get(pData.unitName.toLowerCase().trim())!;
        }

        const count = await PersonModel.countDocuments({ workspaceId: wId });
        const internalId = `UP-${(count + 1).toString().padStart(4, '0')}`;

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
          recordedById: uId
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

    // Log Batch for Undo
    const batchLog = await AiBatchLogModel.create({
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
      message: 'All extracted entities successfully applied to workspace!'
    };
  }

  /**
   * Revert / Undo a previously committed AI batch
   */
  static async undoBatch(workspaceId: string, batchId: string, userId: string) {
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
   * Human Language / Roman Urdu / Urdu Q&A over the Workspace
   */
  static async askWorkspace(workspaceId: string, question: string) {
    const wId = new Types.ObjectId(workspaceId);
    const now = new Date();

    // Fetch live workspace snapshot
    const [units, people, meetings3d, meetings7d, meetings30d, dfs, gms, rmms] = await Promise.all([
      UnitModel.find({ workspaceId: wId, isActive: true }).select('name code').lean(),
      PersonModel.find({ workspaceId: wId, isArchived: false })
        .populate('currentUnitId', 'name')
        .populate('primaryRabtakarId', 'fullName')
        .populate('defaultDaeenId', 'fullName')
        .lean(),
      IndividualMeetingModel.find({
        workspaceId: wId,
        meetingDate: { $gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
      })
        .populate('personId', 'fullName')
        .populate('primaryDaeenId', 'fullName')
        .lean(),
      IndividualMeetingModel.find({
        workspaceId: wId,
        meetingDate: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }).lean(),
      IndividualMeetingModel.find({
        workspaceId: wId,
        meetingDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      }).lean(),
      DialogueForumModel.find({ workspaceId: wId }).populate('unitId', 'name').lean(),
      GroupMeetingModel.find({ workspaceId: wId }).populate('unitId', 'name').lean(),
      RmmModel.find({ workspaceId: wId, status: 'ACTIVE' }).populate('unitId', 'name').lean()
    ]);

    const maduList = people.filter((p: any) => p.currentStage === PersonStage.MADU);
    const mdfList = people.filter((p: any) => p.currentStage === PersonStage.MDF);
    const rabtakarList = people.filter((p: any) => p.currentStage === PersonStage.RABTAKAR || p.roles?.includes(OrganizationalResponsibility.RABTAKAR));
    const daeenList = people.filter((p: any) => p.currentStage === PersonStage.DAEEN || p.roles?.includes(OrganizationalResponsibility.DAEEN));

    const stateSummary = `
Workspace Live Data Snapshot:
- Total Units (${units.length}): ${units.map((u: any) => u.name).join(', ')}
- Total People: ${people.length} (Madu: ${maduList.length}, MDF: ${mdfList.length}, Rabtakar: ${rabtakarList.length}, Daeen: ${daeenList.length})
- Madueen Names: ${maduList.map((m: any) => `${m.fullName} (Unit: ${m.currentUnitId?.name || 'None'}, Rabtakar: ${m.primaryRabtakarId?.fullName || 'None'}, Status: ${m.operationalStatus || 'ACTIVE'})`).join('; ') || 'No Madu recorded yet'}
- Meetings in last 3 days: ${meetings3d.length} (${meetings3d.map((m: any) => `${m.personId?.fullName} with ${m.primaryDaeenId?.fullName}`).join(', ') || 'No meetings'})
- Meetings in last 7 days: ${meetings7d.length}
- Meetings in last 30 days: ${meetings30d.length}
- Total Dialogue Forums held: ${dfs.length}
- Total Group Meetings held: ${gms.length}
- Active RMMs: ${rmms.length} (${rmms.map((r: any) => `${r.unitId?.name}: target ${r.plannedMaduMeetings || 0} Madu`).join(', ')})
`;

    try {
      const prompt = `
Answer the user's question using the exact live workspace data below.
${stateSummary}

User's Question: "${question}"

Instructions:
1. If the user asks in Roman Urdu (e.g. "mujy sab maudeen ki list chahiya", "pichlay 3 dinu main kitni meetings hoi"), respond naturally and politely in Roman Urdu!
2. If the user asks in Urdu, respond in Urdu script.
3. If the user asks in English, respond in English.
4. Give exact, direct answers, and provide lists with formatting (bullet points or tables) when requested.
`;

      const responseText = await this.callGemini(prompt, false);
      return {
        answer: responseText,
        dataContext: {
          totalUnits: units.length,
          totalPeople: people.length,
          totalMeetings3d: meetings3d.length,
          totalMeetings7d: meetings7d.length
        }
      };
    } catch (err: any) {
      console.warn('Gemini Q&A fallback activated:', err.message);
      // Smart Rule-based responses for common Roman Urdu / English questions
      return this.heuristicAnswer(question, {
        units,
        maduList,
        mdfList,
        rabtakarList,
        daeenList,
        meetings3d,
        meetings7d,
        meetings30d
      });
    }
  }

  private static heuristicAnswer(question: string, data: any) {
    const q = question.toLowerCase();

    if (q.includes('madu') || q.includes('maudeen') || q.includes('madueen')) {
      const list = data.maduList.map((m: any, i: number) =>
        `${i + 1}. **${m.fullName}** — Unit: ${m.currentUnitId?.name || 'N/A'}, Rabtakar: ${m.primaryRabtakarId?.fullName || 'N/A'}, Status: ${m.operationalStatus || 'ACTIVE'}`
      ).join('\n');

      return {
        answer: `Aap ke sector mein total **${data.maduList.length}** Madueen darj hain:\n\n${list || 'Abhi tak koi Madu darj nahi kiya gaya.'}`,
        dataContext: { count: data.maduList.length }
      };
    }

    if (q.includes('3 din') || q.includes('3 days') || q.includes('teen din')) {
      return {
        answer: `Pichlay 3 dinon mein total **${data.meetings3d.length}** Individual Meetings (IM) munaqid hui hain.`,
        dataContext: { count: data.meetings3d.length }
      };
    }

    if (q.includes('7 din') || q.includes('hafte') || q.includes('week') || q.includes('sat din')) {
      return {
        answer: `Pichlay 7 dinon (hafte) mein total **${data.meetings7d.length}** Individual Meetings munaqid hui hain.`,
        dataContext: { count: data.meetings7d.length }
      };
    }

    if (q.includes('daeen') || q.includes('dae')) {
      const list = data.daeenList.map((d: any, i: number) => `${i + 1}. **${d.fullName}** (${d.internalId})`).join('\n');
      return {
        answer: `Sector mein total **${data.daeenList.length}** Daeen resources hain:\n\n${list || 'Koi Daeen mojood nahi.'}`,
        dataContext: { count: data.daeenList.length }
      };
    }

    if (q.includes('rabtakar') || q.includes('rbt')) {
      const list = data.rabtakarList.map((r: any, i: number) => `${i + 1}. **${r.fullName}** (${r.currentUnitId?.name || 'All Units'})`).join('\n');
      return {
        answer: `Sector mein total **${data.rabtakarList.length}** Rabtakar darj hain:\n\n${list || 'Koi Rabtakar mojood nahi.'}`,
        dataContext: { count: data.rabtakarList.length }
      };
    }

    return {
      answer: `Aap ka sawal mil gaya hai. Live workspace snapshot:\n- Total Units: ${data.units.length}\n- Total Madu: ${data.maduList.length}\n- Total MDF: ${data.mdfList.length}\n- Total Rabtakar: ${data.rabtakarList.length}\n- Total Daeen: ${data.daeenList.length}\n- Pichlay 3 dinon mein meetings: ${data.meetings3d.length}\n- Pichlay 7 dinon mein meetings: ${data.meetings7d.length}`,
      dataContext: {}
    };
  }
}
