# Solaria Care · Care Documentation prototype

A clickable pre-sales / discovery prototype for replacing Solaria Care's paper nursing flow sheets:

> Administrative User configures clients and their care in the **Web Admin** → Care Staff open the **iPad** app → see their clients and today's required care → document care through the day → several staff contribute to one attributable daily record → completed and past records can be reviewed and printed.

React 18 + TypeScript + Vite, react-router (hash routing), plain CSS with its own healthcare tokens (deep blue, white surfaces, light blue-gray ground, teal for completed, amber for due, red only for overdue / errors). No UI kit, no backend, no real authentication. All data is fictional and lives in the browser (`localStorage`).

The prototype demonstrates intended workflows and controls. It is **not** a HIPAA-compliant system; production encryption, hosting, BAA, retention and security operations are implementation concerns.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: today's-care status, I/O reuse, access scope, completion, feature registry
npm run build      # type-check + static build into dist/
npm run preview    # serve the build on http://localhost:4173
npm run smoke      # browser run of both journeys, scope reduction and walkthroughs (needs Playwright)
```

The build is a relocatable static site (`base: './'`, hash routing), so it runs from any static host or sub-path, including GitHub Pages (`.github/workflows/deploy-pages.yml` builds and publishes on push to `main`; set Pages source to "GitHub Actions").

## Using it in a meeting

Open the start page, pick **Web Admin** or **Care Staff · iPad**, or start a guided walkthrough. The dashed **Prototype** bar is presenter-only: switch user / surface, walkthroughs, **Scope** (live scope reduction), demo clock and **Reset demo**. Credentials: password `demo`, MFA code `246810`, PINs = last 4 digits of employee ID.

- [DEMO_WALKTHROUGHS.md](DEMO_WALKTHROUGHS.md) - presenter scripts (Admin setup, Care Staff day, Lean version)
- [PROTOTYPE_SCOPE_MAP.md](PROTOTYPE_SCOPE_MAP.md) - roadmap ID → screen → user → surface → removable, plus assumptions and conflicts
- [SCOPE_REDUCTION_NOTES.md](SCOPE_REDUCTION_NOTES.md) - what can be removed and what that removal affects

## Architecture

```
src/features/registry.ts      every removable capability: roadmap refs, layer, dependencies, presets
src/features/FeatureContext   runtime scope flags (useFeature / <Feature>) - the only place scope is decided
src/features/modules.tsx      manifest: documentation types, care nav, admin nav, admin client tabs
src/domain/                   types, date helpers, pure rules (today's care, I/O totals, access scope, completion)
src/data/seed.ts              fictional scenario (6 clients, 7 staff, 8 days of history, today's entries)
src/store/store.tsx           shared state + all workflow actions + audit events, localStorage, reset
src/auth/                     sign-in + MFA, PIN quick switch, activation, password recovery, terms
src/care/                     iPad: client board, workspace, timeline, flow sheet, completion, records
src/care/forms/               one independent file per documentation type
src/admin/                    Web Admin: clients, client record tabs, schedule, medications, devices, authorizations, staff, audit
src/demo/                     presenter bar, walkthroughs, scope panel, start page (prototype-only)
src/shared/                   not-in-scope fallback, indicators
```

Design rules that keep features removable:

- Documentation forms only receive `client`, an optional scheduled item and `onSaved`; they write through `actions.addEntry`. Entries store their own title, summary and details, so the timeline, flow sheet and records never import a form.
- Navigation, pickers and admin tabs render from `modules.tsx` filtered by `useFeature`. Routes for out-of-scope features render a visible "not in the current scope" screen, never a blank page.
- Derived values (due / overdue counts, I/O totals, contributors, completion gaps) are computed from state in `src/domain/care.ts`; no screen stores its own copy.

## Known limitations

- Single-browser demo state; two tabs in one browser stay in sync, two machines do not.
- Authentication, MFA, invitation email, password reset and PDF generation are simulated (print uses the browser's *Save as PDF*).
- Time of day comes from the demo clock, not the real clock.
- Web Admin is designed for 1366-1440 px desktops; the Care Staff app for a 1024 px iPad (landscape or portrait). Phones work but are not a target.
