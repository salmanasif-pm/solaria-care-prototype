# Scope reduction notes

Use the presenter **Scope** panel to show the prospect each smaller version live. The presets are cumulative:

| Preset | Adds | What the prospect sees |
| --- | --- | --- |
| **Leanest version** | Sign-in with MFA, client board, open client, Care Activity, today's entries, logout | Login + MFA → Clients → client header → Add documentation (Care Activity only) → entry in timeline. No Web Admin: clients and staff are loaded once at go-live. |
| **Core care documentation** | Today's schedule (3.1), Observations (4.2), Intake & Output (4.3), Assessments (4.4) | Today's Care lists and counts appear; four documentation types. |
| **Extended clinical documentation** | Medications (4.8), Device care (4.7), Completion / sign-off (5.1), Records (5.2), Authorization periods (5.3), Terms, Activation / recovery | Medication doses, device records, Review & complete tab, Records nav. |
| **Full Phase 1 roadmap scope** | Web Admin: Client management (6.1), Schedule management (6.2), Staff & access (6.3), Audit trail (6.5) | Web Admin available in the switcher. |

No preset includes **future enhancements** (currently: PIN quick switch). They are off by default and must be switched on individually in Scope; they are not in the Phase 1 estimate.

## What can be removed independently

| Capability | Remove on its own? | Knock-on effect |
| --- | --- | --- |
| Observations, Intake & Output, Assessments | Yes | Scheduled items of that type are documented as a Care Activity. Past entries still show. I/O card disappears with Intake & Output; toileting output is still recorded on the activity. |
| Medications | Yes | Doses leave Today's Care; the admin Medications tab goes. |
| Specialized care (devices) | Yes | Web Admin Devices tab, device indicators and the iPad device-care form go; assessments stop showing device-specific questions. |
| Completion & sign-off | Yes | Flow sheets stay open (no locked record, no parent-copy field). Records still list them. |
| Records & history | Yes | **Also removes** authorization-period history (dependency). |
| Authorization periods | Yes | Records loses the "current period" filter. |
| Today's care schedule (3.1) | Yes | **Also removes** schedule management (6.2). Client board loses due / overdue counts. |
| Schedule management (6.2) | Yes | Schedule is set up once (import) and shown read-only to staff. |
| Client management (6.1) | Yes | **Also removes** schedule management. Clients loaded at go-live. |
| Staff & access (6.3) | Yes | **Also removes** activation / password recovery; accounts provisioned at go-live. |
| Audit trail viewer (6.5) | Yes | Events are still captured by the backend; only the viewer goes. Not advisable for HIPAA. |
| Terms acceptance | Yes | Compliance trade-off to discuss. |
| PIN quick switch | Already excluded | Future / recommended idea only. Baseline hand-over is log out → sign in with own account. |
| Client board, Care Activity, timeline, sign-in with MFA, logout | **No** | This is the minimum usable product. MFA is baseline security (common authentication), not a budget option. |

## Removing a capability from the code

1. Switch it off in the Scope panel and click through: nothing else should break.
2. Delete its form / screen file(s) and its line in `src/features/modules.tsx` (and its route in the owning shell if it has one).
3. Remove or keep its entry in `src/features/registry.ts` (keeping it with `removable: true` and the flag off is harmless).
4. `npm run build && npm test && npm run smoke` (drop smoke steps for the removed feature).

## Things to be careful about

- Removing the Web Admin entirely means setup data (clients, staff, schedules) needs a one-time import and a support process for changes.
- Removing completion / sign-off removes the "completed record integrity" story; corrections are still append-only.
- Removing the audit viewer is cheap, but audit capture itself should stay in the backend.
