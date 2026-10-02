# Pre-sales prototype playbook

How we build clickable sales / discovery prototypes with Claude Code, distilled from Cascadia, HHC and Solaria Care. Use it in two ways:

- **Claude Code threads:** read this before starting a new prototype.
- **GPT / planning threads:** use it to write the instructions you hand to Claude Code. The kickoff template in section 1 is the part to copy.

Reference repos: `cascadia-prototype`, `hhc-prototype`, `solaria-care-prototype`. Solaria is the most complete example: feature registry, scope presets, walkthroughs, smoke suite, diagrams.

---

## 0. Before the thread starts (human checklist)

These blocked or slowed the Solaria thread. Do them up front.

| Do this | Why |
| --- | --- |
| Create the GitHub repo (final name, public or private) and enable **Pages → Source: GitHub Actions** | Claude cannot create repositories (403). Pages on a private repo needs a paid plan. |
| Attach the new repo to the Claude Code session along with the reference repos | Claude can only push to repos attached to the session. |
| Share the roadmap / estimate sheet with the connected Google account | Claude reads it through the Drive connector; the full export is needed, not a preview. |
| Have someone open the live Pages URL after deploy | The sandbox cannot reach `*.github.io`. Claude verifies the CI run and runs the smoke suite against the same build, but cannot open the live site. |
| Say which design system the **diagrams** use (usually PureLogics) and which visual direction the **prototype** uses (usually the client's own domain style) | Without this, Claude blends them. |

## 1. Kickoff prompt template (copy, fill, send)

```
Build a clickable sales/discovery prototype for [CLIENT] - [one-line product description].

Sources and authority (highest first):
1. Latest acceptance criteria and feature placement in the roadmap: [ROADMAP LINK]
2. Current Project Scope sheet and role structure
3. The intent in this brief
4. Older Technical Details, only where they don't contradict the above
If sources conflict, follow this order and record the conflict in PROTOTYPE_SCOPE_MAP.md.
Never expand scope because an older description suggests a deeper implementation.

References: [cascadia-prototype, hhc-prototype, solaria-care-prototype] for structure, demo
mechanics, walkthroughs, scope controls and test depth only. Do not reuse their branding,
terminology, roles, data or domain logic.

Users and surfaces: [e.g. Administrative User - Web Admin (configuration); Care Staff - iPad (daily work)].
Each maintenance workflow lives on exactly one surface.
Roles: keep to [N] application roles. Job titles may appear as labels, not permissions.

Story to demonstrate: [setup user configures X] -> [operational user does Y] -> [result Z is visible].
Leanest usable journey (always on, never removable): [Login (+MFA) -> ... -> Logout].

Budget posture: we expect budget pressure. Build every optional capability as a removable
module behind a central feature registry with live Scope presets. Classify everything as
Core / Optional-removable / Future-recommended / Demo-only. Future ideas are off by default,
excluded from every preset, and labelled "not in the Phase 1 estimate". Login and MFA are
baseline, not budget options.

Unconfirmed requirements: [list, e.g. sign-off rules]. Show the concept, label it TBD, model
it conservatively. Don't present it as a settled rule.

Explicitly out of scope: [from the roadmap's Future Phases / Out of Scope sheets].

Visual direction for the prototype: [palette, tone, target viewports, e.g. 1366-1440 desktop, 1024 iPad].

Stack: Vite + React + TS, static, hash routing, no UI kit, localStorage demo data with Reset.
Deploy: push main to [OWNER/REPO] (already created, Pages via GitHub Actions enabled).

Deliverables: the app, README.md, PROTOTYPE_SCOPE_MAP.md, DEMO_WALKTHROUGHS.md,
SCOPE_REDUCTION_NOTES.md, unit tests for rules, Playwright smoke suite, deployed URL.
Don't stop for approval after each screen; record assumptions in the scope map.
```

## 2. Lessons that should now be defaults

**Scope and positioning**
- Read the whole roadmap (export the sheet; previews truncate). Map every capability to a roadmap ID before coding.
- The baseline must stay lean. Don't add convenience features the roadmap doesn't ask for. If one is worth showing, build it as a labelled **Future** module that is off by default. Solaria's PIN quick switch was built as core first and had to be demoted.
- Security basics (individual login, MFA, logout, audit capture) are baseline. Don't offer them as budget cuts.
- Unconfirmed business rules (sign-off combinations, who may document what) are shown as fields or concepts marked "TBD". No mandatory flags until the client confirms.
- Every maintenance workflow on one surface only. If old technical text says "mobile" and newer scope says "web", follow the newer scope.
- Prototype claims nothing about compliance ("demonstrates intended controls; not HIPAA-compliant").

**Architecture (copy from Solaria)**
- `src/features/registry.ts`: one entry per capability, with roadmap IDs, layer (`lean / core / extended / admin / future`), `removable` and `dependsOn`. Presets are cumulative, and `future` is never part of one.
- `src/features/modules.tsx`: a manifest of forms, nav items and tabs. Shells render from it. Removing a feature means deleting its file and its manifest line.
- Records carry their own display summary, so timelines, history and print views never import a form.
- A route whose feature is out of scope shows a labelled "not in scope" screen, never a blank page.
- Presenter controls sit in a visually distinct bar (dashed, "Prototype" tag): switch user / surface, walkthroughs, Scope, demo clock, Reset. Never mix them into product navigation.
- Walkthroughs are data (`walkthroughs.ts`): each step sets user, surface, route and a highlight target, and is skipped when its feature is out of scope. Steps are tagged Core / Optional / Future in the docs.
- Demo data must work on any day: fixed demo clock, schedules that run every day, some items done, some due, one overdue.

**Quality bar**
- Unit tests for the pure rules (status derivation, totals, access scope, completion, registry presets).
- A Playwright smoke suite that clicks through both journeys and covers cross-surface effects (admin change visible to field user), validation errors, every scope preset, every walkthrough, a 1024px layout check and Reset.
- Run the smoke suite against the production build served under the Pages sub-path (`/<repo>/`) before calling it deployed.
- Look at screenshots at each target viewport before reporting. The smoke suite catches broken flows, not ugly ones.

## 3. Follow-up prompt patterns that worked

- **Alignment pass:** "Make the smallest changes that resolve these contradictions; don't redesign; re-run only affected tests plus final smoke/build; update only the docs that change."
- **Close-out:** "Close the work out rather than starting another iteration. Deploy and confirm."
- **Minor cleanups:** list them precisely (file / wording / desired text). That is faster than asking for a review.
- **Diagrams:** "One per user perspective, derived from the built prototype; boxes and arrows or module blocks with 2-3 short examples; exclude future and technical detail; [design system]; PNG + SVG; apply the 20-30 second test." Ask for footers that name the matching prototype screens so Sales can show the diagram and then demo.

## 4. Environment notes for Claude Code (cloud sandbox)

- Playwright and Chromium are preinstalled globally. Don't `npm i playwright` or `playwright install`. ESM `import('playwright')` fails, so fall back to `createRequire(npm root -g)` (see `scripts/smoke.mjs`).
- Google Fonts fails TLS inside the sandbox, so local screenshots show fallback fonts. Real browsers are fine. For exported images, embed OFL fonts (Sen is in `docs/diagrams/fonts/`).
- `*.github.io` and Actions artifact downloads (`*.blob.core.windows.net`) are blocked. Verify a deploy through the Actions run status plus a local sub-path smoke run, and ask the human to open the URL.
- A new repo often has an "Initial commit" README. Fetch it and merge (`-s ours` keeps our README) rather than force-pushing.
- The preview server dies when the container restarts. Restart `vite preview` before re-running smoke if every step fails with `ERR_CONNECTION_REFUSED`.

## 5. Deliverable checklist

- [ ] App deployed; CI green; smoke passes on the sub-path build; human confirmed the live URL
- [ ] `PROTOTYPE_SCOPE_MAP.md`: authority order, surface table, roadmap → screen → user → surface → removable → dependency, future section, assumptions and conflicts
- [ ] `SCOPE_REDUCTION_NOTES.md`: presets, what each removal breaks, what can never be removed
- [ ] `DEMO_WALKTHROUGHS.md`: scripts tagged Core / Optional / Future, credentials, questions to ask the client
- [ ] `README.md`: run, deploy, architecture, limitations
- [ ] `docs/diagrams/`: one diagram per user, PNG + SVG, plus the build script
