---
id: TASK-2
title: Input fields on small screens
status: Done
assignee:
  - '@cursor'
created_date: '2026-10-15 20:23'
updated_date: '2026-10-15 20:50'
labels: []
dependencies: []
references:
  - settings
  - app/(tabs)/settings/feature-requests.tsx
  - utils/scale.ts
  - shared-ui
  - lobby
  - voting-session
modified_files:
  - utils/scale.ts
  - tests/scale.test.ts
  - app/(tabs)/settings/feature-requests.tsx
  - app/userInput.tsx
  - app/voting.tsx
  - app/waitingRoom.tsx
  - components/vote-draft-panel.tsx
  - app/(tabs)/settings/team-edit.tsx
  - tests/input-touch-targets.test.ts
priority: medium
type: bug
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Text inputs on smaller phones can end up too short to tap and read comfortably. Users report fields without enough vertical size, which makes typing titles, names, and other short values awkward and error-prone.

Current behavior: some screens size inputs with fixed padding (for example Feature requests modal TextInputs use paddingVertical 14 / fontSize 16 without the shared scale helper), while many vote-flow screens already use scale() for spacing and type. Small viewports, large system font, or keyboards can leave single-line fields visually cramped.

Key paths to audit: app/(tabs)/settings/feature-requests.tsx modal inputs, other TextInput sites under app/ and components/ (lobby join, team edit, user input), utils/scale.ts.

featureRequestId: uHsL69sfm3yoo5jOMr4z
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Single-line text inputs used for typing keep a minimum tappable height that remains comfortable on small phone viewports (roughly down to common ~320–360 dp widths)
- [x] #2 Feature requests modal Title and Subtitle fields meet that minimum height; multiline Subtitle still expands for longer text
- [x] #3 Other primary TextInput entry points in the app (lobby/team/user flows) either already meet the same bar or are updated for consistency
- [x] #4 No input label or value is clipped at the default system font size on those small widths
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a touchTarget helper in utils/scale.ts that floors control height at 44dp so scale() cannot shrink inputs below a comfortable tap size.
2. Apply it to Feature requests modal inputs (minHeight + scaled type) and primary TextInput entry points: userInput, team-edit, voting, waitingRoom modal, vote-draft-panel.
3. Add a source-contract test and link modified files + groma refs (settings, shared flows as owned).
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added touchTarget() floored at 44dp and applied it to Feature requests modal inputs plus lobby/team/voting TextInputs so small phones keep comfortable tap heights. Verified with jest tests/scale.test.ts and tests/input-touch-targets.test.ts (6 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
