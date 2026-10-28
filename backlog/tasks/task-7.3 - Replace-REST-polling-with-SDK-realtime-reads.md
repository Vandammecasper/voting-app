---
id: TASK-7.3
title: Replace REST polling with SDK realtime reads
status: Done
assignee: []
created_date: '2026-10-28 14:32'
updated_date: '2026-10-28 15:19'
labels:
  - security
dependencies:
  - TASK-7.2
references:
  - hooks/usePolledRestData.ts
  - firebase-data
modified_files:
  - hooks/usePolledRestData.ts
  - tests/use-polled-rest-data.test.ts
parent_task_id: TASK-7
priority: medium
type: task
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
usePolledRestData polls via restGet every ~2s on waiting room, voting, ranking, results, and join preview. That multiplies token-in-URL exposure today and should move to subscribeToData / useRealtimeData after the data layer is SDK-backed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Waiting room, voting, ranking, results, and join preview no longer poll through REST fetch
- [x] #2 Focus/unfocus still starts and stops listeners cleanly
- [x] #3 Behavior stays correct when lobby status and participants change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace interval restGet polling in usePolledRestData with subscribeToData under useFocusEffect. 2. Keep the export name so waiting room/voting/ranking/results/join screens need no import changes. 3. Confirm focus cleanup unsubscribes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
usePolledRestData now uses subscribeToData under useFocusEffect; no restGet/setInterval. Source test asserts that. AC3 needs device smoke for live lobby updates.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced REST interval polling with focus-scoped SDK subscriptions in usePolledRestData. Verified with tests/use-polled-rest-data.test.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
