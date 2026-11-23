# CHANGELOG

All notable changes to the **Dawati Management System (DMS)** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.2] - 2026-11-23

### Added
- Units management module with unique name/code validation per sector workspace and leadership linkage (Unit President and General Secretary).
- Centralized People Directory with auto-generated internal person IDs (`UP-XXXX`).
- Multi-responsibility model allowing individuals to hold simultaneous roles (e.g. Rabtakar + Daeen) without record duplication.
- Promotion workflows for Madu $\to$ MDF and MDF $\to$ Rabtakar with historical preservation in `PromotionHistoryModel`.
- Unit transfer functionality preserving historical meeting unit attribution in `UnitAssignmentHistoryModel`.
- Dynamic Activity Status Engine calculating real-time active/inactive status for Madu, MDF, Rabtakar, Daeen, and community participation against configurable day thresholds.
- Workspace Settings API and service allowing the Sector Secretary to modify activity thresholds.
- Frontend screens:
  - `UnitsPage` with mobile-responsive unit cards and Add Unit modal.
  - `PeoplePage` with category filter tabs, search, unit selector, dynamic status badges, Add Person modal, Promote modal, and Transfer Unit modal.
  - `PersonProfilePage` displaying complete individual meeting logs, promotion timeline, and unit transfer history.
- Expanded seed script (`seed.ts`) populating Sector Gulraiz with Morgah, Lalkurti, Comsats, Hostel City, and the demonstration Madu/MDF/Rabtakar/Daeen roster from Part 22.
- 5 integration test suites with 12/12 passing tests in in-memory MongoDB.

## [0.1.0-alpha.1] - 2026-11-23

### Added
- Monorepo structure with `@dms/shared`, `@dms/server`, and `@dms/client` packages.
- Express server foundation with Helmet, rate limiting, and centralized error handler.
- MongoDB Atlas connection layer and database seeding script for Sector Gulraiz demonstration.
- JWT Authentication and user management services.
- Multi-workspace isolation middleware enforcing `{ workspaceId }` scoping on all sector-owned data.
- Spectator access request workflow: invite token generation, user submission, approval, and instant revocation with audit logging.
- Role-based access control protecting workspace business data from Super Admin mutation without delegation and restricting Spectators to read-only access.
- Mobile-first responsive React frontend with Tailwind CSS, custom Red/Neutral palette, AppLayout, Desktop Sidebar, Mobile Drawer, and Mobile Bottom Navigation.
- Executive Dashboard view with initial sector KPI cards.
- Vitest integration test suite using in-memory MongoDB verifying Auth, Workspace Isolation, and Spectator permissions (7/7 passing).
- GitHub Actions CI workflow for automated verification.

## [0.1.0-alpha.0] - 2026-11-23

### Added
- Git repository initialization on `main` branch.
- Master System Architecture and Technical Blueprint artifact.
- Foundational documentation suite:
  - `PROJECT_CONTEXT.md`
  - `README.md`
  - `SRS.md`
  - `FRS.md`
  - `ARCHITECTURE.md`
  - `DATABASE_SCHEMA.md`
  - `API_DOCUMENTATION.md`
  - `DESIGN_SYSTEM.md`
  - `TESTING.md`
  - `DEPLOYMENT.md`
  - `BACKLOG.md`
  - `CHANGELOG.md`
- Master Sprint Plan (Sprint 0 through Sprint 9).
