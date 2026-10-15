---
id: doc-1
title: Feature requests and Backlog sync
type: guide
created_date: '2026-10-15 20:20'
updated_date: '2026-10-15 20:21'
---
# Feature requests and Backlog.md

## Model

| Stage | Backlog.md | In-app boardStatus |
| --- | --- | --- |
| Submitted, not synced | (none yet) | Request pending |
| Intake | **Draft** (off the Kanban board) | Request received |
| Accepted after review | Promoted task, status **Request Accepted** | Request Accepted |
| Engineering | Board: Request Accepted to In Progress to Ready for deployment to Done | Same as board |

Review action: backlog draft promote DRAFT-id (new tasks use default status Request Accepted).

## Sync bridge

The Expo app cannot run the Backlog CLI. npm run sync:feature-requests uses Firebase Admin to:

1. Create a draft for each unlinked Firebase request (embeds featureRequestId marker in the description).
2. Write backlogId, backlogPhase, and boardStatus Request received.
3. After promote/status changes, re-resolve by id or marker and mirror board status into Firebase.

Client security rules stay author-only for title/description; clients cannot change backlog link fields. Only Admin sync writes those.

## Out of scope

Cloud Functions / always-on sync from the phone. Agents or developers run the sync script when processing intake.
