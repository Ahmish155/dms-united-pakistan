# REST API Specification
# United Pakistan — Dawati Management System (DMS)

## Overview
All API endpoints are prefixed with `/api/v1`. Protected workspace routes require the `Authorization: Bearer <token>` header (or httpOnly auth cookie) and `x-workspace-id: <workspaceId>`.

## Core Endpoint Catalog

### 1. Authentication & Workspaces
- `POST /api/v1/auth/login` — Authenticate and receive JWT/session
- `POST /api/v1/auth/register` — User registration (admin-only or invitation)
- `POST /api/v1/auth/logout` — Revoke session
- `GET /api/v1/workspaces` — List workspaces user belongs to
- `POST /api/v1/workspaces` — Create new workspace (Super Admin)
- `POST /api/v1/workspaces/:workspaceId/access-links` — Generate spectator invite link
- `POST /api/v1/workspaces/access-requests` — Submit spectator access request
- `GET /api/v1/workspaces/:workspaceId/access-requests` — List pending spectator requests
- `PATCH /api/v1/workspaces/:workspaceId/access-requests/:id` — Approve/Reject/Revoke access

### 2. Units & People Management
- `GET /api/v1/units` — List units in active workspace
- `POST /api/v1/units` — Create unit
- `PATCH /api/v1/units/:id` — Update unit leadership
- `GET /api/v1/people` — List directory (filters: stage, role, unit, status)
- `POST /api/v1/people` — Add person
- `GET /api/v1/people/:id` — Person profile with full history & stats
- `PATCH /api/v1/people/:id` — Update person details
- `POST /api/v1/people/:id/transfer` — Transfer person to another unit
- `POST /api/v1/people/:id/promote` — Promote Madu to MDF or MDF to Rabtakar

### 3. Individual Meetings
- `GET /api/v1/meetings` — List completed individual meetings with filters
- `POST /api/v1/meetings` — Record completed meeting (duplicate validation)
- `GET /api/v1/meetings/:id` — Meeting details
- `PATCH /api/v1/meetings/:id` — Authorized edit with audit log
- `DELETE /api/v1/meetings/:id` — Authorized soft-delete with audit log

### 4. DMM & RMM Planning
- `GET /api/v1/dmm` — List monthly DMM plans
- `POST /api/v1/dmm` — Create/Update monthly plan and target entries
- `GET /api/v1/dmm/:id/variance` — Actual vs planned targets calculation
- `GET /api/v1/rmm` — List weekly RMM plans
- `POST /api/v1/rmm` — Create/Update weekly targets
- `GET /api/v1/rmm/:id/variance` — Weekly actual vs planned progress

### 5. Dialogue Forums & Group Meetings
- `GET /api/v1/df/mentors` — DF mentor directory
- `POST /api/v1/df/mentors` — Register DF mentor
- `GET /api/v1/df` — List Dialogue Forums
- `POST /api/v1/df` — Record DF session with participant attendance
- `GET /api/v1/gm` — List Group Meetings
- `POST /api/v1/gm` — Record GM session with participant attendance
- `GET /api/v1/activities/analytics` — DF & GM attendance analytics

### 6. Analytics, Reports & Settings
- `GET /api/v1/analytics/dashboard` — Executive sector dashboard figures
- `GET /api/v1/reports/weekly` — Weekly Dawati Report data
- `GET /api/v1/reports/monthly` — Monthly Dawati Report data
- `GET /api/v1/reports/export/:format` — Download report (`pdf`, `xlsx`, `docx`, `txt`)
- `GET /api/v1/settings` — Get workspace threshold settings
- `PATCH /api/v1/settings` — Update activity thresholds & permissions
