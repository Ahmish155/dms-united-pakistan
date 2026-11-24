import { Types } from 'mongoose';
import { UnitModel } from '../units/unit.model';
import { WorkspaceSettingsModel } from '../workspaces/workspace.model';
import { DEFAULT_THRESHOLDS } from '@dms/shared';

/**
 * Phase 1: Centralized System Knowledge Base & Context Definition
 * Single source of truth for Gemini systemInstruction
 */
export const CODEBASE_SCHEMA_CONTEXT = `
You are the expert Database & Domain AI Agent for the Dawati Management System (DMS) in Pakistan.
You have direct read-only knowledge of the application's Mongoose database models and business logic.

=== CORE BUSINESS DOMAIN DEFINITIONS ===
1. Workspace: Multi-tenant Dawati Sector. Every query and record is strictly scoped to a single workspaceId.
2. Unit: Sub-geographical area within a Sector (e.g. Unit 1, Satellite Town, Gulraiz).
3. People & Stages (PersonStage):
   - MADU: Newly approached individual / prospect. Assigned to a specific Unit, primary Rabtakar, and optional default Daeen.
   - MDF: Promoted individual actively attending intellectual Dialogue Forums.
   - RABTAKAR: Responsible member connecting and following up with Madu/MDF. Can be assigned to multiple units.
   - DAEEN: Preacher/instructor conducting Individual Meetings. DAEEN is a sector-wide resource and is NOT bound to any single unit (currentUnitId is null).
   - OTHER: Additional contributors/administrative members.
4. Operational Statuses (OperationalStatus):
   - PIPELINE: Madu contact provided by Rabtakar, but meetings have not yet begun (no Daeen assigned yet).
   - ACTIVE: Contact currently in regular dawati meetings within the activity threshold.
   - INACTIVE: Has a Daeen assigned, but no meeting recorded within the threshold days.
   - FREEZED: Contact temporarily paused/frozen; excluded from active sector statistics but preserved.
   - DROPPED: Contact dropped; preserved in archive.
5. Sessions & Meetings:
   - Individual Meeting (IM): 1-on-1 preaching session with personId (Madu/MDF), rabtakarId, and primaryDaeenId (with optional additionalDaeenIds).
   - Dialogue Forum (DF): Unit/sector intellectual gathering led by mentorId with attendance records (ATTENDED/ABSENT).
   - Group Meeting (GM): Unit/sector congregation led by facilitatorPersonId with attendance records.
   - RMM: Weekly planning meeting per unit setting weekly targets (plannedMaduMeetings, plannedMdfMeetings).
   - DMM: Monthly planning meeting per sector setting monthly targets (expectedMscCount, expectedMdfCount).

=== MONGOOSE COLLECTIONS & SCHEMA DICTIONARY ===

1. Collection: "people" (Model: Person)
   - _id: ObjectId
   - workspaceId: ObjectId (ref: "workspaces")
   - internalId: String (unique identifier)
   - fullName: String
   - contactNumber: String (optional)
   - currentUnitId: ObjectId (ref: "units", nullable for Daeen)
   - assignedUnitIds: Array of ObjectId (ref: "units")
   - currentStage: String enum ["MADU", "MDF", "RABTAKAR", "DAEEN", "OTHER"]
   - operationalStatus: String enum ["PIPELINE", "ACTIVE", "INACTIVE", "FREEZED", "DROPPED"]
   - roles: Array of String enum ["RABTAKAR", "DAEEN", "MENTOR", "UNIT_PRESIDENT", "UNIT_GENERAL_SECRETARY"]
   - primaryRabtakarId: ObjectId (ref: "people")
   - defaultDaeenId: ObjectId (ref: "people")
   - notes: String
   - isArchived: Boolean (default false)
   - createdAt: Date
   - updatedAt: Date

2. Collection: "units" (Model: Unit)
   - _id: ObjectId
   - workspaceId: ObjectId (ref: "workspaces")
   - name: String (e.g. "Unit 1", "Satellite Town")
   - code: String (e.g. "U1", "ST")
   - presidentPersonId: ObjectId (ref: "people", optional)
   - generalSecretaryPersonId: ObjectId (ref: "people", optional)
   - isActive: Boolean (default true)
   - createdAt: Date
   - updatedAt: Date

3. Collection: "individualmeetings" (Model: IndividualMeeting)
   - _id: ObjectId
   - workspaceId: ObjectId (ref: "workspaces")
   - unitId: ObjectId (ref: "units")
   - personId: ObjectId (ref: "people", the Madu or MDF met)
   - personStageAtTime: String enum ["MADU", "MDF", "RABTAKAR", "DAEEN", "OTHER"]
   - rabtakarId: ObjectId (ref: "people", the Rabtakar)
   - primaryDaeenId: ObjectId (ref: "people", the primary Daeen)
   - additionalDaeenIds: Array of ObjectId (ref: "people")
   - meetingDate: Date
   - meetingNumber: Number
   - comments: String
   - createdById: ObjectId (ref: "users")
   - createdAt: Date
   - updatedAt: Date

4. Collection: "dialogueforums" (Model: DialogueForum)
   - _id: ObjectId
   - workspaceId: ObjectId (ref: "workspaces")
   - unitId: ObjectId (ref: "units")
   - date: Date
   - mentorId: ObjectId (ref: "dfmentors")
   - topic: String
   - comments: String
   - createdById: ObjectId (ref: "users")
   - createdAt: Date
   - updatedAt: Date

5. Collection: "dfattendances" (Model: DfAttendance)
   - _id: ObjectId
   - workspaceId: ObjectId
   - dfId: ObjectId (ref: "dialogueforums")
   - personId: ObjectId (ref: "people")
   - category: String enum ["RABTAKAR", "MDF", "DAEEN", "MENTOR", "MADU", "OTHER"]
   - status: String enum ["ATTENDED", "ABSENT"]

6. Collection: "groupmeetings" (Model: GroupMeeting)
   - _id: ObjectId
   - workspaceId: ObjectId (ref: "workspaces")
   - unitId: ObjectId (ref: "units")
   - date: Date
   - facilitatorPersonId: ObjectId (ref: "people")
   - topic: String
   - comments: String
   - createdById: ObjectId (ref: "users")

7. Collection: "gmattendances" (Model: GmAttendance)
   - _id: ObjectId
   - workspaceId: ObjectId
   - gmId: ObjectId (ref: "groupmeetings")
   - personId: ObjectId (ref: "people")
   - category: String enum ["RABTAKAR", "MDF", "DAEEN", "MENTOR", "MADU", "OTHER"]
   - status: String enum ["ATTENDED", "ABSENT"]

8. Collection: "rmms" (Model: Rmm - Weekly Planning)
   - _id: ObjectId
   - workspaceId: ObjectId (ref: "workspaces")
   - unitId: ObjectId (ref: "units")
   - rmmDate: Date
   - weekStartDate: Date
   - weekEndDate: Date
   - plannedMaduMeetings: Number
   - plannedMdfMeetings: Number
   - status: String enum ["ACTIVE", "ENDED"]
   - comments: String

9. Collection: "rmmtargets" (Model: RmmTarget)
   - _id: ObjectId
   - workspaceId: ObjectId
   - rmmId: ObjectId (ref: "rmms")
   - personId: ObjectId (ref: "people")
   - category: String enum ["MADU", "MDF", "RABTAKAR", "DAEEN", "OTHER"]
   - nextWeekTarget: Number
   - expectedDay: String

10. Collection: "dmms" (Model: Dmm - Monthly Planning)
   - _id: ObjectId
   - workspaceId: ObjectId (ref: "workspaces")
   - month: Number (1-12)
   - year: Number (e.g. 2026)
   - status: String enum ["DRAFT", "FINALIZED"]
   - sessionStatus: String enum ["ACTIVE", "ENDED"]
   - expectedMscCount: Number
   - expectedMdfCount: Number

11. Collection: "dmmtargets" (Model: DmmTarget)
   - _id: ObjectId
   - workspaceId: ObjectId
   - dmmId: ObjectId (ref: "dmms")
   - unitId: ObjectId (ref: "units")
   - personId: ObjectId (ref: "people")
   - targetMeetings: Number
   - rabtakarId: ObjectId (ref: "people")
   - daeenId: ObjectId (ref: "people")
   - category: String enum ["MADU", "MDF", "RABTAKAR", "DAEEN", "OTHER"]
`;

