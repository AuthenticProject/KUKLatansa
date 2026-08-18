# KUK LA TANSA — MASTERPLAN v2.0

## 1. Product
KUK La Tansa Internal Management System

Business units:
- KUK Bangunan
- KUK Palen

Goal: transform the current KUKRisingGiant application into a professional, secure, scalable internal management platform.

## 2. Brand & UI Direction
The authoritative UI/UX source of truth is `docs/UI_UX_BRAND_GUIDELINE.md`.

The supplied KUK rebranding source defines the brand assets, Revans typography, and official colours including #FFCC00, #996414, #FFFFFF, #E5E5E5, #FF0000, and #540000.

Implementation palette:
- Primary Maroon: #540000
- Gold Accent: #FFCC00
- Secondary Brown/Gold: #996414
- White: #FFFFFF
- Light Gray: #E5E5E5
- Semantic Danger: #FF0000

Gold must remain restrained. Maroon is the dominant interface identity.

Design goal: premium enterprise software with a strong KUK brand identity, high usability, accessibility, consistency, and operational clarity.

## 3. Product Principles
1. Employee is the master workforce entity.
2. Raw fingerprint data is preserved and immutable.
3. Attendance is derived, not manually overwritten.
4. Leave/permission/sick data reconciles with attendance.
5. Violations can be generated automatically but remain reviewable.
6. Payroll is explainable, configurable, and strongly protected.
7. Public forms have isolated access.
8. Internal access is role-based and server-enforced.
9. Every important change is auditable.
10. Business rules should be configurable rather than hard-coded.

## 4. Access Architecture
### Public
Direct-link scoped forms only:
- Cuti
- Briefing
- Pelanggaran
- Tip Kaca
- Peminjaman Kendaraan

### Private
Authenticated dashboard and management features.

Suggested roles:
- Super Admin
- HR/Admin
- Finance/Payroll
- Manager/Supervisor
- Staff/User

## 5. Core Modules
### Dashboard
- KPI
- Action Center
- attendance trends
- payroll summary
- violations
- leave
- vehicle status
- recent activity

### Attendance
- fingerprint import
- import history
- unmatched IDs
- normalized daily records
- adjustment workflow
- work schedules
- attendance rules

### Leave
- public submission
- approval
- balance
- history

### Briefing
- session
- attendance
- QR check-in optional
- recap

### Violations
- manual entry
- automatic rule generation
- evidence
- verification
- actions
- resolution

### Glass Tip
- input
- validation
- approval if required
- employee/unit/month recap

### Vehicles
- master database
- loans
- approval
- return
- maintenance/expiration reminders

### Payroll
- period
- calculation
- review
- approval
- lock
- adjustment
- breakdown
- export

### Master Data
- employees
- staff/users
- units
- departments
- positions
- vehicles
- fingerprint IDs

### Reports
All major modules need filtered tables and exports.

### System
- RBAC
- form links/tokens
- work schedules
- attendance rules
- violation rules
- payroll rules
- holidays
- audit logs
- settings

## 6. Data Architecture
Core entities:
- users
- roles
- permissions
- employees
- units
- departments
- positions
- employee_fingerprint_ids
- work_schedules
- holidays
- leave_types
- leave_requests
- permission_requests
- sick_records
- briefing_sessions
- briefing_attendance
- violations
- violation_rules
- glass_tips
- vehicles
- vehicle_loans
- vehicle_maintenance
- fingerprint_imports
- fingerprint_raw_records
- attendance_daily
- attendance_adjustments
- attendance_rules
- payroll_periods
- payroll_records
- payroll_items
- payroll_adjustments
- payroll_rules
- form_links
- notifications
- audit_logs

## 7. Data Relationships
Employee is the parent for:
- leave
- permission
- sick
- briefing attendance
- violations
- tips
- vehicle loans
- attendance
- payroll

Vehicle is the parent for:
- loans
- maintenance
- documents

Fingerprint import maps to employee via fingerprint ID.

