---
id: TASK-6
title: Stop putting Firebase ID tokens in REST URL query strings
status: Ready for deployment
assignee: []
created_date: '2026-10-28 13:57'
updated_date: '2026-10-28 13:58'
labels:
  - security
dependencies: []
references:
  - services/firebaseRest.ts
  - firebase-data
modified_files:
  - services/firebaseRest.ts
  - tests/firebase-rest-auth.test.ts
priority: high
type: bug
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Security report (high): prepareRequest in services/firebaseRest.ts appends auth=<idToken> to every Realtime Database REST URL while also sending Authorization: Bearer. Query strings are commonly logged by proxies, crash reporters, and OS network diagnostics, and may appear in referrer/history artifacts. Prefer header-only auth.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 prepareRequest builds REST URLs without an auth query parameter
- [x] #2 Authenticated REST calls still send Authorization: Bearer with the ID token
- [x] #3 Existing firebase REST callers keep working with header-only auth
- [x] #4 Regression coverage asserts authenticated request URLs do not contain the ID token
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create branch fix/firebase-rest-header-only-auth from current HEAD. 2. Change prepareRequest to return the database URL without appending auth=<idToken>; keep returning the token for Authorization: Bearer. 3. Add a focused regression test that mocks auth + database URL + fetch and asserts the request URL has no auth query param while Authorization Bearer is set. 4. Run the new/related tests. 5. Link modified files and owning Groma component on TASK-6.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed auth query param from prepareRequest; REST auth is header-only. Added regression test.

Verified with jest --testPathPattern=firebase-rest: firebase-rest-auth and firebase-rest-errors both passed (5 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stopped appending auth=<idToken> to Realtime Database REST URLs in prepareRequest; callers already send Authorization: Bearer. Added tests/firebase-rest-auth.test.ts asserting the URL has no auth query param and Bearer is set. Verified with npm test -- --testPathPattern=firebase-rest (5 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
