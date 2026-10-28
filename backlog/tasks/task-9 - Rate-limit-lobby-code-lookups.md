---
id: TASK-9
title: Rate-limit lobby code lookups
status: Done
assignee: []
created_date: '2026-10-28 20:09'
updated_date: '2026-10-28 20:20'
labels:
  - security
dependencies: []
references:
  - database.rules.json
  - app/userInput.tsx
  - security_notes.md
  - lobby
  - firebase-data
modified_files:
  - services/lobbyCodeLookup.ts
  - app/userInput.tsx
  - tests/lobby-code-lookup.test.ts
  - security_notes.md
  - app.json
priority: high
type: bug
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Security residual risk: lobbyCodes is readable by any authenticated user, so the official app can be used to brute-force join codes. RTDB rules cannot throttle reads, and Cloud Functions would require a Blaze plan upgrade. Add a durable client-side rate limit in the app around lobby code lookups (create collision checks + join).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Client-side rate limit blocks excessive lobbyCodes lookups without Cloud Functions or a Blaze plan
- [x] #2 Join preview counts each distinct code once per window (polling the same code does not burn the quota)
- [x] #3 Create-time code collision checks and join lookups go through the rate-limited helper
- [x] #4 Users see a clear try-again-later message when limited
- [x] #5 Unit tests cover allow/deny of the rate-limit bucket
- [x] #6 security_notes.md documents the client-side limit and residual bypass risk
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace Cloud Function lookup with AsyncStorage-backed client rate limit + RTDB reads. 2. Remove functions package/config and @react-native-firebase/functions wiring. 3. Gate userInput create/join/preview through the helper (one credit per distinct preview code). 4. Update tests and security_notes. 5. Keep rules open for lobbyCodes reads (no grant model).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pivoting away from Cloud Functions: stay on Spark/no plan upgrade with client-side throttling only.

Client-side AsyncStorage rate limit (20/10min). Removed Cloud Functions path. Tests: lobby-code-lookup 4 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added client-side lobby code lookup throttling without Cloud Functions: AsyncStorage bucket, unique-code join preview, create collision checks gated, UI alerts on limit. Verified with npm test -- --testPathPattern=lobby-code-lookup (4 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