## 8. Fingerprint Import Architecture
Pipeline:
1. Upload
2. File validation
3. Parse spreadsheet
4. Detect headers/columns
5. Normalize dates/times
6. Validate rows
7. Map fingerprint ID to employee
8. Detect duplicates
9. Produce issues queue
10. Calculate attendance preview
11. Reconcile approved leave/permission/sick/off/holiday
12. Generate violation candidates
13. Generate payroll inputs
14. Admin confirms import
15. Commit normalized data
16. Audit result

Import summary must show:
- total rows
- valid rows
- invalid rows
- unmatched employee IDs
- duplicate rows
- warnings
- period
- employee count

## 9. Attendance Engine
Inputs:
- raw fingerprint records
- schedule
- holiday calendar
- leave
- permission
- sick
- manual adjustments

Output:
- present
- late
- absent
- leave
- permission
- sick
- holiday
- off
- incomplete
- excused

Rules must be configurable.

## 10. Automatic Violation Engine
Possible rules:
- late beyond threshold
- early departure
- missing punch
- absent without approved reason
- repeated patterns

Each candidate stores source and evidence.

Default lifecycle:
Generated → Review → Verified → Action → Closed

## 11. Payroll Engine
Inputs:
- salary configuration
- attendance results
- approved violations/deductions
- overtime
- incentives
- tips where applicable
- manual adjustments

Stages:
Draft → Calculated → Review → Approved → Locked

All rules configurable.

Every number must have a calculation source.

## 12. Public Form Architecture
Each form gets an isolated URL.

Example pattern:
`/f/<form-type>/<token>`

Token capabilities must be scoped to that form only.

No access to:
- dashboard
- employee database
- reports
- payroll
- system settings
- other public forms unless explicitly configured

## 13. Dashboard Layout
Desktop:
- left sidebar
- topbar
- main content

Topbar:
- global search
- unit selector
- notifications
- profile

Main dashboard:
- welcome/context header
- KPI row
- Action Center
- attendance analytics
- payroll summary
- violations trend
- recent activity
- vehicle status

## 14. Visual System
Use centralized design tokens.

Maroon is the identity color.
Gold is an accent, not a dominant fill.

Use gold mostly for:
- selected state indicator
- premium highlights
- small key metrics
- important call-to-action accents

Avoid:
- excessive gold backgrounds
- rainbow dashboards
- excessive gradients
- excessive glow
- excessive animation

## 15. UX Standards
All tables:
- search
- filters
- sorting
- pagination
- date range
- unit filter
- status filter
- export where authorized

Forms:
- clear labels
- validation
- loading state
- duplicate submit protection
- success reference number
- useful errors

Every data-heavy area:
- empty state
- loading state
- failure state
- permission-denied state

## 16. Search
Global Ctrl/Cmd+K command palette.

Search:
- employee
- vehicle
- module
- request
- violation
- attendance record

## 17. Notifications
In-app notification center for:
- approvals
- import issues
- payroll review
- overdue vehicle
- unresolved violation

## 18. Audit
Audit all meaningful changes:
- authentication events
- CRUD mutations
- approval/rejection
- imports
- attendance corrections
- payroll changes/lock
- role/permission changes
- business rule changes

## 19. Security
Implement:
- secure authentication
- password hashing
- server-side authorization
- schema validation
- rate limiting
- safe uploads
- least privilege
- secrets via environment variables
- sensitive-data protections

Payroll has elevated protection.

## 20. Performance
Use:
- indexes
- pagination
- batching
- caching only where beneficial
- background jobs for heavy import/calculation
- efficient queries
- client-side memoization only where useful

## 21. Testing Strategy
Unit tests:
- attendance rules
- payroll calculations
- violation rules

Integration tests:
- authentication
- public form submission
- fingerprint import
- database persistence
- approval workflow

E2E tests:
- login
- employee creation
- form submission
- import → attendance → violation → payroll
- vehicle loan lifecycle

## 22. Development Phases
### Phase 0 — Audit
- inspect existing app
- map current routes/components/data
- identify reusable features
- identify broken/incomplete features
- identify architecture risks
- produce gap analysis

Deliverable: audit report only.

### Phase 1 — Foundation
- design tokens
- global layout
- navigation
- authentication
- RBAC
- session/security baseline
- notifications foundation
- audit foundation

