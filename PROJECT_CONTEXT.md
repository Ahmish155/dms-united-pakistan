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
- **Current Milestone**: Sprint 2 (Organizational Management) & Sprint 3 (Promotions, Unit Transfers & Dynamic Activity Engine) Completed.
- **Git Repository**: Initialized with `main` branch.
- **Completed Modules**:
  - `@dms/shared`: Core TypeScript interfaces, organizational constants, Zod validation schemas.
  - `@dms/server`: Express.js backend with Mongoose ODM, Helmet security headers, Rate Limiting, CORS, JWT Authentication, and strict multi-tenant isolation middleware (`workspaceScope.ts`).
  - **Units Module**: Unit CRUD, unique name/code validation per sector, leadership assignment (Unit President & General Secretary).
  - **People Module**: Centralized directory, unique internal ID generation (`UP-XXXX`), multi-role assignment (Rabtakar, Daeen, Mentor, Unit officeholders), primary Rabtakar & default Daeen assignment.
  - **Promotion Workflows**: Madu $\to$ MDF and MDF $\to$ Rabtakar with historical preservation in `PromotionHistoryModel` and audit logs.
  - **Unit Transfer Engine**: Unit transfers with complete historical lock in `UnitAssignmentHistoryModel` guaranteeing past meetings remain attributed to past units.
  - **Dynamic Activity Status Engine**: Real-time status calculator evaluating Madu, MDF, Rabtakar, Daeen, and participation activity against configurable sector thresholds in `WorkspaceSettingsModel`.
  - **Frontend Views**:
    - `UnitsPage`: Responsive unit cards, leadership indicators, Add Unit modal.
    - `PeoplePage`: Category filter tabs (Madu, MDF, Rabtakar, Daeen), search by name/ID, unit filter, dynamic active/inactive status badges, Add Person modal, Promote modal, and Transfer Unit modal.
    - `PersonProfilePage`: Comprehensive profile view with historical meetings table, promotion timeline, transfer timeline, and associated Madu list for Rabtakars.
  - **Automated Integration Tests**: 12/12 passing integration tests in in-memory MongoDB across Auth, Workspaces, Units, People & Promotions, and the Dynamic Activity Engine.
- **Next Milestone**: Sprint 4 — Individual Meeting Management (Rapid mobile meeting entry form with duplicate prevention, multi-Daeen attribution, meeting history, and live activity recalculation).

## Core Architectural Decisions
1. **Multi-Tenancy**: Every sector has an isolated workspace. All database queries for sector data strictly enforce `{ workspaceId }` scoping via middleware.
2. **Access Control**:
   - **Super Admin**: Platform-level workspace creator; restricted from modifying workspace business data without explicit Sector Secretary delegation.
   - **Sector Secretary Dawat**: Full administrative rights within their assigned sector workspace.
   - **Spectator / Viewer**: Read-only access requiring approval via access-request link; revokable at any time.
3. **Activity Engine**: Dynamic calculation of Madu, MDF, Rabtakar, Daeen, DF, and GM active/inactive statuses based on configurable thresholds.
4. **Historical Attribution**: When people change units or get promoted, historical individual meetings retain their historical unit and responsibility attribution.
5. **No AI/Paid Services**: Purely free-tier and open-source standard libraries.
