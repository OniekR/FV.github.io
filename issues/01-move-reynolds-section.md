Title: Move Reynolds calculations into a dedicated section

Description:
Move the Reynolds numbers UI and the step-by-step calculations into a separate section on the page (e.g., a new column or block titled "Reynolds & Rheology"). This will make the well schematic and flow inputs less cluttered and improve discoverability for users who want in-depth analysis.

Acceptance criteria:
- A new section exists with an accessible heading (e.g. `<h2>Reynolds & Rheology</h2>`) and `role="region"`.
- The Reynolds inputs and step-by-step outputs are moved into that section.
- Layout remains responsive; on narrow screens the section stacks but is still clearly discoverable.
- Unit tests (or a small test plan) for the calculation rendering are added.

Labels: enhancement, high
Assignees: 

Notes:
- Consider extracting render logic into a small module/file to keep page-specific script minimal.