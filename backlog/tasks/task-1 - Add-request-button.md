---
id: TASK-1
title: Add request button
status: Done
assignee:
  - '@cursor'
created_date: '2026-10-15 20:23'
updated_date: '2026-10-15 20:48'
labels: []
dependencies: []
references:
  - settings
  - app/(tabs)/settings/feature-requests.tsx
  - components/gradient-button.tsx
  - shared-ui
modified_files:
  - components/gradient-button.tsx
  - app/(tabs)/settings/feature-requests.tsx
  - tests/gradient-button.test.ts
priority: high
type: bug
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In the Feature requests New/Edit modal, the primary Save action (PrimaryButton) often appears to have no visible label. Users cannot tell what the gradient control does, which makes submitting or updating a request unclear and hurts accessibility.

Current behavior: the modal footer uses a Close control beside a PrimaryButton with children Save / Saving…. PrimaryButton lays out a LinearGradient with scaled typography (fontSize scale(24)) and the modal applies flex:1 via styles.modalSaveButton. On narrower layouts the label can clip or fail to read clearly inside the shared row.

Key paths: app/(tabs)/settings/feature-requests.tsx (modal footer), components/gradient-button.tsx (PrimaryButton label rendering).

featureRequestId: InStE-3YxnO4b28MPN5c
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Feature requests modal primary action always shows a readable label (Save when idle, Saving… while in flight) on phone-sized widths
- [x] #2 The label remains visible for both New and Edit modes and when the button is disabled (empty title)
- [x] #3 Screen readers still announce the button via accessibilityLabel matching the visible text
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Fix PrimaryButton so external layout styles (e.g. flex:1) size the pressable only, not crush the gradient label; keep the label readable with adjustsFontSizeToFit.
2. Ensure Feature requests modal Save/Saving… always shows visible text in New/Edit and disabled states; accessibilityLabel stays the children string.
3. Link modified files + settings/shared-ui refs on the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PrimaryButton: layout styles stay on PressableScale; label uses adjustsFontSizeToFit. Modal Save uses smaller textStyle.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed PrimaryButton so flex layout no longer clips the Save label: gradient fills the pressable, text uses adjustsFontSizeToFit, modal uses a smaller textStyle. Verified with jest tests/gradient-button.test.ts (2 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
