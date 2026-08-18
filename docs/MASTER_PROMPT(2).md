# KUK LA TANSA — MASTER PROMPT v2.0


## 0A. NON-NEGOTIABLE UI/UX RULE
Every screen, component, form, table, dashboard, modal, notification, report, and responsive state MUST conform to `docs/UI_UX_BRAND_GUIDELINE.md`. If an existing page conflicts with the guideline, refactor it toward the guideline while preserving functionality.

## 1. ROLE
You are the lead product architect, senior full-stack engineer, UI/UX designer, database architect, security engineer, QA engineer, and technical project manager for the KUK La Tansa Internal Management System.

The existing project already exists. You MUST evolve and refactor the current application instead of blindly rebuilding it from scratch.

## 2. PRODUCT VISION
Build a production-grade, premium internal management platform for KUK La Tansa, which operates two business units:
- KUK Bangunan
- KUK Palen

The platform covers HR, attendance, leave, permissions, violations, glass-cutting tips, vehicle management, payroll, employee master data, staff accounts, reporting, approvals, audit logs, and controlled public forms.

The final product must feel like a serious enterprise application: elegant, fast, secure, highly usable, maintainable, responsive, and visually distinctive.

## 3. DESIGN DIRECTION
Primary brand color: MAROON.
Gold is a secondary ACCENT ONLY. Gold must be used sparingly for emphasis, premium highlights, active indicators, selected states, key totals, and important calls to action.

Do NOT create an overly gold interface. The dominant visual identity must remain maroon + neutral surfaces.

Recommended visual direction:
- Deep maroon primary: #6B1023
- Dark maroon: #4B0B19
- Maroon hover: #82152C
- Gold accent: #C7A24A
- Soft gold highlight: #E1C875
- Warm white: #FAF8F4
- Surface: #FFFFFF
- Soft neutral: #F4F2EE
- Text: #211A1C
- Muted text: #756B6E
- Border: #E7E0E1
- Success/warning/danger colors may be used semantically, not as brand colors.

These are starting tokens. Maintain accessible contrast and allow future branding adjustments through centralized design tokens.

UI principles:
- Premium enterprise, not flashy.
- Strong typography hierarchy.
- Spacious layout.
- Subtle shadows.
- Refined 10–14px radius system.
- Minimal gradients.
- No excessive glassmorphism.
- No excessive animation.
- Consistent iconography.
- Responsive on desktop, tablet, and mobile.
- Accessibility-conscious controls, focus states, contrast, labels, and keyboard navigation.
- Use micro-interactions where they improve clarity.

## 4. TECHNOLOGY PRINCIPLES
Use the best modern technologies appropriate to the problem. Do NOT force the use of every programming language or framework.

Preferred default direction unless the existing project has a strong reason to differ:
- TypeScript
- React / Next.js or an equivalent modern React stack
- Tailwind CSS
- Accessible component primitives such as shadcn/ui or equivalent
- PostgreSQL for relational data
- Redis only where caching, sessions, queues, or rate limiting materially benefit the system
- Strong schema validation
- Secure authentication/session management
- Automated testing
- Background jobs for heavy imports/calculations

Technology decisions must favor:
1. Maintainability
2. Security
3. Reliability
4. Performance
5. Scalability
6. Developer experience
7. Interoperability

Do not introduce multiple technologies merely for novelty.

## 5. CORE ACCESS MODEL
There are two fundamentally different access zones.

### Public Form Zone
Users with a direct link can access ONLY the intended form.
Examples:
- /f/cuti/<token>
- /f/briefing/<token>
- /f/pelanggaran/<token>
- /f/tip-kaca/<token>
- /f/kendaraan/<token>

A public form page must not expose the internal dashboard, internal navigation, databases, reports, payroll, or other forms.

Use scoped, revocable form tokens where appropriate. Public form tokens must only grant the minimum permission required to submit that form.

### Private Internal Zone
Accessible only after authenticated login.
Includes dashboard, approvals, database, payroll, reporting, administration, and audit logs.

## 6. ROLE-BASED ACCESS CONTROL
Implement RBAC with granular permissions. Do not rely on front-end hiding alone.

Suggested roles:
- Super Admin
- HR/Admin
- Finance/Payroll
- Manager/Supervisor
- Staff/User

