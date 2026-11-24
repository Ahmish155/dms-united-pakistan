import {
  SystemRole,
  WorkspaceRole,
  AccessRequestStatus,
  PersonStage,
  OrganizationalResponsibility,
  ActivityStatus,
  OperationalStatus,
  DmmStatus,
  ParticipantCategory
} from '../constants';

export interface IUser {
  id: string;
  email: string;
  name: string;
  systemRole: SystemRole;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  createdAt: string;
}

export interface IWorkspace {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdById: string;
  createdAt: string;
}

export interface IWorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  grantedBy: string;
  permissions: {
    canExportReports: boolean;
  };
}

export interface IAccessRequest {
  id: string;
  workspaceId: string;
  userId: string;
  token: string;
  status: AccessRequestStatus;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface IWorkspaceSettings {
  workspaceId: string;
  thresholds: {
    maduDays: number;
    mdfDays: number;
    daeenDays: number;
    dfDays: number;
    gmDays: number;
  };
  allowSpectatorExports: boolean;
}

export interface IUnit {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  presidentPersonId?: string;
  generalSecretaryPersonId?: string;
  isActive: boolean;
}

export interface IPerson {
  id: string;
  workspaceId: string;
  internalId: string;
  fullName: string;
  contactNumber?: string;
  currentUnitId?: string | null;
  assignedUnitIds?: string[];
  currentStage: PersonStage;
  operationalStatus?: OperationalStatus;
  roles: OrganizationalResponsibility[];
  primaryRabtakarId?: string;
  defaultDaeenId?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IIndividualMeeting {
  id: string;
  workspaceId: string;
  unitId: string;
  personId: string;
  personStageAtTime: PersonStage;
  rabtakarId: string;
  primaryDaeenId: string;
  additionalDaeenIds: string[];
  meetingDate: string;
  meetingNumber: number;
  comments?: string;
  createdById: string;
  createdAt: string;
}

export interface IDmm {
  id: string;
  workspaceId: string;
  month: number;
  year: number;
  status: DmmStatus;
  expectedMscCount: number;
  expectedMdfCount: number;
  createdById: string;
  createdAt: string;
}

export interface IDmmTarget {
  id: string;
  workspaceId: string;
  dmmId: string;
  unitId: string;
  personId: string;
  targetMeetings: number;
  rabtakarId: string;
  daeenId: string;
  category: PersonStage;
}

export interface IRmm {
  id: string;
  workspaceId: string;
  unitId: string;
  rmmDate: string;
  weekStartDate: string;
  weekEndDate: string;
  plannedMaduMeetings?: number;
  plannedMdfMeetings?: number;
  totalPlannedMeetings?: number;
  comments?: string;
  createdById: string;
}

export interface IRmmTarget {
  id: string;
  workspaceId: string;
  rmmId: string;
  personId: string;
  category: PersonStage;
  nextWeekTarget: number;
  expectedDay?: string;
}

export interface IDfMentor {
  id: string;
  workspaceId: string;
  personId?: string;
  name: string;
  contact?: string;
  specialization?: string;
  isActive: boolean;
}

export interface IDialogueForum {
  id: string;
  workspaceId: string;
  unitId: string;
  date: string;
  mentorId: string;
  topic?: string;
  comments?: string;
  createdById: string;
}

export interface IDfAttendance {
  id: string;
  workspaceId: string;
  dfId: string;
  personId: string;
  category: ParticipantCategory;
  status: 'ATTENDED' | 'ABSENT';
}

export interface IGroupMeeting {
  id: string;
  workspaceId: string;
  unitId: string;
  date: string;
  facilitatorPersonId?: string;
  topic?: string;
  comments?: string;
  createdById: string;
}

export interface IGmAttendance {
  id: string;
  workspaceId: string;
  gmId: string;
  personId: string;
  category: ParticipantCategory;
  status: 'ATTENDED' | 'ABSENT';
}
