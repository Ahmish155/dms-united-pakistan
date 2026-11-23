# PROJECT_CONTEXT.md
# United Pakistan — Dawati Management System (DMS)

## Project Overview
The **Dawati Management System (DMS)** is a centralized organizational management platform for **United Pakistan** to digitize and manage the Dawati process.
- **Initial Workspace**: Sector Gulraiz
- **Architecture**: Multi-tenant workspace architecture supporting multiple sectors with strict data isolation
- **Tech Stack**: MERN Stack with TypeScript (MongoDB Atlas, Express.js, React, Node.js, Vite, Tailwind CSS, shadcn/ui)
- **Deployment Strategy**: Free-tier-first (MongoDB Atlas M0, Render Web Service, Vercel Hobby, GitHub Actions)
- **Primary Interface**: Mobile-first responsive web application

## Key Organizational Terminology
- **Sector**: Organizational area containing multiple units (e.g. Sector Gulraiz)
- **Unit**: Subdivision of a sector (e.g. Morgah, Lalkurti, Comsats, Hostel City)
- **Secretary Dawat**: Primary workspace administrator for a sector
- **Rabtakar (RBT)**: Active member maintaining contact with a new person
- **Madu**: New person whose meetings are being conducted
- **Daeen (DAE)**: Assigned mentor / spokesperson conducting individual meetings
- **MDF**: Person promoted from Madu to the next organizational stage
- **DMM**: Monthly Dawati Management Meeting
- **RMM**: Weekly meeting conducted by a unit to plan upcoming meetings
- **IM**: Individual Meeting
- **DF**: Dialogue Forum
- **GM**: Group Meeting
- **T.M**: Target Meetings
- **MSC**: Reporting/promotion category (pending final organizational definition)

## Current Status
- **Current Milestone**: Core Modules Complete (Sprints 0 through 8 Implemented & Verified).
- **Git Repository**: Initialized with `main` branch.
- **Completed Modules**:
  - `@dms/shared`: Core TypeScript interfaces, organizational constants, Zod validation schemas.
  - `@dms/server`: Express.js backend with Mongoose ODM, Helmet, Rate Limiting, CORS, JWT Authentication, and multi-tenant isolation middleware (`workspaceScope.ts`).
  - **Units Module**: Unit CRUD, unique name/code per sector, leadership assignment (Unit President & General Secretary).
  - **People Module**: Centralized directory, unique internal ID generation (`UP-XXXX`), multi-role assignment (Rabtakar, Daeen, Mentor, Unit officeholders), primary Rabtakar & default Daeen assignment.
  - **Promotions & Transfers**: Madu $\to$ MDF and MDF $\to$ Rabtakar with historical preservation in `PromotionHistoryModel` and unit transfers with historical lock in `UnitAssignmentHistoryModel`.
  - **Dynamic Activity Status Engine**: Real-time status calculator evaluating Madu, MDF, Rabtakar, Daeen, and participation activity against configurable sector thresholds in `WorkspaceSettingsModel`.
  - **Individual Meetings**: Fast mobile meeting entry, auto-population of unit and mentor assignments, duplicate detection warning, audit logs, meeting history logs.
  - **DMM Monthly Planning**: Monthly target entry, unit-wise conclusions, sector summaries, actual vs planned variance calculations, and expected MSC/MDF count.
  - **RMM Weekly Planning**: Weekly planning sheets, next-week individual targets, expected day planning, and real-time weekly progress tracking.
  - **Community Activities (DF & GM)**: Dialogue Forum and Group Meeting sessions with mentor directory, multi-category participant attendance checklists, and independent participation analytics.
  - **Reporting & Exports**: Weekly Dawati Report matching United Pakistan standard, WhatsApp clipboard formatter, Word (.doc), Excel (.csv), Plain Text, and Print exports.
  - **Analytics & Trends**: Recharts visual breakdown of completed meetings by unit and people activity status health.
  - **Workspace Settings**: Threshold sliders (`maduDays`, `mdfDays`, `daeenDays`, `dfDays`, `gmDays`), spectator export permission toggle, spectator invite link generator, and access request approval queue.
  - **Automated Integration Tests**: 18/18 passing integration tests across 7 test suites in in-memory MongoDB.
  - **Frontend Client**: Full responsive React SPA with navigation suite (Navbar, Desktop Sidebar, Mobile Drawer, Mobile Bottom Navigation) and all feature pages.
- **Next Milestone**: Sprint 9 — Production Readiness, Security Review, and Deployment Operational Guide.

## Core Architectural Decisions
1. **Multi-Tenancy**: Every sector has an isolated workspace. All database queries for sector data strictly enforce `{ workspaceId }` scoping via middleware.
2. **Access Control**:
   - **Super Admin**: Platform-level workspace creator; restricted from modifying workspace business data without explicit Sector Secretary delegation.
   - **Sector Secretary Dawat**: Full administrative rights within their assigned sector workspace.
   - **Spectator / Viewer**: Read-only access requiring approval via access-request link; revokable at any time.
3. **Activity Engine**: Dynamic calculation of Madu, MDF, Rabtakar, Daeen, DF, and GM active/inactive statuses based on configurable thresholds.
4. **Historical Attribution**: When people change units or get promoted, historical individual meetings retain their historical unit and responsibility attribution.
5. **No AI/Paid Services**: Purely free-tier and open-source standard libraries.
