# United Pakistan — Dawati Management System (DMS)

> A modern, mobile-first centralized organizational management platform for United Pakistan.

[![CI](https://github.com/united-pakistan/dms/actions/workflows/ci.yml/badge.svg)](https://github.com/united-pakistan/dms/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)

## Overview
The Dawati Management System (DMS) replaces fragmented manual reporting and spreadsheets with a unified, real-time management dashboard. Initialized for **Sector Gulraiz** with native multi-workspace support for future sectors.

## Key Features
- **Multi-Tenant Workspaces**: Complete data isolation between Sectors.
- **Centralized People Directory**: Unified profiles with multi-role support (Rabtakar, Daeen, MDF, Madu, Mentors).
- **Dynamic Activity Status Engine**: Automated real-time active/inactive status calculations driven by configurable thresholds.
- **Mobile-First Meeting Logger**: Fast, touch-friendly individual meeting recording with duplicate detection.
- **DMM & RMM Variance Engine**: Monthly and weekly planning targets linked to actual completed meetings with real-time progress calculations.
- **Community Activities (DF & GM)**: Dialogue Forum and Group Meeting attendance tracking with independent participation analytics.
- **Executive Reporting & Exports**: Real-time WhatsApp clipboard formatted reports, plus PDF, Excel, and Word exports.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Lucide Icons, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose ODM, Zod, Helmet.
- **Database**: MongoDB Atlas M0 (Free Tier).
- **Deployment**: Vercel (Frontend), Render (Backend), GitHub Actions (CI/CD).

## Documentation Directory
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — Persistent project context & architecture state
- [ARCHITECTURE.md](ARCHITECTURE.md) — Full technical architecture
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — MongoDB schema specifications
- [SRS.md](SRS.md) — Software Requirements Specification
- [FRS.md](FRS.md) — Functional Requirements Specification
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — Design tokens, color palette, and mobile UX rules
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — REST API catalog
- [TESTING.md](TESTING.md) — Testing strategy and QA checklists
- [DEPLOYMENT.md](DEPLOYMENT.md) — Free-tier-first deployment guide
- [BACKLOG.md](BACKLOG.md) — Sprints and product backlog
- [CHANGELOG.md](CHANGELOG.md) — Version history

## Getting Started (Development)
```bash
# Clone the repository
git clone https://github.com/united-pakistan/dms.git
cd dms

# Setup and dependencies will be configured in Sprint 0
```
