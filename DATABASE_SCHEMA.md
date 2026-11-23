# Database Schema Specification
# United Pakistan — Dawati Management System (DMS)

## Overview
MongoDB Atlas M0 is utilized as the primary persistence store. All sector-owned documents carry a `workspaceId` referencing the `workspaces` collection with compound indexing for tenant-isolated lookups.

## Collections & Entity Relationship Summary

### 1. `users`
- `_id`: ObjectId
- `email`: String (Unique, Lowercase, Indexed)
- `passwordHash`: String
- `name`: String
- `systemRole`: Enum (`SUPER_ADMIN`, `STANDARD_USER`)
- `status`: Enum (`ACTIVE`, `SUSPENDED`)
- `createdAt`, `updatedAt`: Date

### 2. `workspaces`
- `_id`: ObjectId
- `name`: String ("Sector Gulraiz")
- `code`: String (Unique, "GULRAIZ")
- `status`: Enum (`ACTIVE`, `ARCHIVED`)
- `createdById`: ObjectId -> `users`
- `createdAt`, `updatedAt`: Date

### 3. `workspaceMembers`
- `_id`: ObjectId
- `workspaceId`: ObjectId -> `workspaces` (Indexed)
- `userId`: ObjectId -> `users` (Indexed)
- `role`: Enum (`SECTOR_SECRETARY`, `SPECTATOR`)
- `grantedBy`: ObjectId -> `users`
- `permissions`: Object (`canExportReports`: Boolean)
- **Index**: Unique compound `{ workspaceId: 1, userId: 1 }`

### 4. `accessRequests`
- `_id`: ObjectId
- `workspaceId`: ObjectId -> `workspaces`
- `userId`: ObjectId -> `users`
- `token`: String (Unique, Expirable)
- `status`: Enum (`PENDING`, `APPROVED`, `REJECTED`, `REVOKED`)
- `requestedAt`: Date
- `decidedBy`: ObjectId -> `users`
- `decidedAt`: Date

### 5. `workspaceSettings`
- `_id`: ObjectId
- `workspaceId`: ObjectId -> `workspaces` (Unique Index)
- `thresholds`:
  - `maduDays`: Number (Default: 14)
  - `mdfDays`: Number (Default: 21)
  - `daeenDays`: Number (Default: 21)
  - `dfDays`: Number (Default: 30)
  - `gmDays`: Number (Default: 30)
- `allowSpectatorExports`: Boolean (Default: false)

### 6. `units`
- `_id`: ObjectId
- `workspaceId`: ObjectId -> `workspaces`
- `name`: String (e.g. "Morgah", "Lalkurti", "Comsats", "Hostel City")
- `code`: String
- `presidentPersonId`: ObjectId -> `people` (Nullable)
- `generalSecretaryPersonId`: ObjectId -> `people` (Nullable)
- `isActive`: Boolean
- **Index**: Unique compound `{ workspaceId: 1, name: 1 }`

### 7. `people`
- `_id`: ObjectId
- `workspaceId`: ObjectId -> `workspaces` (Indexed)
- `internalId`: String (Unique per workspace)
- `fullName`: String
- `contactNumber`: String (Optional, sensitive)
- `currentUnitId`: ObjectId -> `units`
- `currentStage`: Enum (`MADU`, `MDF`, `RABTAKAR`, `OTHER`)
- `roles`: Array of Enums (`RABTAKAR`, `DAEEN`, `MENTOR`, `UNIT_PRESIDENT`, `UNIT_GENERAL_SECRETARY`)
- `primaryRabtakarId`: ObjectId -> `people` (Nullable)
- `defaultDaeenId`: ObjectId -> `people` (Nullable)
- `notes`: String
- `isArchived`: Boolean
- **Index**: `{ workspaceId: 1, currentUnitId: 1 }`, `{ workspaceId: 1, currentStage: 1 }`

### 8. `responsibilityAssignments`
- `_id`: ObjectId
- `workspaceId`: ObjectId
- `personId`: ObjectId -> `people`
- `responsibilityType`: String
- `assignedAt`: Date
- `revokedAt`: Date (Nullable)
- `isCurrent`: Boolean

### 9. `unitAssignmentHistory`
- `_id`: ObjectId
- `workspaceId`: ObjectId
- `personId`: ObjectId -> `people`
- `fromUnitId`: ObjectId -> `units`
- `toUnitId`: ObjectId -> `units`
- `transferredAt`: Date
- `transferredBy`: ObjectId -> `users`
- `notes`: String

### 10. `promotionHistory`
- `_id`: ObjectId
- `workspaceId`: ObjectId
- `personId`: ObjectId -> `people`
- `fromStage`: String
- `toStage`: String
- `promotedAt`: Date
- `promotedBy`: ObjectId -> `users`
- `remarks`: String

### 11. `individualMeetings`
- `_id`: ObjectId
- `workspaceId`: ObjectId (Indexed)
- `unitId`: ObjectId -> `units` (Unit at the time of meeting)
- `personId`: ObjectId -> `people` (Madu or MDF)
- `personStageAtTime`: Enum (`MADU`, `MDF`)
- `rabtakarId`: ObjectId -> `people`
- `primaryDaeenId`: ObjectId -> `people`
- `additionalDaeenIds`: Array of ObjectId -> `people`
- `meetingDate`: Date (Indexed)
- `meetingNumber`: Number
- `comments`: String
- `createdById`: ObjectId -> `users`
- **Index**: `{ workspaceId: 1, meetingDate: -1 }`, `{ workspaceId: 1, personId: 1, meetingDate: -1 }`

### 12. `dmms` & `dmmTargets`
- `dmms`: `_id`, `workspaceId`, `month`: Number, `year`: Number, `status` (`DRAFT` | `FINALIZED`), `expectedMscCount`, `expectedMdfCount`
- `dmmTargets`: `_id`, `workspaceId`, `dmmId`, `unitId`, `personId`, `targetMeetings`: Number, `rabtakarId`, `daeenId`, `category`

### 13. `rmms` & `rmmTargets`
- `rmms`: `_id`, `workspaceId`, `unitId`, `rmmDate`: Date, `weekStartDate`: Date, `weekEndDate`: Date, `comments`
- `rmmTargets`: `_id`, `workspaceId`, `rmmId`, `personId`, `category`, `nextWeekTarget`: Number, `expectedDay`: String

### 14. `dialogueForums`, `dfMentors` & `dfAttendance`
- `dfMentors`: `_id`, `workspaceId`, `personId` (Nullable), `name`, `contact`, `specialization`, `isActive`
- `dialogueForums`: `_id`, `workspaceId`, `unitId`, `date`: Date, `mentorId`: ObjectId, `topic`, `comments`
- `dfAttendance`: `_id`, `workspaceId`, `dfId`, `personId`, `category` (`RABTAKAR`, `MDF`, `DAEEN`, `MENTOR`), `status`

### 15. `groupMeetings` & `gmAttendance`
- `groupMeetings`: `_id`, `workspaceId`, `unitId`, `date`: Date, `facilitatorPersonId`, `topic`, `comments`
- `gmAttendance`: `_id`, `workspaceId`, `gmId`, `personId`, `category`, `status`

### 16. `auditLogs`
- `_id`: ObjectId
- `workspaceId`: ObjectId (Indexed)
- `userId`: ObjectId -> `users`
- `action`: String
- `entityType`: String
- `entityId`: ObjectId
- `previousState`: Object
- `newState`: Object
- `ipAddress`: String
- `timestamp`: Date (Indexed)
