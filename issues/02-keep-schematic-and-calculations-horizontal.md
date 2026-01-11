Title: Maintain well schematic horizontally next to flow calculations

Description:
Ensure the well schematic stays horizontally adjacent to the flow calculation inputs/outputs at common desktop widths. Use a responsive two-column layout so the schematic is visible while the user interacts with inputs.

Acceptance criteria:
- Desktop layout shows schematic on the left (or right) and inputs on the other column.
- Mobile layout stacks with clear order (preferably inputs first, schematic second).
- No overlap between the schematic SVG and calculation panels; panels are positioned with CSS grid/flexbox and not absolute positioning.
- Layout is tested at common breakpoints (320px, 480px, 768px, 1024px).

Labels: enhancement, medium
Assignees:

Notes:
- Avoid absolute positioning for the calculation boxes; prefer grid or flex layout.
- Provide a fallback for very narrow screens that prevents horizontal scroll.