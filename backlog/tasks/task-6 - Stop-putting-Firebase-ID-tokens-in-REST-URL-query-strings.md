---
id: TASK-6
title: Use Firebase-documented RTDB REST ID-token auth
status: Ready for deployment
assignee: []
created_date: '2026-10-28 13:57'
updated_date: '2026-10-28 15:18'
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
Security report flagged auth=<idToken> in Realtime Database REST URLs (leak risk via logs/referrers) and suggested header-only auth. Firebase RTDB REST only accepts Firebase ID tokens via the auth query parameter; Authorization Bearer is for Google OAuth access tokens. Removing auth= caused HTTP 401 on lobby creation and feature requests. Correct approach for REST: keep auth=, do not send ID tokens as Bearer. Avoiding tokens in URLs requires migrating callers to the native Database SDK.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 REST requests authenticate with a Firebase ID token via the auth query parameter required by the Realtime Database REST API
- [x] #2 Requests do not send Firebase ID tokens as Authorization Bearer (that header is only for Google OAuth access tokens)
- [x] #3 Lobby creation and other authenticated REST reads succeed again under database rules
- [x] #4 Regression test asserts the ID token is passed as auth= and not as Bearer
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirmed root cause: Firebase RTDB REST accepts ID tokens only via ?auth=; Authorization Bearer is for Google OAuth access tokens. Header-only broke all authenticated REST calls (401). 2. Restore auth=<idToken> on prepareRequest URLs. 3. Remove misleading Authorization Bearer with the ID token. 4. Update regression test to match Firebase-documented auth. 5. Note that avoiding tokens in URLs requires migrating REST callers to the native SDK — ask before opening that follow-up.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed auth query param from prepareRequest; REST auth is header-only. Added regression test.

Verified with jest --testPathPattern=firebase-rest: firebase-rest-auth and firebase-rest-errors both passed (5 tests).

Restored auth= after user 401 on lobbyCodes; removed incorrect Bearer ID-token header.

Unit tests pass after restore. AC #3 needs a manual app check (create lobby / feature requests) after reload.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored Firebase-documented auth= for interim REST, then superseded by TASK-7 SDK migration. User confirmed app works after SDK path + explicit database URL.
<!-- SECTION:FINAL_SUMMARY:END -->
