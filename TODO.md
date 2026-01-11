# TODO

This file captures the short-term roadmap and next work items for the Flow Velocity Calculator (`FV.github.io`). Use this as the single place for quick notes and priorities; I can also create Issues or a Project board if you want these tracked in GitHub.

Generated: 2026-01-11

---

## High priority

- [ ] Move Reynolds numbers and calculations into their own section on the page
  - Rationale: keeps the schematic visually separate from analytic details and improves discoverability.
  - Notes: extract the Reynolds UI and calculation logic into a self-contained section, with its own heading and `role="region"`.

- [ ] Maintain well schematic horizontally next to flow calculations
  - Rationale: keep the well schematic visible while users interact with the flow inputs/outputs.
  - Notes: use a responsive two-column layout; on narrow screens the schematic should still stack but prioritize readability.

- [ ] Style and improve Reynolds calculations for accuracy and understanding
  - Rationale: improve labels, units, method (explicitly document approximations for Bingham plastic simplifications), and add tooltips.
  - Notes: add small explanatory text for PV/YP/AV, provide units, and consider validating against test vectors.

---

## Medium priority

- Add unit tests for rheology calculation helpers (e.g., conversion functions, Re computations)
- Add an accessibility review and fix any issues (WCAG basics)
- Add linting (ESLint) and formatting (Prettier) with pre-commit hooks

---

## Next actions (suggested)

1. I can create GitHub Issues for each TODO item above and add labels (priority: high/medium; area: UI/math/accessibility). Reply "Create issues" to proceed.
2. Or, I can keep this file as the canonical TODO and update it as we progress.

---

If you want a Project board or Issue templates created, say the word and I'll set them up.
