---
id: TASK-3
title: Clickable still-voting roster on wait screen
status: Done
assignee:
  - '@casper'
created_date: '2026-10-26T10:44:00Z'
updated_date: '2026-10-26T11:08:00Z'
labels: []
dependencies: []
references:
  - app/votingWaiting.tsx
  - voting-session
modified_files:
  - utils/votingWaitRoster.ts
  - tests/voting-wait-roster.test.ts
  - app/votingWaiting.tsx
  - tests/vote-flow-chrome.test.ts
priority: medium
type: feature
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After casting a vote, the waiting screen only shows a numeric "waiting for N more votes" hint. Voters want to see who is still deciding and who has already voted without leaving the screen.

Participants and boolean vote receipts are already polled on the waiting screen; this work surfaces that data as named status copy and an expandable roster.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Status line names remaining voters: 1 → Name is still voting; 2 → Name and Name are still voting; 3+ → FirstName and n others are still voting (n = remaining - 1)
- [x] #2 Tapping the status line opens an inline list of people still voting
- [x] #3 From that list, a secondary control extends to show who has already voted; collapsing the status line closes both sections
- [x] #4 Host Go to results and exit behavior remain unchanged; no vote contents are revealed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add utils/votingWaitRoster.ts helpers to partition participants by voteReceipts (sort by joinedAt) and format the still-voting status line.
2. Unit-test the copy helper for 1 / 2 / 3+ remaining cases.
3. Update VotingWaitingScreen: tappable mention, inline still-voting roster, secondary expand for already voted; live updates from existing polls.
4. Extend vote-flow-chrome source assertions for the new wiring.
5. Link modified files + voting-session ref on this task; open PR on cursor/voting-wait-roster-be97.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification: formatStillVotingMention + partitionVotingRoster unit tests pass (1/2/3+ copy). vote-flow-chrome asserts tappable roster wiring (formatStillVotingMention, handleToggleRoster, Show who voted, collapse clears votedOpen) and that the old numeric hint is gone. Host results persistLobbyStatus path and Exit replace to /(tabs) unchanged. Interactive device tap not exercised in this cloud environment.

Merged PR #1 to main. iOS 1.7.1 (24) built and submitted to App Store Connect (submission c6aa6cf5-869a-477a-aca8-d9b683ab4acc). Also committed eas.json ascAppId and version bump 1.7.1 on main.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Voters waiting after casting a vote now see a named still-voting status line (Name is… / Name and Name… / Name and n others…). Tapping it opens an inline still-voting roster with a secondary Show who voted expand for people who already submitted. Helpers live in utils/votingWaitRoster.ts; UI in app/votingWaiting.tsx. Tests: voting-wait-roster + vote-flow-chrome (17 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
