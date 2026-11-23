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
- **Current Milestone**: Step 2 (Foundation: Sprint 0 & Sprint 1) Completed.
- **Git Repository**: Initialized with `main` branch.
- **Completed Modules**:
  - `@dms/shared`: Core TypeScript interfaces, organizational constants, Zod validation schemas.
  - `@dms/server`: Express.js backend with Mongoose ODM, Helmet security headers, Rate Limiting, CORS, JWT Authentication, and strict multi-tenant isolation middleware (`workspaceScope.ts`).
  - Spectator access workflow: Invite link generation, request submission, approval/rejection, and instantaneous revocation with audit logging.
  - `@dms/client`: Mobile-first responsive Vite React SPA with Tailwind CSS, custom United Pakistan design tokens, Auth & Workspace Context providers, Mobile Bottom Navigation, Desktop Sidebar, and Executive Dashboard.
  - Automated integration tests with in-memory MongoDB verifying Auth, Workspace Isolation, Spectator read-only guards, and Super Admin mutation blocks.
- **Next Milestone**: Sprint 2 — Organizational Core (Units CRUD & Officeholders, Centralized People Directory, Multiple Responsibilities, Madu/MDF/Rabtakar/Daeen relationship mapping).

## Core Architectural Decisions
1. **Multi-Tenancy**: Every sector has an isolated workspace. All database queries for sector data strictly enforce `{ workspaceId }` scoping via middleware.
2. **Access Control**:
   - **Super Admin**: Platform-level workspace creator; restricted from modifying workspace business data without explicit Sector Secretary delegation.
   - **Sector Secretary Dawat**: Full administrative rights within their assigned sector workspace.
   - **Spectator / Viewer**: Read-only access requiring approval via access-request link; revokable at any time.
3. **Activity Engine**: Dynamic calculation of Madu, MDF, Rabtakar, Daeen, DF, and GM active/inactive statuses based on configurable thresholds.
4. **Historical Attribution**: When people change units or get promoted, historical individual meetings retain their historical unit and responsibility attribution.
5. **No AI/Paid Services**: Purely free-tier and open-source standard libraries.
