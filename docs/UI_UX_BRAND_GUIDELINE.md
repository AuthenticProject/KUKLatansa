# KUK LA TANSA — UI/UX & BRAND GUIDELINE

Version 1.0 — Master visual guideline for KUK La Tansa Internal Management System

## 1. Authority
This document is the **primary UI/UX and visual-design authority** for the KUK La Tansa web application. Any future page, component, form, dashboard, modal, table, report, empty state, notification, or responsive layout must follow this guideline unless an explicit product decision overrides it.

The guideline is grounded in the official KUK rebranding material supplied for this project. The material identifies KUK La Tansa as consisting of KUK Bangunan and KUK Palen and specifies the brand colour palette and the Revans typeface. fileciteturn0file0L21-L28 fileciteturn0file0L37-L51

## 2. Brand Character
The interface should communicate:
- professional
- trusted
- established
- disciplined
- premium but restrained
- modern without losing KUK identity
- practical and efficient

Do not make the interface look playful, overly futuristic, overly luxurious, or like a generic SaaS template.

## 3. Brand Colour System
The official rebranding material provides the following palette:

| Token | Official colour | Usage |
|---|---|---|
| Brand Gold | `#FFCC00` | Primary accent, highlights, active emphasis, selected states, key brand moments |
| Brand Brown/Gold | `#996414` | Secondary accent, deeper gold/brown details, borders or premium supporting elements |
| White | `#FFFFFF` | Main surface/background where appropriate |
| Light Gray | `#E5E5E5` | Neutral surfaces, borders, table lines, inactive backgrounds |
| Red | `#FF0000` | Semantic danger/error/destructive state; do not use as the main brand colour unless justified |
| Deep Maroon | `#540000` | **Primary interface colour** for navigation, headings, prominent brand surfaces, primary actions and strong emphasis |

The design system must centralize these colours into tokens so they can be adjusted globally without rewriting components.

### Recommended semantic tokens
```css
--color-brand-primary: #540000;
--color-brand-primary-hover: #6A0A0A;
--color-brand-primary-active: #420000;
--color-brand-gold: #FFCC00;
--color-brand-gold-deep: #996414;
--color-surface: #FFFFFF;
--color-surface-muted: #E5E5E5;
--color-text: #231818;
--color-text-muted: #6F6464;
--color-border: #E5E5E5;
--color-danger: #FF0000;
```

The values above are implementation tokens. Do not invent a new palette per page.

## 4. Maroon + Gold Rule
Maroon is the dominant visual identity of the application.

Gold is a **small, deliberate accent**, not a second dominant colour.

Use gold for:
- logo/brand emphasis
- active navigation indicator
- selected tabs
- key totals
- important call-to-action emphasis
- premium data highlights
- subtle decorative rules
- hover/selected accents

Do not:
- create gold full-screen backgrounds
- make every button gold
- make every card bordered in gold
- use gold for ordinary text everywhere
- create a yellow-heavy interface

A typical screen should visually read as:
**Maroon + white/neutral foundation + small gold accents.**

## 5. Logo & Brand Mark
The provided rebranding material includes logo elements and separate visual identities for KUK Bangunan and KUK Palen. fileciteturn0file0L5-L16

Rules:
- Never stretch or distort the logo.
- Preserve logo proportions.
- Do not recolour the logo arbitrarily.
- Maintain sufficient clear space around the logo.
- Prefer the official logo asset supplied by the project owner.
- If the official asset is unavailable, do not recreate the logo manually with text unless explicitly approved.
- KUK Bangunan and KUK Palen may be surfaced as unit identities, but the application must remain one unified KUK La Tansa system.

## 6. Typography
The rebranding material identifies **Revans** as the brand typeface. fileciteturn0file0L21-L28

Use Revans as the primary brand/display font when the licensed font asset is available and legally usable.

For application UI text, prioritize readability. A highly legible secondary UI font may be used for dense data tables, forms, numbers, and long text if the project does not have a usable Revans webfont asset.

### Typography hierarchy
- Display: strong brand typography, used sparingly
- H1: page title
- H2: section title
- H3: card/section heading
- Body: readable regular text
- Label: compact and clear
- Caption: muted supporting information
- Numeric emphasis: strong weight with tabular numerals where appropriate

Never use typography as decoration at the expense of usability.

## 7. Layout Philosophy
The product is an operational management system. Information density should be controlled, not maximized.

Use:
- spacious content areas
- clear section hierarchy
- consistent grid
- predictable alignment
- strong whitespace rhythm
- generous table readability
- clear grouping of actions

Avoid:
- cluttered dashboards
- excessive cards
- tiny text
- random spacing
- overly rounded everything
- giant empty decorative areas that push operational data below the fold

## 8. Application Shell
The authenticated application should use:
- left sidebar navigation
- topbar
- global search / command palette
- notification area
- unit switcher
- user/profile menu
- optional breadcrumbs

