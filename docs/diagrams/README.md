# Presentation diagrams

Two Sales / client-facing flow diagrams, one per user of the Phase 1 prototype. Show the diagram first, then demo the matching experience.

| Diagram | PNG (3840×2160, for slides) | SVG (scalable, editable, font embedded) | Demo it with |
| --- | --- | --- | --- |
| Care Staff · iPad - what Care Staff do each day | `care-staff-ipad-flow.png` | `care-staff-ipad-flow.svg` | Walkthrough **B** |
| Administrative User · Web Admin - what the administrator sets up | `admin-web-flow.png` | `admin-web-flow.svg` | Walkthrough **A** |

Content follows the current Phase 1 scope: the same screen names as the prototype (Clients → client → Add documentation → Review & complete · Records; Clients · Care Instructions & Schedule · Staff · Audit Trail). Future ideas (PIN quick switch) and technical / security detail are deliberately left out.

Visual language: PureLogics design system. The token values are copied from `quicktake-design-system/vendor/purelogics-ds/tokens`, and the layout grammar follows `src/proposals/pl-structured` in that repo: tabs straddle their cards, navy marks the core step, green marks the outcome, and the nested-triangle corner motif. Sen (SIL OFL) is embedded from `fonts/`.

Regenerate after editing text or layout in `build-diagrams.mjs`:

```bash
node docs/diagrams/build-diagrams.mjs   # needs Playwright (local or global install)
```
