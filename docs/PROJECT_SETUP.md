Creating a GitHub Project Board for FV.github.io

This short guide walks you through creating a Project board and adding the prepared issues from the repository.

1) Create the Project board (web UI):
   - Go to the repo page on GitHub: https://github.com/OniekR/FV.github.io
   - Click on the `Projects` tab (or `Projects` in the top-level menu) and choose `New project`.
   - Choose `Board` (or `Kanban`) and name it (e.g., "Workboard - FV").
   - Use default columns: To do, In progress, Done.

2) Create labels (optional but recommended):
   - Go to `Settings` → `Labels` in the repository.
   - Add the labels from `.github/labels.json` (names and suggested colors are provided there).
   - Example: "high", "medium", "low", "enhancement", "bug".

3) Add prepared issues (manual or scripted):
   - Manual: Copy the contents of `issues/*.md` and create new issues in the Issues tab. Use the suggested title and add labels.
   - Scripted (optional): If you later want to automate issue creation, you can use `gh` or a small script using the GitHub REST API and a PAT.

4) Add issues to the board: 
   - Open your new project board and click `Add cards` → `Add existing issues` and search the issues you created.
   - Place them under `To do`.

5) Workflow suggestions:
   - Use the `high/medium/low` labels for priority.
   - Use `enhancement/bug/documentation` labels for categorization.
   - Optionally add `epic` or `research` label for larger initiatives.

If you'd like, I can also create the issues for you (I already prepared the file drafts under `issues/`); say “Create issues” and I will either create them via API (if you provide a PAT) or add them locally and push, and you can convert them into issues quickly via copy/paste.