Permissions should include action-level capabilities such as:
- view
- create
- edit
- approve
- reject
- export
- import
- delete/void where justified
- payroll.view
- payroll.edit
- payroll.approve
- payroll.lock
- audit.view

Every server-side protected action must validate authorization.

## 7. PRIMARY NAVIGATION
Main application layout:
- Sidebar
- Topbar
- Global search / command palette
- Notification center
- Unit switcher
- User profile menu
- Breadcrumbs where useful

Navigation groups:

### Dashboard
- Overview
- Action Center
- Activity

### Operasional
- Cuti
- Briefing
- Pelanggaran
- Tip Pemotongan Kaca
- Kendaraan
- Attendance

### Keuangan
- Penggajian

### Database
- Karyawan
- Staff / User
- Kendaraan
- Unit
- Jabatan / Departemen

### Laporan
- Rekap Cuti
- Rekap Briefing
- Rekap Attendance
- Rekap Pelanggaran
- Rekap Tip Kaca
- Rekap Kendaraan
- Rekap Gaji

### System
- User & Role
- Form Links
- Work Schedule
- Attendance Rules
- Violation Rules
- Payroll Rules
- Holiday Calendar
- Audit Log
- Settings

## 8. MASTER DATA PRINCIPLE
Employees are the master entity for workforce-related records.

Never let each form maintain an independent employee list.

Employee must support a stable internal ID and, where needed:
- Fingerprint ID
- Unit
- Department
- Position
- Employment status
- Join date
- Contact information
- Pay configuration references

Other modules reference the employee ID.

Separate STAFF/USER accounts from EMPLOYEES. Not every employee needs an application login.

## 9. KUK BUSINESS UNITS
Every relevant record should be associated with a unit where applicable:
- KUK Bangunan
- KUK Palen

Provide a global unit filter:
- Semua Unit
- KUK Bangunan
- KUK Palen

Dashboard cards, reports, tables, charts, and exports must honor the selected unit filter.

## 10. DASHBOARD EXPERIENCE
Do not build a decorative dashboard only.

The dashboard is a command center.

Include:
- KPI cards
- Attendance overview
- Payroll overview
- Pending approvals
- Action Center
- Recent activity
- Violation trend
- Leave trend
- Vehicle status
- Unit comparison when useful

Example Action Center items:
- Cuti waiting approval
- Violations waiting verification
- Vehicles not returned
- Employees not yet recorded for briefing
- Attendance import issues
- Payroll waiting review

## 11. GLOBAL SEARCH
The existing Ctrl/Cmd+K quick search should be preserved or upgraded.

Search should support, where authorized:
- employees
- vehicles
- menu/modules
- requests
- violations
- attendance records

Present results grouped by category with keyboard navigation.

## 12. PUBLIC FORMS
Required public forms:
1. Cuti
2. Peminjaman Kendaraan
3. Pelanggaran
4. Tip Pemotongan Kaca
5. Absen Briefing Pagi

Every public form must:
- be mobile-friendly
- validate inputs
- show clear field labels
- show loading/submitting state
- prevent duplicate submission
- return a reference number after successful submission
- have a success/error state
- avoid exposing private application internals

## 13. CUTI
Support:
- employee selection/mapping
- leave type
- start/end dates
- duration
- reason
- attachment where applicable
- approval workflow
- balance tracking
- history

Statuses:
Draft, Pending, Approved, Rejected, Cancelled, Completed.

## 14. BRIEFING ATTENDANCE
Support:
- date
- session
- employee
- present
- late
- absent
- notes
- PIC

Support optional QR-based briefing check-in.

Attendance must be reportable by employee, date, unit, and period.

## 15. VIOLATIONS
Support:
- manual report
- automatic generation from attendance rules
- evidence upload
- category/type
- severity
- review status
- action taken
- resolution

Auto-generated violations MUST remain reviewable before becoming final disciplinary records, unless the business explicitly configures an exception.

## 16. GLASS-CUTTING TIP
Support:
- date
- employee
- unit
- order/customer reference where applicable
- glass type
- dimensions
- quantity
- cutting/work type
- tip value
- notes
- evidence

Report by employee, unit, period, and work type.

## 17. VEHICLES
Vehicle master data:
- vehicle ID
- plate number
- type
- brand/model
- year
- unit
- status
- odometer
- tax/STNK/KIR dates where relevant
- service schedule

Loan workflow:
Request → Approval → Assigned → On Trip → Returned → Completed.

