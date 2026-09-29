# Prototype scope map

Roadmap source: *Solaria Care HIPAA-Compliant Patient Management Tool - Roadmap & Estimate* (Technical Business Requirements, Questions & Client Requirements, Future Phases, Project Scope sheets).

Every row below is a feature in `src/features/registry.ts`. **Removable = No** means it is part of the leanest journey and is always on. Everything else can be switched off live in the presenter **Scope** panel.

Interpretation order used: latest Acceptance Criteria and feature placement → current Project Scope / role structure → the intent agreed for this prototype → older Technical Details only where they do not contradict those. Where an older Technical Details cell suggested deeper or duplicated ("mobile") behaviour, the prototype does **not** implement it.

**Classification:** *Phase 1 / Core* = leanest journey (always on) · *Optional / removable* = Phase 1 roadmap scope that Sales can remove · *Future / recommended* = demo-only idea, off by default, **not in the Phase 1 estimate** · *Demo-only convenience* = presenter tools, not product.

## Surface responsibilities

| Web Admin (configuration / management) | Care Staff iPad (day-to-day care) |
| --- | --- |
| Client create / edit, status | View permitted clients (location + care area) |
| Care instructions & scheduled activities | View care instructions and today's schedule |
| Medication setup (name, dose, route, schedule) | Medication administration (Given / Held / Refused / Omitted) |
| Feeding-tube / trach device baseline record | Read-only device info + daily site-care observations |
| Authorization periods | Records filter by current authorization period |
| Staff accounts, roles, care-area access | Open daily record, observations, I/O, assessments, activities |
| Audit review | Shared timeline, corrections, review / sign-off, history |

No maintenance workflow is duplicated across the two surfaces.

## Roadmap → prototype

| Roadmap | Capability | Registry id | Prototype route / screen | User | Surface | Removable | Depends on |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2.3, 2.5 | Sign in, logout, session end | `clientBoard` | `/care/signin`, `/admin/signin`, user menu → Log out | Both | Both | No | - |
| 2.3, 7.1 | MFA verification step (common authentication, part of every version) | `mfa` | Sign-in step 2 (code `246810`) | Both | Both | No | - |
| 2.1, 2.4 | Invitation activation and password recovery | `accountLifecycle` | `/care/activate`, `/{surface}/forgot`, Staff → Resend invite / Reset credentials | Both | Both | Yes | `staffManagement` |
| 2.2 | Terms acceptance record | `termsAcceptance` | `/{surface}/terms` (shown when version not accepted) | Both | Both | Yes | - |
| 4.1 | Care-area client board, open / initialise today's flow sheet | `clientBoard` | `/care/clients`, `/care/clients/:id` | Care Staff | iPad | No | - |
| 4.5 | Routine care activities (toileting, brief change, enrichment, outdoor) | `activities` | Add documentation → Care Activity | Care Staff | iPad | No | - |
| 4.6 | Shared daily timeline, attribution, corrections | `dailyTimeline` | Workspace "Today's entries", `/care/clients/:id/flow-sheet` | Care Staff | iPad | No | - |
| 3.1 | Care instructions & today's schedule (due / overdue / completed / not done) | `careSchedule` | Workspace "Today's care", `/care/today` | Care Staff | iPad | Yes | - |
| 4.2 | Observations / vitals | `observations` | Add documentation → Observations / Vitals | Care Staff | iPad | Yes | - |
| 4.3 | Intake & output | `intakeOutput` | Add documentation → Intake & Output; I/O card | Care Staff | iPad | Yes | - |
| 4.4 | Assessments (10 sections incl. COVID-19 Yes/No) | `assessments` | Add documentation → Assessment | Care Staff | iPad | Yes | - |
| 4.8 | Medication setup + Given / Held / Refused / Omitted | `medications` | Admin client → Medications; iPad → Medication | Admin, Care Staff | Both | Yes | - |
| 4.7 | Feeding-tube / trach device baseline (Web Admin) + daily site care (iPad, device shown read-only) | `specializedCare` | Admin client → Devices; iPad → Specialized Care | Admin, Care Staff | Both | Yes | - |
| 5.1 | Review, PCA / Licensed Nurse / RN signature areas (required combination TBD), parent copy, complete | `completionSignoff` | `/care/clients/:id/complete` | Care Staff | iPad | Yes | - |
| 5.2 | Records by client + date range, read-only, print / PDF | `history` | `/care/records`, `/care/records/:sheetId` | Care Staff | iPad | Yes | - |
| 5.3 | Authorization periods + current-period filter | `authorizationHistory` | Admin client → Authorization Periods; Records toggle | Admin, Care Staff | Both | Yes | `history` |
| 6.1, 6.4 | Client management (create / edit / duplicate check), Web Admin shell | `clientManagement` | `/admin/clients`, `/admin/clients/new`, `/admin/clients/:id` | Admin | Web | Yes | - |
| 6.2 | Care instructions & schedule management, change history | `scheduleManagement` | `/admin/schedule`, `/admin/clients/:id/care-schedule` | Admin | Web | Yes | `clientManagement`, `careSchedule` |
| 6.3 | Staff & access (invite, role, location / care areas, deactivate) | `staffManagement` | `/admin/staff` | Admin | Web | Yes | - |
| 6.5, 7.1 | Audit trail viewer | `auditTrail` | `/admin/audit` | Admin | Web | Yes | - |
| 7.1 | HIPAA concepts: individual users, MFA, care-area access scope, logout, audit, completed-record integrity | (cross-cutting) | Sign-in, Guard, `permittedClients`, audit events, read-only completed sheets | Both | Both | - | - |

