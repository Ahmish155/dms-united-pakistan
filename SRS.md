# Software Requirements Specification (SRS)
# United Pakistan — Dawati Management System (DMS)

## 1. Introduction
### 1.1 Purpose
This document specifies the software requirements for the Dawati Management System (DMS), an enterprise multi-tenant platform for United Pakistan.
### 1.2 Scope
The system will digitize sector-level Dawati management: people directory, Madu/MDF/Rabtakar/Daeen relationship management, individual meeting logging, DMM monthly planning, RMM weekly planning, Dialogue Forums, Group Meetings, dynamic activity tracking, and multi-format report exports.

## 2. Overall Description
### 2.1 Product Perspective
DMS replaces manual record-keeping with a secure, cloud-hosted, mobile-first web application.
### 2.2 User Characteristics
- **Sector Secretary Dawat**: Primary user operating on smartphones and tablets.
- **Spectator**: Authorized read-only stakeholder.
- **Super Admin**: Platform infrastructure administrator.

## 3. Specific Requirements
### 3.1 Multi-Tenancy & Security
- Strict workspace data isolation for Sector Gulraiz and future sectors.
- Role-based access control (RBAC).
- Approval-based spectator access links with revocation.
### 3.2 People & Responsibility Engine
- Single person record with multiple simultaneous responsibilities (Rabtakar + Daeen, etc.).
- Unit transfer preservation: past activities permanently attributed to past units.
- Promotion workflows: Madu to MDF, MDF to Rabtakar.
### 3.3 Meeting & Planning Architecture
- Fast mobile meeting logger with duplicate prevention.
- Monthly DMM target sheets with variance calculations.
- Weekly RMM target sheets with progress tracking.
- DF and GM session recording with attendance tracking.
### 3.4 Dynamic Activity Engine
- Madu, MDF, Rabtakar, Daeen, DF, and GM active/inactive calculations based on configurable day thresholds.
### 3.5 Reporting & Exports
- Weekly Dawati Report, Monthly Report, Custom Date Range.
- Outputs: WhatsApp text, PDF, Excel (.xlsx), Word (.docx).
