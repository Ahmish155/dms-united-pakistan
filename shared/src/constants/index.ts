export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STANDARD_USER = 'STANDARD_USER'
}

export enum WorkspaceRole {
  SECTOR_SECRETARY = 'SECTOR_SECRETARY',
  SPECTATOR = 'SPECTATOR'
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED'
}

export enum PersonStage {
  MADU = 'MADU',
  MDF = 'MDF',
  RABTAKAR = 'RABTAKAR',
  OTHER = 'OTHER'
}

export enum OrganizationalResponsibility {
  RABTAKAR = 'RABTAKAR',
  DAEEN = 'DAEEN',
  MENTOR = 'MENTOR',
  UNIT_PRESIDENT = 'UNIT_PRESIDENT',
  UNIT_GENERAL_SECRETARY = 'UNIT_GENERAL_SECRETARY'
}

export enum ActivityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum DmmStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED'
}

export enum ParticipantCategory {
  RABTAKAR = 'RABTAKAR',
  MDF = 'MDF',
  DAEEN = 'DAEEN',
  MENTOR = 'MENTOR',
  MADU = 'MADU',
  OTHER = 'OTHER'
}

export const DEFAULT_THRESHOLDS = {
  maduDays: 14,
  mdfDays: 21,
  daeenDays: 21,
  dfDays: 30,
  gmDays: 30
};