Acceptance:
- secure login
- role-aware navigation
- no public access to private screens
- visual system consistently applied

### Phase 2 — Master Data
- employees
- staff/users
- units
- departments
- positions
- vehicles
- fingerprint IDs
- work schedules
- holidays

Acceptance:
- employee is a true master entity
- duplicate data patterns minimized
- fingerprint mapping works

### Phase 3 — Public Forms
- leave
- briefing
- violation
- tip glass
- vehicle loan

Acceptance:
- direct links isolate form access
- submission creates durable data
- reference numbers returned

### Phase 4 — Fingerprint Import
- Excel import
- schema validation
- normalization
- matching
- duplicate detection
- issue queue
- import history

Acceptance:
- no silent data loss
- raw records preserved
- unmatched records reviewable

### Phase 5 — Attendance Engine
- daily calculation
- schedule matching
- leave/permission/sick reconciliation
- adjustment workflow
- attendance recap

Acceptance:
- repeatable deterministic calculation
- configurable rules
- corrections are auditable

### Phase 6 — Violation Engine
- automatic violation candidates
- manual violations
- review workflow
- evidence
- reports

Acceptance:
- attendance events can produce reviewable violation candidates

### Phase 7 — Payroll
- payroll periods
- calculation engine
- configurable rules
- breakdown
- review/approval
- lock
- adjustments

Acceptance:
- every amount traceable to sources
- locked payroll protected from silent recalculation

### Phase 8 — Dashboard & Reports
- executive dashboard
- operational dashboard
- unit comparison
- trend charts
- exports
- employee profile 360 view

Acceptance:
- dashboard helps users act, not just observe

### Phase 9 — Hardening
- security review
- performance review
- accessibility review
- test coverage
- audit verification
- error handling
- backup/recovery approach

### Phase 10 — Production Readiness
- environment configuration
- deployment pipeline
- monitoring
- logs
- smoke tests
- documentation
- handover checklist

## 23. Employee 360 Profile
Employee detail page should show:
- identity/profile
- employment data
- attendance summary
- leave balance/history
- briefing history
- violations
- glass tips
- vehicle loans
- payroll history

## 24. Action Center
Centralize pending work:
- leave approvals
- violation reviews
- fingerprint import issues
- payroll reviews
- vehicle overdue
- briefing anomalies

## 25. Definition of Done
A feature is not complete because the screen exists.

It is complete when:
- UI works
- persistence works
- validation works
- permission works
- error states work
- edge cases are handled
- important logic is tested
- audit requirements are met
- responsive behavior is verified
- no critical regression is known

## 26. Antigravity Working Rules
Before changing existing code:
1. Read all project docs.
2. Inspect the existing codebase.
3. Preserve working functionality.
4. Make changes in phases.
5. Prefer reusable architecture.
6. Explain destructive migrations before performing them.
7. Run tests after meaningful changes.
8. Report what changed and what remains.

Never claim a mocked or static feature is fully implemented.

## 27. Success Criteria
The final KUK La Tansa system should:
- look premium and cohesive
- use maroon as the dominant brand identity
- use gold sparingly and intentionally
- support both KUK Bangunan and KUK Palen
- separate public forms from internal management
- centralize employee master data
- automate fingerprint-to-attendance processing
- reconcile leave/permission/sick
- generate reviewable violations
- feed attendance into payroll
- provide explainable payroll calculations
- provide dashboards and reports
- maintain strong auditability and security
- remain maintainable as KUK expands

## 14A. UI/UX GOVERNANCE
1. `docs/UI_UX_BRAND_GUIDELINE.md` is the visual source of truth.
2. No module may invent its own colour palette, typography system, icon style, spacing language, or interaction pattern.
3. All components must use centralized design tokens.
4. Maroon is dominant; gold is an accent only.
5. Use the official Revans typeface asset when available and approved.
6. Public forms use the same brand identity but a simpler interaction model.
7. Every new screen must define loading, empty, error, success, and permission-denied states.
8. Visual polish must never reduce data readability or operational speed.
