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
- **Current Milestone**: Step 1 — Project Assessment & Master Technical Planning completed.
- **Git Repository**: Initialized with `main` branch.
- **Master Plan Artifact**: Generated and submitted for review.
- **Next Milestone**: Sprint 0 — Project Structure & Foundation Setup (Monorepo, TypeScript configs, server/client scaffolds, UI design system tokens).

## Core Architectural Decisions
1. **Multi-Tenancy**: Every sector has an isolated workspace. All database queries for sector data strictly enforce `{ workspaceId }` scoping via middleware.
2. **Access Control**:
   - **Super Admin**: Platform-level workspace creator; restricted from modifying workspace business data without explicit Sector Secretary delegation.
   - **Sector Secretary Dawat**: Full administrative rights within their assigned sector workspace.
   - **Spectator / Viewer**: Read-only access requiring approval via access-request link; revokable at any time.
3. **Activity Engine**: Dynamic calculation of Madu, MDF, Rabtakar, Daeen, DF, and GM active/inactive statuses based on configurable thresholds.
4. **Historical Attribution**: When people change units or get promoted, historical individual meetings retain their historical unit and responsibility attribution.
5. **No AI/Paid Services**: Purely free-tier and open-source standard libraries.