## Future / recommended enhancements (demo-only, not in the Phase 1 estimate)

| Idea | Registry id | Where it can be shown | Why it might be added later |
| --- | --- | --- | --- |
| Shared-iPad quick switch by PIN | `quickSwitch` (layer `future`, off by default) | Scope → Future enhancements → switch on; then sign-in "Future idea: switch user with PIN" and user menu | If repeated full sign-in on shared iPads proves operationally burdensome. **Phase 1 baseline:** User A logs out → User B signs in with their own account, which keeps individual attribution. |

Demo-only convenience (not proposed product functionality): the dashed **Prototype** bar (Viewing as, Walkthroughs, Scope, demo clock, iPad frame, Reset demo), the start page, "Fill …" helpers in yellow notes.

## Not built (out of scope per roadmap)

MyTimeStation replacement/integration, ClaimMD / billing, parent portal or messaging (parent copy is a record field only), broader attendance / appointment scheduling, physician care-plan authoring / approval / version diff, drug database / interactions / pharmacy / e-prescribing / PRN enforcement, form builder, AI, analytics, configurable RBAC, automatic PCA / LVN / RN workflow separation, offline sync, group multi-client entry, handoff notes, billing-unit tracking and expiry dashboards, scanned legacy uploads, production security infrastructure.

## Assumptions and roadmap conflicts (flagged, conservative demo behaviour)

1. **Where admin setup lives.** Resolved: client, care-schedule, medication and device baseline setup live in the **Web Admin** (latest scope placement). Older Technical Details that say "mobile administrative mode" are treated as stale; nothing is duplicated on the iPad.
2. **Medication setup owner.** One source: the client's Medications tab in Web Admin (feature `medications`). The iPad only documents administration.
3. **Web Admin does not show flow sheets.** Per 6.4 ("do not duplicate the mobile client/care/flow-sheet modules on web"). Admin sees setup, staff and audit only.
4. **Roles.** Two application roles (Administrative User, Care Staff). PCA / LVN / RN / Direct-Care Staff are labels on entries and signatures, not permissions (Question 3 open).
5. **Sign-off (TBD with nursing leadership).** The three signature areas from the paper form are shown, none marked mandatory; the prototype only needs at least one signature plus the parent-copy answer before completion. Any signed-in Care Staff can sign any area. Completion is not blocked by undocumented scheduled care (a warning is shown). If Solaria confirms required areas, set `required` in `SIGNOFF_ROLES` (`src/care/CompletionPage.tsx`).
6. **Corrections and late entries.** Append-only: a correction is a new attributed entry; the original stays, marked corrected. Entries after completion are attributed addenda.
7. **MFA and hand-over.** MFA applies to full sign-in and is simulated with a fixed code. Shared-device hand-over in Phase 1 is log out / sign in; PIN quick switching is a future idea only.
8. **Access scope.** Care Staff see active clients in their own location **and** care areas (7.1). Admin assignment drives it.
9. **Care day.** One flow sheet per client per calendar date, created when the client is first opened. Hourly view shows 07:00-18:00 (roadmap 4.2 note); other times remain in the timeline.
10. **Scheduled items and removed modules.** If a scheduled item's documentation type is out of scope, it opens the Care Activity form so the item can still be completed.
11. **Devices.** One current baseline record per device, maintained in Web Admin; the iPad shows it read-only and records daily site care against it. Client indicators derive from it.
12. **Demo data.** Seeded schedules run every day so the demo works on any weekday; the demo clock defaults to 10:40 AM. Payers and people are fictional.
13. **Terms text** is placeholder until Solaria supplies the approved terms (2.2).