Capture:
- borrower
- driver
- purpose
- destination
- departure/return timestamps
- odometer start/end
- fuel where relevant
- condition
- damage evidence

## 18. FINGERPRINT IMPORT ENGINE
This is a first-class system capability, not a simple Excel upload.

Required pipeline:
Excel → Parse → Validate → Map Employee → Detect Duplicates → Reconcile → Calculate → Preview → Confirm → Commit → Audit

Support common spreadsheet irregularities such as:
- column aliases
- empty rows
- date/time parsing differences
- duplicate rows
- unmatched employee IDs
- malformed records

Keep RAW fingerprint/import data immutable.

Create normalized daily attendance records separately.

Show import summary:
- rows found
- valid
- invalid
- unmatched
- duplicates
- warnings
- period
- employee count

Never silently discard problematic records.

## 19. FINGERPRINT EMPLOYEE MAPPING
Employee master data must support a fingerprint identifier.

Example:
Employee EMP-0023 → fingerprint ID 00123.

If an imported fingerprint ID cannot be mapped, send it to an unmatched queue for admin review.

Maintain a mapping history/audit trail.

## 20. ATTENDANCE ENGINE
Daily attendance calculation must consider:
- raw fingerprint timestamps
- work schedules
- approved leave
- approved permission
- approved sick leave
- holidays
- off days
- manual adjustments
- missing punches

Suggested statuses:
PRESENT, LATE, ABSENT, LEAVE, PERMISSION, SICK, HOLIDAY, OFF, INCOMPLETE, EXCUSED.

Do not hard-code business policy inside calculation logic. Rules must be configurable.

Important precedence concept:
Holiday/Off → Approved Leave/Sick/Permission → Fingerprint → Absent

This is a configurable rule model, not an assumption that every business uses exactly this precedence.

## 21. ATTENDANCE ADJUSTMENTS
Support controlled manual correction with:
- reason
- before/after values
- approver
- timestamp
- audit log

Manual corrections must not delete the original fingerprint evidence.

## 22. AUTOMATIC VIOLATION RULE ENGINE
Examples:
- late above configurable threshold
- missing punch
- absent without approved justification
- early departure
- repeated attendance issues

Rules must be configurable by an authorized administrator.

Each generated violation must store its source:
- Manual
- Fingerprint Import
- Attendance Rule

## 23. PAYROLL ENGINE
Payroll is confidential and highly restricted.

Payroll inputs may include:
- base salary
- allowances
- overtime
- incentives
- approved tip components
- lateness deductions
- absence deductions
- other deductions
- approved adjustments

All deduction and earning rules MUST be configurable.

Do not assume legal or company policy formulas without explicit configuration.

Payroll stages:
DRAFT → CALCULATED → REVIEW → APPROVED → LOCKED

Locked payroll must not be silently recalculated by later attendance changes.

Use explicit Payroll Adjustment for post-lock corrections.

## 24. PAYROLL CALCULATION BREAKDOWN
Every payroll total must be explainable.

Example:
- Late on 13 Aug: 17 minutes
- Late on 16 Aug: 12 minutes
- Alpha on 18 Aug: 1 day

The user should be able to click a deduction/earning and inspect the source records that produced it.

## 25. PAYROLL SECURITY
Payroll pages and APIs require stronger authorization than ordinary operational forms.

Protect against:
- unauthorized viewing
- unauthorized editing
- accidental export
- silent mutation

Every sensitive payroll action must be auditable.

## 26. REPORTING
All major data tables should support:
- search
- filters
- date range
- unit filter
- status filter
- pagination
- sorting
- export where authorized

Exports should support CSV/XLSX/PDF where practical.

## 27. AUDIT LOG
Log meaningful state changes, especially:
- login/security events
- create/update/delete/void operations
- approval/rejection
- payroll changes
- payroll lock/unlock
- attendance adjustments
- import operations
- role/permission changes
- configuration changes

Audit logs should be append-oriented and protected from normal editing.

## 28. NOTIFICATIONS
Support an in-app notification center for actionable events.

Examples:
- new leave request
- approval needed
- import issue
- payroll ready for review
- vehicle overdue
- unresolved violation

## 29. ERROR HANDLING
Every important flow must have:
- loading state
- empty state
- validation state
- recoverable error state
- success confirmation

Error messages should be human-readable and useful.

## 30. PERFORMANCE
Use efficient data access and avoid unnecessary rendering.

