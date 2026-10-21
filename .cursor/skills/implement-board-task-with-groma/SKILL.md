---
name: implement-board-task-with-groma
description: >-
  Implement Backlog board tasks while keeping Groma architecture links current
  so work appears on the map. Use when implementing, coding, or executing a
  Backlog task (TASK-n), picking up board work, or when the user wants changes
  visible on the Groma architecture.
---

# Implement board tasks with Groma visibility

For every Backlog board implementation in this repo: use the `backlog` and `groma` CLIs so the task’s modified files and architecture element refs stay current. Those links place the task on the Groma map. Do **not** edit files under `backlog/` or `groma/` by hand.

## When this applies

- User asks to implement / pick up / work on `TASK-n` or board work
- Agent is about to change application or architecture-related source for a tracked task

If there is no Backlog task yet, create or identify one first (`backlog instructions task-creation`), then follow this skill.

## Startup (every conversation / every task)

1. `backlog instructions overview` (once per conversation if not already read).
2. Before planning, status/assignee changes, or implementation: `backlog instructions task-execution`.
3. Before scanning, inspecting, curating, or changing files for a Backlog task: `groma agent-instructions`, then open the named guide for the job — at minimum **`groma agent-instructions backlog`**.
4. `backlog task view TASK-n --plain` — note status, ACs, existing `--modified-file` list, and `--ref` IDs.

If Groma reports a **first scan** (no descriptions/overviews yet), tell the user once and ask whether to curate. Curate only after they agree. Routine task work still needs file/ref links even when not curating.

## Board + plan

Configured statuses: `Request Accepted` → `In Progress` → `Ready for deployment` → `Done`.

```bash
backlog task edit TASK-n -s "In Progress" -a @your-name
# Research code, then record plan before coding:
backlog task edit TASK-n --plan "1. ..."
```

Present the plan for approval when it includes a material product/architecture decision or the user asked for review.

## Make every change visible on the architecture

**Rule:** After each repository file change (and after each Groma structural command), update the Backlog task **before** touching the next file. Do not defer links until tests or Done.

### Resolve owning component

```bash
groma view <repo-relative-source-file>
```

Use the printed **component element ID** for `--add-ref`. Refs must be real groma.md element IDs — not titles, paths, group addresses, or issue URLs.

### Record files + refs

`--modified-file` **replaces** the full list. Always re-pass every previous path, then append newly changed paths (one flag per file, first-changed order):

```bash
backlog task edit TASK-n \
  --modified-file path/already/recorded.ts \
  --modified-file path/just/changed.ts \
  --add-ref <groma-element-id>
```

After Groma structural commands (`ok` / `created:` / `changed:` / `removed:` / `affected:` / `replaced: old -> new`):

- Append all created/changed/removed architecture paths to the modified-file list
- `--add-ref` surviving/affected IDs
- `--remove-ref` absorbed/old IDs from `replaced:`

Full detail: `groma agent-instructions backlog`.

### Architecture edits

Change architecture **only** via `groma` (`edit`, `add`, `draft`, `accept`, `remove`, …). Never hand-edit `groma/**/*.md`.

- New responsibility / unclear ownership → read `groma agent-instructions structure` (and describe/relationships guides as needed), then update the map, then link the task.
- Same component, behavior-only change → linking modified files + existing component ref is enough; skip a full scan/curation cycle unless structure actually changed.

## Implementation loop

```
Task + Groma:
- [ ] View task; set In Progress; write plan
- [ ] Read groma agent-instructions (+ backlog guide)
- [ ] Change one file / focused slice
- [ ] backlog task edit: full --modified-file list + --add-ref
- [ ] Repeat until ACs met
- [ ] Finalize via backlog instructions task-finalization
```

After meaningful slices, optionally `--append-notes` on the task.

When implementation looks complete: `backlog instructions task-finalization` — check ACs with evidence, final summary, then terminal status. Run `npm run sync:feature-requests` if the task has a `featureRequestId` marker so Firebase mirrors board status.

## Anti-patterns

- Editing `groma/` or `backlog/` Markdown directly
- Changing several source files before any `--modified-file` / `--add-ref` update
- Using file paths or titles as architecture refs
- Full scan + curation on every tiny fix (links are enough for routine code)
- Skipping Groma entirely because “it’s just app code”

## Related skills

- Promote drafts onto the board: `.cursor/skills/promote-feature-request-drafts/SKILL.md`
