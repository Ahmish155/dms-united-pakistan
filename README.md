# United Pakistan — Dawati Management System (DMS)

> A modern, mobile-first centralized organizational management platform for United Pakistan.

[![CI](https://github.com/united-pakistan/dms/actions/workflows/ci.yml/badge.svg)](https://github.com/united-pakistan/dms/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)

## Overview
The Dawati Management System (DMS) digitizes the Dawati organizational management workflow across sectors. Initialized for **Sector Gulraiz** with native multi-workspace isolation to support multiple sectors.

---

## Complete Features Implemented

### 1. Multi-Tenant Workspace & Access Control
- **Strict Data Isolation**: Every sector record carries a mandatory `workspaceId` enforced via `workspaceScope.ts` middleware.
- **Role-Based Access Control (RBAC)**:
  - **Sector Secretary Dawat**: Full administrative rights within their sector workspace.
  - **Spectator / Viewer**: Read-only access with configurable report export permissions.
  - **Super Admin**: Infrastructure-level workspace creator; restricted from mutating workspace business data without explicit delegation.
- **Spectator Access Request Workflow**: Expirable invite links, registration, pending request queue, approval, and instant revocation with audit trails.

### 2. People Directory & Responsibility Engine
- Centralized people directory with auto-generated internal IDs (`UP-0001`, `UP-0002`).
- **Multi-Role Support**: Individuals can hold concurrent responsibilities (e.g., Rabtakar + Daeen, MDF + Rabtakar) without duplicate person records.
- **Promotions Engine**: Madu $\to$ MDF and MDF $\to$ Rabtakar with historical preservation in `PromotionHistoryModel`.
- **Unit Transfer Engine**: Unit transfers with historical lock in `UnitAssignmentHistoryModel` guaranteeing past meetings permanently retain their historical unit attribution.
- **Unit Officeholders**: Unit President and General Secretary assignments linked directly to people directory records.

### 3. Dynamic Activity Status Engine
- Real-time calculation of active/inactive statuses against configurable day thresholds in `WorkspaceSettingsModel`:
  - **Madu**: Active if last completed individual meeting is within `maduDays` (default 14 days).
  - **MDF**: Active if last meeting is within `mdfDays` (default 21 days).
  - **Rabtakar**: Active if $\ge 1$ associated Madu is active; inactive if all are inactive.
  - **Daeen**: Active if participated in a meeting within `daeenDays` (default 21 days).
  - **DF & GM Participation**: Separate status tracking against independent `dfDays` and `gmDays` thresholds.

### 4. Meeting & Planning Modules
- **Rapid Mobile Meeting Entry**: Fast touch-friendly logger (`/meetings/new`) with auto-population of Unit, Rabtakar, and default Daeen, additional Daeen multi-tagging, and duplicate meeting detection.
- **DMM Monthly Planning (`/dmm`)**: Monthly target sheets, unit-wise conclusions, sector summaries, actual vs planned variance calculations, and expected MSC/MDF count.
- **RMM Weekly Planning (`/rmm`)**: Weekly unit planning sheets, individual next-week targets, expected meeting days, and weekly progress tracking.
- **Community Activities (`/activities`)**: Dialogue Forum (DF) and Group Meeting (GM) session recording with mentor directory and participant attendance checklists.

### 5. Reporting & Multi-Format Exports
- **Weekly Dawati Report (`/reports`)**: Matches United Pakistan official format:
  - Weekly counts: IMs, DFs, RMMs, GMs
  - Month Progress (From 1st to Till Date): Total IMs, Total DFs
  - APP SYNCED: YES
  - Next Week Meetings Schedule: Madu & MDF rosters
- **1-Click WhatsApp Formatted Text Copy**: Ready to paste into executive WhatsApp groups.
- **Multi-Format Downloads**: Word document (`.doc`), Excel spreadsheet (`.csv`), Plain Text (`.txt`), and Print.

### 6. Analytics & Workspace Settings
- **Visual Analytics (`/analytics`)**: Recharts graphs for unit-by-unit meeting performance and people activity status health.
- **Executive Dashboard (`/`)**: Live operational cards for Madu, MDF, Rabtakar, and 7-day activities.
- **Workspace Settings (`/settings`)**: Threshold sliders, spectator export permissions toggle, invite link generator, and spectator approvals queue.

---

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose ODM, Zod, Helmet.
- **Database**: MongoDB Atlas M0 (Free Tier).
- **Deployment**: Free-tier-first (Vercel Frontend + Render Backend + Atlas M0).

---

## Project Structure
```
DMS/
├── shared/            # Shared TypeScript types, constants & Zod validators
├── server/            # Modular Express backend (Modules: auth, workspaces, units, people, meetings, dmm, rmm, df, gm, reports, settings)
├── client/            # Mobile-first React SPA (Vite + Tailwind CSS + shadcn/ui design tokens)
└── docs/              # Comprehensive SRS, FRS, Architecture, Schema & Deployment docs
```

---

## Getting Started (Local Development)

### 1. Prerequisites
- Node.js $\ge 20$
- npm $\ge 10$
- MongoDB (Local or Atlas connection string)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/united-pakistan/dms.git
cd dms

# Install all monorepo dependencies
npm install

# Build shared types package
npm run build:shared
```

### 3. Environment Configuration
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/dms
JWT_SECRET=dev_jwt_secret_dms_united_pakistan_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 4. Seed Demonstration Data (Sector Gulraiz)
```bash
npm run build:server
node server/dist/seed.js
```
**Demo Accounts:**
- **Sector Secretary**: `secretary.gulraiz@dms.pk` / `GulraizSec2026!`
- **Spectator Viewer**: `viewer@dms.pk` / `Viewer2026!`

### 5. Running the Application
```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Frontend SPA
npm run dev:client
```
Visit `http://localhost:3000` in your browser.

---

## Running Automated Tests
```bash
# Run all backend integration suites
npm run test:server
```
**Test Coverage:** 18 passing integration tests across 7 suites in in-memory MongoDB.

---

## Documentation
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — Persistent project context & architecture state
- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture specification
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — MongoDB schema documentation
- [SRS.md](SRS.md) — Software Requirements Specification
- [FRS.md](FRS.md) — Functional Requirements Specification
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — Design tokens & responsive mobile UX rules
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — Complete REST API catalog
- [TESTING.md](TESTING.md) — Test strategy and execution guide
- [DEPLOYMENT.md](DEPLOYMENT.md) — Free-tier deployment operational guide
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [BACKLOG.md](BACKLOG.md) — Future enhancements backlog