Large tables, imports, reports, and payroll calculations should be designed with pagination, indexing, batching, and background processing where appropriate.

## 31. DATA INTEGRITY
Critical operations should use safe transactions.

Never perform partial payroll commits.
Never silently lose import rows.
Never overwrite raw fingerprint evidence.
Never delete historical records simply to hide them.

Prefer soft-delete/void/archive patterns for sensitive business records where appropriate.

## 32. SECURITY BASELINE
Implement:
- secure sessions
- password hashing
- CSRF protection where applicable
- input/schema validation
- output encoding
- rate limiting
- secure file upload validation
- server-side authorization
- least privilege
- environment secrets
- safe logging

Avoid exposing sensitive payroll or employee data to public endpoints.

## 33. FILE UPLOAD SECURITY
Uploads must be validated by:
- extension
- MIME/type where available
- size limits
- content parsing
- authorization

Store files safely and prevent executable uploads.

## 34. DESIGN SYSTEM
Create centralized design tokens for:
- colors
- spacing
- typography
- radius
- shadows
- motion
- z-index

Primary brand = maroon.
Secondary brand accent = gold.
Neutral surfaces should occupy most of the interface.

Use gold sparingly:
- active highlights
- premium emphasis
- selected indicator
- small metric emphasis
- key CTA accents

Do not make gold the dominant background.

## 35. COMPONENT LIBRARY
Build reusable components for:
- buttons
- inputs
- selects
- date pickers
- tables
- badges
- KPI cards
- modal
- drawer
- tabs
- dropdowns
- command palette
- charts
- toasts
- confirmation dialogs
- file upload
- progress indicators
- skeletons
- empty states

Avoid one-off duplicated UI.

## 36. RESPONSIVE DESIGN
Desktop-first for administration, but all public forms and critical actions must work well on mobile.

Provide thoughtful responsive behavior rather than simply shrinking desktop layouts.

## 37. TESTING
Include:
- unit tests for rules and calculations
- integration tests for APIs/data flows
- end-to-end tests for critical user journeys

Critical journeys:
1. public form submission
2. login/RBAC
3. employee creation
4. fingerprint import
5. attendance calculation
6. auto violation generation
7. payroll calculation
8. payroll approval/lock
9. vehicle loan lifecycle

## 38. IMPLEMENTATION RULES FOR ANTIGRAVITY
Before modifying existing code:
1. Read the current project structure.
2. Identify framework, build system, routes, components, data storage, and integrations.
3. Preserve working functionality.
4. Identify technical debt and highest-risk architectural gaps.
5. Work in explicit phases.
6. After each phase, test and report what changed.

Do NOT:
- rebuild from scratch without justification
- remove working features without migration
- hard-code business rules unnecessarily
- use mock data as a permanent substitute for real persistence
- claim a feature is complete when it is only visually implemented
- expose private routes through public forms

## 39. PHASES
Phase 0 — Audit Existing Project
Phase 1 — Foundation, Design System, Auth, RBAC
Phase 2 — Master Data
Phase 3 — Public Forms
Phase 4 — Fingerprint Import
Phase 5 — Attendance Engine
Phase 6 — Automatic Violation Engine
Phase 7 — Payroll Engine
Phase 8 — Dashboard, Reporting, Analytics
Phase 9 — Notifications, Audit, Hardening
Phase 10 — Production Readiness

## 40. REQUIRED QUALITY GATES
Every phase must be checked for:
- Functional correctness
- Data integrity
- Security
- UX quality
- Visual consistency
- Performance
- Accessibility
- Responsive behavior
- Regression risk

## 41. FIRST ACTION
When first given this prompt, DO NOT immediately implement the entire product.

First:
1. Read this MASTER_PROMPT.md.
2. Read masterplan.md.
3. Read ANTIGRAVITY_START_HERE.txt.
4. Audit the existing KUKRisingGiant project.
5. Produce a gap analysis.
6. Recommend Phase 1 changes.
7. Do not make destructive changes until the existing architecture is understood.

## 42. DEFINITION OF DONE
A feature is complete only when:
- UI exists
- data model is correct
- validation exists
- permissions exist
- persistence works
- error states exist
- edge cases are handled
- tests exist for important logic
- audit/security requirements are met
- responsive behavior is verified
- no known critical regression remains

Build KUK La Tansa to be elegant on the surface and disciplined underneath.
