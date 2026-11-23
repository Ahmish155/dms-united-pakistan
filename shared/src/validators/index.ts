import { z } from 'zod';
import {
  SystemRole,
  WorkspaceRole,
  PersonStage,
  OrganizationalResponsibility,
  ParticipantCategory,
  DmmStatus
} from '../constants';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  systemRole: z.nativeEnum(SystemRole).optional()
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2).max(20).toUpperCase()
});

export const createUnitSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(20).toUpperCase(),
  presidentPersonId: z.string().optional(),
  generalSecretaryPersonId: z.string().optional()
});

export const createPersonSchema = z.object({
  fullName: z.string().min(2),
  contactNumber: z.string().optional(),
  currentUnitId: z.string(),
  currentStage: z.nativeEnum(PersonStage),
  roles: z.array(z.nativeEnum(OrganizationalResponsibility)).default([]),
  primaryRabtakarId: z.string().optional(),
  defaultDaeenId: z.string().optional(),
  notes: z.string().optional()
});

export const recordMeetingSchema = z.object({
  personId: z.string(),
  rabtakarId: z.string().optional(),
  primaryDaeenId: z.string().optional(),
  additionalDaeenIds: z.array(z.string()).default([]),
  meetingDate: z.string(), // ISO date
  meetingNumber: z.number().int().positive().optional(),
  comments: z.string().optional()
});

export const dmmTargetSchema = z.object({
  unitId: z.string(),
  personId: z.string(),
  targetMeetings: z.number().int().nonnegative(),
  rabtakarId: z.string(),
  daeenId: z.string(),
  category: z.nativeEnum(PersonStage)
});

export const createDmmSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2050),
  status: z.nativeEnum(DmmStatus).default(DmmStatus.DRAFT),
  expectedMscCount: z.number().int().nonnegative().default(0),
  expectedMdfCount: z.number().int().nonnegative().default(0),
  targets: z.array(dmmTargetSchema).default([])
});

export const rmmTargetSchema = z.object({
  personId: z.string(),
  category: z.nativeEnum(PersonStage),
  nextWeekTarget: z.number().int().nonnegative(),
  expectedDay: z.string().optional()
});

export const createRmmSchema = z.object({
  unitId: z.string(),
  rmmDate: z.string(),
  weekStartDate: z.string(),
  weekEndDate: z.string(),
  plannedMaduMeetings: z.number().int().nonnegative().default(0),
  plannedMdfMeetings: z.number().int().nonnegative().default(0),
  comments: z.string().optional(),
  targets: z.array(rmmTargetSchema).default([])
});

export const updateSettingsSchema = z.object({
  thresholds: z.object({
    maduDays: z.number().int().positive().optional(),
    mdfDays: z.number().int().positive().optional(),
    daeenDays: z.number().int().positive().optional(),
    dfDays: z.number().int().positive().optional(),
    gmDays: z.number().int().positive().optional()
  }).optional(),
  allowSpectatorExports: z.boolean().optional()
});