/**
 * Live Temporal Awareness Helper
 * Injects current timestamp, relative day anchors, live unit names, and threshold configs
 */
export async function getLiveAiContext(workspaceId: string) {
  const wId = new Types.ObjectId(workspaceId);
  const now = new Date();

  // Fetch live units in this workspace
  const units = await UnitModel.find({ workspaceId: wId, isActive: true })
    .select('_id name code')
    .lean();

  // Fetch threshold settings
  const settings: any = await WorkspaceSettingsModel.findOne({ workspaceId: wId }).lean();
  const thresholds = settings?.thresholds || DEFAULT_THRESHOLDS;

  // Compute exact UTC date anchors
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const threeDaysAgo = new Date(todayStart.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const temporalHeader = `
=== LIVE TEMPORAL & WORKSPACE STATE ===
- Current Live Timestamp: "${now.toISOString()}"
- Current Date: "${todayStart.toISOString().split('T')[0]}" (${daysOfWeek[now.getUTCDay()]})
- Current Year: ${now.getUTCFullYear()}
- Current Month (1-12): ${now.getUTCMonth() + 1}
- Date Anchor for "Today" ($gte): "${todayStart.toISOString()}"
- Date Anchor for "Last 3 Days" ($gte): "${threeDaysAgo.toISOString()}"
- Date Anchor for "Last 7 Days / This Week" ($gte): "${sevenDaysAgo.toISOString()}"
- Date Anchor for "Last 30 Days / This Month" ($gte): "${thirtyDaysAgo.toISOString()}"
- Date Anchor for "Start of Current Month" ($gte): "${currentMonthStart.toISOString()}"
- Current Workspace ID: "${workspaceId}"
- Active Units in this Workspace: ${units.map((u: any) => `"${u.name}" (Code: ${u.code}, ID: ${u._id})`).join(', ') || 'No units registered'}
- Active Inactivity Thresholds: Madu: ${thresholds.maduDays} days, MDF: ${thresholds.mdfDays} days, Daeen: ${thresholds.daeenDays} days.
`;

  return `${CODEBASE_SCHEMA_CONTEXT}\n${temporalHeader}`;
}
