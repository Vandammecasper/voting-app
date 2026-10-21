---
name: promote-feature-request-drafts
description: >-
  Promote Backlog feature-request drafts to board tasks, set board status, and
  mirror status into Firebase via sync. Use when the user asks to promote drafts,
  put drafts on the board, accept feature requests, or update feature-request
  statuses after promote.
---

# Promote feature-request drafts to the board

Voting-app workflow: Backlog drafts (from `npm run sync:feature-requests`) → tasks on the board → Firebase `boardStatus` mirror.

Never edit Backlog markdown under `backlog/` directly. Use the `backlog` CLI only.

## Prerequisites

1. Run `backlog instructions overview` if not already read this conversation.
2. Confirm draft IDs (`DRAFT-n` or numeric). View each: `backlog draft view <id> --plain`.
3. Preserve sync markers in every description edit:
   - `featureRequestId: <id>`
   - `Submitted by: <name>` (when present)

## Board statuses

Configured board columns (also Firebase-mirrored after promote):

`Request Accepted` → `In Progress` → `Ready for deployment` → `Done`

Default for new tasks is `Request Accepted` (`backlog/config.yml`). Promote usually lands there without an extra edit.

## Workflow

Copy and track:

```
Promote progress:
- [ ] 1. View drafts; enrich if thin
- [ ] 2. Promote each draft
- [ ] 3. Confirm / set board status
- [ ] 4. Sync feature requests
- [ ] 5. Report draft → task → status
```

### 1. Enrich if thin (optional but preferred)

If description is only the raw user sentence, or ACs are empty, enrich before promote:

- Description: problem + why it hurts, current app behavior + key paths, then the preserved `featureRequestId` / `Submitted by` lines.
- `--ac` / `--acceptance-criteria`: specific, testable outcomes (not implementation steps).
- Set `--type` / `--priority` when obvious; `--add-ref` for Groma components and key source files.

```bash
backlog draft edit DRAFT-N --type feature --priority medium \
  --add-ref some-component --add-ref path/to/file.ts \
  -d "<enriched description with featureRequestId marker>" \
  --acceptance-criteria "..." \
  --acceptance-criteria "..."
```

On Windows PowerShell, prefer invoking `node …/backlog.md/cli.js` with a here-string for `--description` so multi-line text is not split by `backlog.cmd`.

Do **not** add an implementation `--plan` while still a draft unless the user is starting work immediately.

### 2. Promote

```bash
backlog draft promote DRAFT-N
```

Promote one ID per call. Repeat for each draft. Output is `Promoted draft DRAFT-N` — resolve the new task ID next.

### 3. Resolve task IDs and board status

```bash
backlog search "<draft title keywords>" --plain
# or
backlog task list --status "Request Accepted" --plain
```

If status is already `Request Accepted` and that is what the user wanted, skip edit.

Otherwise set explicitly:

```bash
backlog task edit TASK-N -s "Request Accepted" --plain
```

Only use another board status when the user asks (e.g. `In Progress`). Read `backlog instructions task-execution` before moving work into active implementation statuses and assigning yourself.

### 4. Mirror into Firebase

```bash
npm run sync:feature-requests
```

Expect lines like:

`[sync] Updated <featureRequestId> → TASK-N (task) status="Request Accepted"`

If sync fails on CSS/`theme` imports, import status helpers from `services/feature-request-status-core.ts` (Node-safe), not `feature-request-status.ts`.

### 5. Report

Summarize a table:

| Draft | Task | Board status |
|-------|------|--------------|
| DRAFT-N | TASK-N | Request Accepted |

Note sync `created` / `updated` / `unchanged` counts.

## Related (not this skill)

- Creating the sync pipeline itself → Backlog docs for feature-request sync.
- Implementing a promoted task → `backlog instructions task-execution` then `task-finalization`.
- Groma architecture edits → `groma agent-instructions`; never edit Groma-owned files directly.
