---
id: TASK-7.1
title: Add error-preserving SDK database helpers
status: Ready for deployment
assignee: []
created_date: '2026-10-28 14:31'
updated_date: '2026-10-28 14:42'
labels:
  - security
dependencies: []
references:
  - services/database.ts
  - firebase-data
modified_files:
  - services/database.ts
  - tests/database-detailed.test.ts
parent_task_id: TASK-7
priority: high
type: task
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
services/database.ts readData currently swallows errors as null, which cannot safely replace restGetDetailed for flows like lobby code allocation that must distinguish empty vs failed. Need SDK helpers with detailed ok/failure results comparable to firebaseRest types.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SDK read/write/push/patch/delete helpers return detailed success or failure (path, method/op, error message)
- [x] #2 Empty data and permission/network failures are distinguishable
- [x] #3 Unit tests cover success, missing data, and failure mapping
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add DbFailure/DbGetResult/DbWriteResult/DbPushResult types aligned with RestFailure. 2. Implement readDataDetailed/writeDataDetailed/updateDataDetailed/deleteDataDetailed/pushDataDetailed using RN Firebase SDK and preserve errors. 3. Add unit tests with mocked database module covering success, missing data, and failures. 4. Link modified files to firebase-data.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added Db* result types and read/write/push/update/delete detailed helpers. Fixed sync onValue unsubscribe TDZ. tests/database-detailed.test.ts: 7 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added error-preserving SDK helpers in services/database.ts so empty snapshots and permission/network failures are distinguishable. Verified with npm test -- --testPathPattern=database-detailed (7 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
