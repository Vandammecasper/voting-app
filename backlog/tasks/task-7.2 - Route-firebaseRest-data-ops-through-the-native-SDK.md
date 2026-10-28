---
id: TASK-7.2
title: Route firebaseRest data ops through the native SDK
status: Done
assignee: []
created_date: '2026-10-28 14:32'
updated_date: '2026-10-28 15:19'
labels:
  - security
dependencies:
  - TASK-7.1
references:
  - services/firebaseRest.ts
  - services/database.ts
  - firebase-data
modified_files:
  - services/firebaseRest.ts
  - tests/firebase-rest-auth.test.ts
  - tests/firebase-rest-errors.test.ts
parent_task_id: TASK-7
priority: high
type: task
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Call sites widely import restGet/restPut/etc. Lowest-risk fix is to keep those APIs but implement them with the native Database SDK so ID tokens never enter fetch URLs. Remove prepareRequest auth= URL construction from the authenticated data path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 restGet/restPut/restPatch/restDelete/restPush/restUpdatePaths use the native SDK, not fetch with auth=
- [x] #2 Existing screens keep working without a large call-site rewrite
- [x] #3 Tests assert no auth query parameter is built for these operations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reimplement restGet/Put/Patch/Delete/Push/UpdatePaths via database detailed helpers. 2. Remove fetch, databaseUrl, auth= token URL construction, and getCurrentIdToken from the data path. 3. Keep RestFailure-compatible types and signed-in guard. 4. Update auth regression tests to assert no fetch/auth= usage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
firebaseRest now delegates to SDK detailed helpers; fetch/auth= removed. Auth tests assert no fetch.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Routed restGet/Put/Patch/Delete/Push/UpdatePaths through the native Database SDK so ID tokens never enter REST URLs. Verified with npm test -- --testPathPattern=firebase-rest (7 passed across auth+errors).
<!-- SECTION:FINAL_SUMMARY:END -->
