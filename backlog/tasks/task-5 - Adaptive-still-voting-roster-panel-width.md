---
id: TASK-5
title: Adaptive still-voting roster panel width
status: Ready for deployment
assignee:
  - '@casper'
created_date: '2026-10-27T09:03:00Z'
updated_date: '2026-10-27T09:08:00Z'
labels: []
dependencies: []
references:
  - app/votingWaiting.tsx
  - voting-session
modified_files:
  - utils/votingRosterLayout.ts
  - tests/voting-roster-layout.test.ts
  - app/votingWaiting.tsx
  - tests/vote-flow-chrome.test.ts
priority: medium
type: enhancement
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The still-voting overlay panel stretches full width. It should start only as wide as a single-column name list needs, widen to a two-column list when max height would be exceeded, and only then allow scrolling.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Opened panel width fits a one-column name list when content fits under max height
- [x] #2 When one-column content exceeds max height, panel widens to a two-column name list before enabling scroll
- [x] #3 Scrolling is available only after two-column layout still exceeds max height
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Shrink-wrap overlay panel (centered) instead of full width.
2. Measure content height vs maxHeight: start 1 column; if overflow switch to 2 columns; if still overflow enable ScrollView scrolling.
3. Update chrome tests; PR on cursor/voting-roster-adaptive-width-be97.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Panel shrink-wraps for 1-column names; onLayout overflow → 2-column wrap (maxWidth 260); further overflow enables nested ScrollView. Logic in nextRosterLayoutMode with unit tests.

Small-screen pass: getRosterPanelLimits caps overlay to ≤40% viewport height and available width (minus insets) down to ~320×568; long names ellipsize; status/show-who-voted controls use touchTarget min height.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Still-voting overlay starts content-narrow in one column, widens to two columns when height would overflow, and only then becomes scrollable under maxHeight s(220).
<!-- SECTION:FINAL_SUMMARY:END -->
