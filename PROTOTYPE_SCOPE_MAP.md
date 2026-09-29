# Prototype scope map

Roadmap source: *Solaria Care HIPAA-Compliant Patient Management Tool - Roadmap & Estimate* (Technical Business Requirements, Questions & Client Requirements, Future Phases, Project Scope sheets).

Every row below is a feature in `src/features/registry.ts`. **Removable = No** means it is part of the leanest journey and is always on. Everything else can be switched off live in the presenter **Scope** panel.

## Roadmap → prototype

| Roadmap | Capability | Registry id | Prototype route / screen | User | Surface | Removable | Depends on |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2.3, 2.5 | Sign in, logout, session end | `clientBoard` | `/care/signin`, `/admin/signin`, user menu → Log out | Both | Both | No | - |
| 2.3 | MFA verification step | `mfa` | Sign-in step 2 (code `246810`) | Both | Both | Yes | - |
| 2.1, 2.3, 7.1 | Shared-iPad quick switch by PIN | `quickSwitch` | `/care/switch`, sign-in "Switch user with PIN" | Care Staff | iPad | Yes | - |
| 2.1, 2.4 | Invitation activation (password + PIN), password recovery | `accountLifecycle` | `/care/activate`, `/{surface}/forgot`, Staff → Resend invite / Reset credentials | Both | Both | Yes | `staffManagement` |
| 2.2 | Terms acceptance record | `termsAcceptance` | `/{surface}/terms` (shown when version not accepted) | Both | Both | Yes | - |
| 4.1 | Care-area client board, open / initialise today's flow sheet | `clientBoard` | `/care/clients`, `/care/clients/:id` | Care Staff | iPad | No | - |
| 4.5 | Routine care activities (toileting, brief change, enrichment, outdoor) | `activities` | Add documentation → Care Activity | Care Staff | iPad | No | - |
| 4.6 | Shared daily timeline, attribution, corrections | `dailyTimeline` | Workspace "Today's entries", `/care/clients/:id/flow-sheet` | Care Staff | iPad | No | - |
| 3.1 | Care instructions & today's schedule (due / overdue / completed / not done) | `careSchedule` | Workspace "Today's care", `/care/today` | Care Staff | iPad | Yes | - |
| 4.2 | Observations / vitals | `observations` | Add documentation → Observations / Vitals | Care Staff | iPad | Yes | - |
| 4.3 | Intake & output | `intakeOutput` | Add documentation → Intake & Output; I/O card | Care Staff | iPad | Yes | - |
| 4.4 | Assessments (10 sections incl. COVID-19 Yes/No) | `assessments` | Add documentation → Assessment | Care Staff | iPad | Yes | - |
| 4.8 | Medication setup + Given / Held / Refused / Omitted | `medications` | Admin client → Medications; iPad → Medication | Admin, Care Staff | Both | Yes | - |
| 4.7 | Feeding-tube / trach device record + daily site care | `specializedCare` | Admin client → Devices; iPad → Specialized Care | Admin, Care Staff | Both | Yes | - |
| 5.1 | Review, PCA / Licensed Nurse / RN sign-off, parent copy, complete | `completionSignoff` | `/care/clients/:id/complete` | Care Staff | iPad | Yes | - |
| 5.2 | Records by client + date range, read-only, print / PDF | `history` | `/care/records`, `/care/records/:sheetId` | Care Staff | iPad | Yes | - |
| 5.3 | Authorization periods + current-period filter | `authorizationHistory` | Admin client → Authorization Periods; Records toggle | Admin, Care Staff | Both | Yes | `history` |
| 6.1, 6.4 | Client management (create / edit / duplicate check), Web Admin shell | `clientManagement` | `/admin/clients`, `/admin/clients/new`, `/admin/clients/:id` | Admin | Web | Yes | - |
| 6.2 | Care instructions & schedule management, change history | `scheduleManagement` | `/admin/schedule`, `/admin/clients/:id/care-schedule` | Admin | Web | Yes | `clientManagement`, `careSchedule` |
| 6.3 | Staff & access (invite, role, location / care areas, deactivate) | `staffManagement` | `/admin/staff` | Admin | Web | Yes | - |
| 6.5, 7.1 | Audit trail viewer | `auditTrail` | `/admin/audit` | Admin | Web | Yes | - |
| 7.1 | HIPAA concepts: individual users, MFA, care-area access scope, logout, audit, completed-record integrity | (cross-cutting) | Sign-in, Guard, `permittedClients`, audit events, read-only completed sheets | Both | Both | - | - |

Presenter-only (not proposed product functionality): the dashed **Prototype** bar (Viewing as, Walkthroughs, Scope, demo clock, iPad frame, Reset demo), the start page, "Fill …" helpers in yellow notes.

## Not built (out of scope per roadmap)

MyTimeStation replacement/integration, ClaimMD / billing, parent portal or messaging (parent copy is a record field only), broader attendance / appointment scheduling, physician care-plan authoring / approval / version diff, drug database / interactions / pharmacy / e-prescribing / PRN enforcement, form builder, AI, analytics, configurable RBAC, automatic PCA / LVN / RN workflow separation, offline sync, group multi-client entry, handoff notes, billing-unit tracking and expiry dashboards, scanned legacy uploads, production security infrastructure.

## Assumptions and roadmap conflicts (flagged, conservative demo behaviour)

1. **Where admin setup lives.** The Project Scope sheet and the brief put client, care-schedule and medication setup in the **Web Admin**. The technical details of 6.1 / 6.2 / 4.8 and the user-role note say "mobile administrative mode". The prototype follows the Project Scope sheet (Web Admin) and flags this for confirmation - it changes Hybrid vs Web effort.
2. **Medication setup owner.** 4.8 calls mobile medication setup the single source; 6.2 says medication schedule data is owned by 6.2. The prototype keeps one source: the client's Medications tab in Web Admin (feature `medications`).
3. **Web Admin does not show flow sheets.** Per 6.4 ("do not duplicate the mobile client/care/flow-sheet modules on web"). Admin sees setup, staff and audit only.
4. **Roles.** Two application roles (Administrative User, Care Staff). PCA / LVN / RN / Direct-Care Staff are labels on entries and signatures, not permissions (Question 3 open).
5. **Sign-off.** PCA and Licensed Nurse signatures are *assumed* required, RN "where applicable"; any signed-in Care Staff can sign any area. Completion is not blocked by undocumented scheduled care (a warning is shown). Configuration lives in `SIGNOFF_ROLES` (`src/care/CompletionPage.tsx`).
6. **Corrections and late entries.** Append-only: a correction is a new attributed entry; the original stays, marked corrected. Entries after completion are attributed addenda.
7. **MFA** applies to full sign-in only; PIN quick switch does not require MFA (roadmap 2.3 note). MFA is simulated with a fixed code.
8. **Access scope.** Care Staff see active clients in their own location **and** care areas (7.1). Admin assignment drives it.
9. **Care day.** One flow sheet per client per calendar date, created when the client is first opened. Hourly view shows 07:00-18:00 (roadmap 4.2 note); other times remain in the timeline.
10. **Scheduled items and removed modules.** If a scheduled item's documentation type is out of scope, it opens the Care Activity form so the item can still be completed.
11. **Devices.** One current record per device, editable from both surfaces (4.7 lets care staff maintain details); client indicators derive from it.
12. **Demo data.** Seeded schedules run every day so the demo works on any weekday; the demo clock defaults to 10:40 AM. Payers and people are fictional.
13. **Terms text** is placeholder until Solaria supplies the approved terms (2.2).
