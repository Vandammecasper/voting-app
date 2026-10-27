---
id: TASK-4
title: Polish still-voting roster as bottom dropdown
status: Done
assignee:
  - '@casper'
created_date: '2026-10-27T08:01:00Z'
updated_date: '2026-10-27T08:51:00Z'
labels: []
dependencies: []
references:
  - app/votingWaiting.tsx
  - voting-session
modified_files:
  - app/votingWaiting.tsx
  - tests/vote-flow-chrome.test.ts
priority: medium
type: enhancement
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The post-vote still-voting roster works but does not read as a dropdown: the open panel lacks a clear outline, and the Show who voted chevron does not stay centered or rotate about its own center.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Still-voting control is a bottom-positioned dropdown with a clear bordered outline when open
- [x] #2 Show who voted chevron is centered and rotates about its own center
- [x] #3 Existing still-voting copy, tap-to-open, and already-voted expand behavior remain
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Restyle votingWaiting roster as a bottom dropdown trigger + bordered menu panel (match select-dropdown outline cues).
2. Fix RosterChevron: fixed-size centered wrapper so rotation is about the icon center; center the Show who voted control.
3. Update chrome assertions if needed; open PR on cursor/voting-wait-roster-dropdown-be97.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restyled as bordered bottom dropdown (trigger + menu panel matching select-dropdown cues). Chevron rotates inside fixed chevronBox so spin is about center; Show who voted stacks label + centered chevron via extendControlInner. Tests: voting-wait-roster + vote-flow-chrome 17 passed.

Closed still-voting mention is plain underlined text again (no bordered trigger). Only the opened roster panel keeps the clear dropdown outline.

Opened roster panel is absolutely positioned above the mention (bottom: 100%) so opening it does not reflow title, vote count, or host CTA.

Opened roster panel capped at maxHeight s(220) with nested ScrollView so long name lists scroll inside the overlay.

Merged PR #2. iOS 1.7.1 (25) built and submitted to App Store Connect (submission c6ace182-e86d-43d7-962a-dd280d9b7068).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Still-voting status is now a bottom dropdown with a clear bordered outline. The Show who voted chevron is centered under its label and rotates about its own center. Behavior (copy, open roster, expand already voted) unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
