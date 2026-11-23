# Testing Strategy & Quality Assurance
# United Pakistan — Dawati Management System (DMS)

## 1. Testing Frameworks
- **Unit & Integration**: Vitest + Supertest (Backend API)
- **UI Components**: Vitest + React Testing Library (Frontend)
- **End-to-End (E2E)**: Playwright (Critical user journeys)

## 2. Test Coverage Suites

### Suite A: Authentication & Workspace Tenancy
- [ ] User login with valid and invalid credentials.
- [ ] Cross-tenant access protection (Tenant A user cannot read or write Tenant B data).
- [ ] Spectator read-only enforcement (Mutations return 403 Forbidden).
- [ ] Super Admin workspace mutation guard (Cannot edit sector data without delegation).
- [ ] Immediate revocation of spectator access.

### Suite B: People, Assignments & Promotions
- [ ] Adding a person with multiple responsibilities.
- [ ] Unit transfer verification: Ensure historical meetings retain their historical unit.
- [ ] Madu $\to$ MDF promotion: Preserves all historical meetings and assignments.
- [ ] MDF $\to$ Rabtakar promotion: Preserves complete organizational lineage.

### Suite C: Dynamic Activity Status Engine
- [ ] Madu active/inactive calculation based on `maduDays`.
- [ ] MDF active/inactive calculation based on `mdfDays`.
- [ ] Rabtakar status: Active if $\ge 1$ associated Madu is active; inactive if all are inactive.
- [ ] Daeen status: Active if participated in completed meeting within `daeenDays`.
- [ ] Dynamic recalculation upon threshold modifications.

### Suite D: Meeting & Planning Variance
- [ ] Rapid meeting entry & duplicate meeting detection.
- [ ] DMM monthly variance: Target IM vs Actual Completed IM.
- [ ] RMM weekly variance: Next-week target vs Actual Completed IM.
- [ ] Zero target edge cases handled cleanly.

### Suite E: Reporting & Exports
- [ ] Weekly report aggregation matching sample date ranges.
- [ ] WhatsApp clipboard text rendering accuracy.
- [ ] PDF, Excel, and Word export verification.
