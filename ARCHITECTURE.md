# System Architecture Specification
# United Pakistan — Dawati Management System (DMS)

## 1. Architectural Philosophy & Overview
The Dawati Management System (DMS) is an enterprise-grade multi-tenant web application engineered to digitize the Dawati workflow across organizational sectors. It is developed using the **MERN** stack (MongoDB, Express, React, Node.js) with end-to-end **TypeScript**.

The architecture adheres strictly to:
- **Clean Architecture & Domain-Driven Modularity**: Distinct separation of HTTP handlers, business service layers, data access models, and validation schemas.
- **Tenant Isolation**: Sector-level multitenancy enforced at the middleware and query level (`workspaceId`).
- **Dynamic Business Rules**: Thresholds and activity calculations are computed dynamically against verifiable historical meeting and attendance records.
- **Mobile-First UX**: Zero-friction data logging specifically optimized for handheld mobile browsers.

## 2. Component Architecture

```
[ Client: React + Vite + Tailwind + shadcn/ui ]
                    │
                    ▼  (HTTPS / REST / JSON)
        [ Express API Gateway ]
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
[ Security MW ] [ Auth MW ] [ Tenancy MW ]
      │             │             │
      └─────────────┼─────────────┘
                    ▼
          [ Domain Modules ]
   ├── auth / users / access-requests
   ├── workspaces & units
   ├── people & responsibilities
   ├── individualMeetings
   ├── activity-engine (Thresholds)
   ├── dmm & rmm (Planning & Variance)
   ├── df & gm (Community & Mentors)
   └── reports & analytics
                    │
                    ▼
       [ Mongoose ODM Layer ]
                    │
                    ▼
     [ MongoDB Atlas Database ]
```

## 3. Multi-Workspace Isolation & Tenancy Model
- Every sector (e.g., Sector Gulraiz) operates in an isolated workspace identified by a unique `ObjectId`.
- Units belong to their parent Sector Workspace; units do not have separate workspaces.
- Every workspace-owned database collection requires an indexed `workspaceId` field.
- Middleware verifies user membership and injects `req.workspaceId` into all Mongoose queries.
- Spectators are restricted to read-only (`GET`) operations.
- Super Admins are restricted from modifying workspace business data without explicit Sector Secretary delegation.

## 4. Module Boundaries & Communication
- **People Module**: Source of truth for identity, historical records, and active roles.
- **Meeting Module**: Collects actual completed meetings and updates person meeting counts.
- **Activity Status Engine**: Pure function service calculating active/inactive status across Madu, MDF, Rabtakar, Daeen, DF, and GM based on workspace threshold settings.
- **DMM/RMM Planning Engine**: Connects monthly and weekly targets with real-time meeting entries to compute variance and completion percentages.
- **Reporting Engine**: Aggregates records across time windows and renders outputs to WhatsApp format, PDF, Excel, and Word.