### Sidebar
The sidebar is primarily maroon/dark, with:
- white or very light navigation text
- subtle hover surface
- gold active indicator/accent
- clear grouped navigation

The sidebar must not become visually noisy.

### Topbar
Use a light neutral/white surface with:
- page title/breadcrumb
- search
- notifications
- current unit
- user menu

## 9. Dashboard Design
The dashboard is a **command center**, not a poster.

Priority order:
1. critical actions / alerts
2. key KPI numbers
3. operational trends
4. recent activity
5. secondary analytics

Recommended structure:
- welcome/page header
- unit filter
- KPI row
- Action Center
- attendance/payroll/operations overview
- recent activity
- deeper analytics

Do not overload the first screen with every possible chart.

## 10. Cards
Cards should be used only when they improve grouping or scanning.

Default:
- white/neutral surface
- subtle border
- subtle shadow
- modest radius
- strong heading hierarchy

Reserve maroon fills for:
- selected cards
- important summary blocks
- special branded sections

Reserve gold for small accents, not full card decoration.

## 11. Buttons
Primary button:
- deep maroon background
- white text
- subtle hover/pressed state

Secondary button:
- white/neutral background
- maroon text and/or border

Accent button:
- gold only when the action benefits from premium emphasis and accessibility remains acceptable

Danger button:
- semantic red (`#FF0000`) or a darker accessible semantic variant

Every button must have:
- hover
- focus-visible
- disabled
- loading state where applicable

## 12. Forms
Forms must look professional and calm.

Rules:
- visible labels
- consistent field height
- clear required markers
- helpful descriptions only when needed
- inline validation
- strong focus state
- clear error messaging
- grouped sections
- mobile-friendly controls

Do not hide important labels inside placeholders.

Public forms should have a simplified, focused layout with no internal application navigation.

## 13. Tables
Tables are a first-class component because this product manages operational records.

Must support where applicable:
- search
- sorting
- filters
- date range
- unit filter
- status filter
- pagination
- row actions
- bulk actions where justified
- export

Use zebra striping only when it improves scanning. Avoid visually heavy tables.

## 14. Status System
Use consistent semantic badges throughout the application.

Examples:
- Draft
- Pending
- Approved
- Rejected
- Completed
- Cancelled
- Active
- Inactive
- Late
- Absent
- Leave
- Sick
- Permission
- Maintenance

Status colours must be semantically consistent. Brand maroon/gold should not replace semantic meaning where users need quick status recognition.

## 15. Icons
Use one consistent icon library/style.

Prefer simple outline icons for normal navigation and actions.

Do not mix:
- emoji as interface icons
- multiple icon families
- filled and outlined styles randomly

Emoji may appear only as content where appropriate, never as the core navigation language.

## 16. Motion
Motion should be subtle and functional.

Allowed:
- page/section transition
- hover response
- drawer/modal entry
- notification animation
- skeleton shimmer
- progress indicator

Avoid:
- constant floating effects
- excessive bounce
- decorative parallax
- long transition delays

Users are performing work; animation must never slow them down.

## 17. Responsive Design
The product must work on:
- desktop
- laptop
- tablet
- mobile

Mobile is especially important for public forms and on-site operational input.

On mobile:
- simplify navigation
- use compact topbar
- stack cards intelligently
- keep form controls thumb-friendly
- allow tables to scroll or transform appropriately
- avoid horizontal page overflow

## 18. Accessibility
Design and implementation must include:
- keyboard navigation
- visible focus state
- meaningful labels
- accessible contrast
- semantic HTML
- screen-reader-friendly status messages where useful
- no information conveyed by colour alone

## 19. Public Form Visual Language
Public forms should still clearly belong to KUK La Tansa, but should be significantly simpler than the internal dashboard.

Recommended structure:
- KUK branding
- form title
- concise instruction
- form fields
- submit action
- success/reference result

Do not expose:
- internal sidebar
- dashboard menu
- employee database
- payroll
- reports
- other forms

## 20. Data Visualization
Charts should be used only where they make a trend or comparison easier to understand.

Preferred chart goals:
- attendance trend
- violation trend
- leave trend
- payroll trend
- vehicle utilization
- unit comparison

Use maroon as the main series and gold as a selective comparison/highlight. Avoid rainbow charts.

## 21. Empty, Loading, Error, Success States
Every major screen must define:
- loading
- empty
- error
- success
- permission denied

These states must feel like part of the same design system, not afterthoughts.

## 22. Professionalism Rules
The application must never look like:
- a student project
- a generic Bootstrap admin template
- a collection of Google Forms
- an over-decorated marketing site
- a gaming dashboard

It should feel like a real operational product used daily by a professional organization.

## 23. Implementation Rule for Antigravity
Before creating or modifying a UI component, check this document first.

When a design conflict occurs:
1. preserve usability and accessibility
2. preserve official KUK brand identity
3. preserve consistency with the design system
4. only then add visual novelty

Do not invent a new visual language for individual modules.
