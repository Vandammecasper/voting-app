---
id: TASK-8
title: Keep host vote reads anonymous (secret ballot)
status: Done
assignee: []
created_date: '2026-10-28 15:38'
updated_date: '2026-10-28 15:45'
labels:
  - security
dependencies: []
references:
  - database.rules.json
  - security/authorization-matrix.json
  - app/voting.tsx
  - app/results.tsx
  - firebase-data
modified_files:
  - database.rules.json
  - security/authorization-matrix.json
  - app/voting.tsx
  - app/waitingRoom.tsx
  - app/userInput.tsx
  - app/(tabs)/history.tsx
  - security_notes.md
priority: high
type: bug
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Security review: hosts can currently read votes keyed by Firebase uid, which binds each ballot to a voter. Product intent is secret ballot for the reveal — the host may read vote content aloud and see who has/has not voted (voteReceipts), but must not learn who cast which ballot. Other participants already use receipts for that roster.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vote bodies are stored under opaque ballot ids, not Firebase uids
- [x] #2 Host can still read vote content for the results reveal without a uid-to-ballot mapping
- [x] #3 Host and participants can still see who voted / who has not via voteReceipts
- [x] #4 Voters can still detect their own prior vote and open their ballot without exposing that mapping to the host
- [x] #5 Authorization matrix and rules tests cover host cannot infer voter from vote path; participant cannot read foreign ballots while voting
- [x] #6 security_notes.md documents the secret-ballot model
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Store ballots under opaque ids; add ownBallots// pointer readable only by that voter. 2. Update RTDB rules + authorization matrix/fixtures/cases. 3. Change vote submit and already-voted checks to receipts/ownBallots. 4. Update security_notes. 5. Run rules tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rules tests: npm run test:rules — 74 passed. Deploy database.rules.json before relying on this in production.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Secret ballot: votes use opaque ballot ids; voteReceipts remain the shared who-voted roster; ownBallots is voter-private. Host can read anonymous vote content for the reveal but cannot read ownBallots. Verified with authorization-matrix rules tests (74 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
