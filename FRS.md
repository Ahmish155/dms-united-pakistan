# Functional Requirements Specification (FRS)
# United Pakistan — Dawati Management System (DMS)

## Functional Module Specifications

### F-01: Authentication & Workspace Management
- **F-01.1**: Email & password authentication with secure sessions/JWT.
- **F-01.2**: Sector workspace selector & contextual state loading.
- **F-01.3**: Spectator access-request link generation, approval/rejection, and instantaneous revocation.
- **F-01.4**: Super Admin boundary guard restricting workspace data mutations.

### F-02: People & Organizational Directory
- **F-02.1**: Centralized People Directory with search, filters, and unit groupings.
- **F-02.2**: Multi-role assignment (Rabtakar, Daeen, Mentor, Unit Officeholders).
- **F-02.3**: Madu assignment to primary Rabtakar and default Daeen.
- **F-02.4**: Promotion of Madu $\to$ MDF and MDF $\to$ Rabtakar preserving complete historical continuity.
- **F-02.5**: Unit transfer preserving historical meeting attribution.

### F-03: Individual Meeting Management
- **F-03.1**: Mobile-optimized rapid meeting entry (Select Unit $\to$ Madu/MDF $\to$ Auto-populate Rabtakar/Daeen $\to$ Save).
- **F-03.2**: Tagging additional Daeen who participated in the meeting.
- **F-03.3**: Duplicate meeting prevention and warning system.
- **F-03.4**: Historical meeting log with audit trails.

### F-04: Dynamic Activity Status Engine
- **F-04.1**: Active Madu calculation based on configured `maduDays` threshold.
- **F-04.2**: Active MDF calculation based on configured `mdfDays` threshold.
- **F-04.3**: Active Rabtakar derived status (Active if $\ge 1$ associated Madu is active).
- **F-04.4**: Active Daeen calculation based on `daeenDays` meeting participation.
- **F-04.5**: Separate DF and GM participation status tracking.

### F-05: Planning Modules (DMM & RMM)
- **F-05.1**: DMM monthly planning sheet creation, unit targets, and sector aggregations.
- **F-05.2**: DMM variance engine comparing monthly targets against actual completed meetings.
- **F-05.3**: RMM weekly planning sheet creation with next-week individual targets.
- **F-05.4**: RMM progress tracker calculating completion percentage.

### F-06: Dialogue Forums & Group Meetings
- **F-06.1**: DF Mentor directory management.
- **F-06.2**: DF event recording and multi-participant attendance tracking.
- **F-06.3**: GM event recording and multi-participant attendance tracking.
- **F-06.4**: Independent participation analytics for DF and GM.

### F-07: Reporting & Export Engine
- **F-07.1**: Weekly Dawati Report generator matching United Pakistan format.
- **F-07.2**: Monthly and custom date range aggregate reporting.
- **F-07.3**: 1-click WhatsApp formatted text copy to clipboard.
- **F-07.4**: File downloads: PDF, Excel (.xlsx), and Word (.docx).
