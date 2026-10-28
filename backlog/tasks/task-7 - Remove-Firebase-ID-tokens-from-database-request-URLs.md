---
id: TASK-7
title: Remove Firebase ID tokens from database request URLs
status: Done
assignee: []
created_date: '2026-10-28 14:31'
updated_date: '2026-10-28 15:19'
labels:
  - security
dependencies:
  - TASK-6
references:
  - services/firebaseRest.ts
  - services/database.ts
  - 'https://firebase.google.com/docs/database/rest/auth'
  - firebase-data
modified_files:
  - services/database.ts
  - tests/database-detailed.test.ts
  - services/firebaseRest.ts
  - tests/firebase-rest-auth.test.ts
  - tests/firebase-rest-errors.test.ts
  - hooks/usePolledRestData.ts
  - tests/use-polled-rest-data.test.ts
priority: high
type: bug
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Security finding: authenticated Realtime Database REST calls put Firebase ID tokens in ?auth= query strings, which can leak via proxy logs, crash reporters, and OS network diagnostics. Header-only auth is not supported for Firebase ID tokens on RTDB REST (TASK-6). The app already has @react-native-firebase/database via services/database.ts; authenticated user traffic should use that SDK so tokens never appear in URLs. REST remains unsafe for this goal while it is the data path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No authenticated client database request puts an ID token in a URL query string
- [x] #2 Lobby create/join, waiting room, voting, history, teams, feature requests, and version check still work under existing security rules
- [x] #3 Callers that rely on detailed failure results still get actionable errors (not silent null) for permission and network failures
- [x] #4 Automated tests cover SDK-backed reads/writes and assert no auth= token URLs remain in the client data path
- [x] #5 Manual smoke: create lobby, join lobby, vote, open feature requests
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. TASK-7.1: Add detailed SDK helpers that distinguish empty vs failure. 2. TASK-7.2: Reimplement firebaseRest ops on those helpers; remove auth= fetch path. 3. TASK-7.3: Switch usePolledRestData to SDK realtime. 4. Verify with unit tests + manual smoke checklist.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Subtasks 7.1-7.3 implemented on branch. Automated suites for database-detailed, firebase-rest, use-polled-rest-data all pass. AC2/AC5 need device smoke after rebuild.

Fix: getDb now passes EXPO_PUBLIC_FIREBASE_DATABASE_URL explicitly to getDatabase so unsubstituted google-services firebase_url placeholder no longer crashes native SDK.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved authenticated RTDB traffic onto the native SDK (detailed helpers + firebaseRest facade + realtime subscriptions) so ID tokens are no longer placed in REST URLs. Also pass EXPO_PUBLIC_FIREBASE_DATABASE_URL explicitly into getDatabase to avoid unsubstituted google-services placeholders. Verified with unit tests and user device smoke (lobby/feature flows).
<!-- SECTION:FINAL_SUMMARY:END -->
