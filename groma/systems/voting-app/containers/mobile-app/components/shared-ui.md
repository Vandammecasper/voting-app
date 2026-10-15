---
type: C4 Component
title: Shared UI
status: stable
groma:
  id: shared-ui
  parent: mobile-app
  code:
    - scanner: typescript
      file: constants/theme.ts
    - scanner: react
      file: components/themed-view.tsx
    - scanner: typescript
      file: components/themed-view.tsx
    - scanner: react
      file: components/themed-text.tsx
    - scanner: typescript
      file: components/themed-text.tsx
    - scanner: react
      file: components/gradient-button.tsx
    - scanner: typescript
      file: components/gradient-button.tsx
    - scanner: react
      file: components/gradient-text.tsx
    - scanner: typescript
      file: components/gradient-text.tsx
      symbol: GradientText
    - scanner: react
      file: components/pressable-scale.tsx
    - scanner: typescript
      file: components/pressable-scale.tsx
      symbol: PressableScale
    - scanner: react
      file: components/select-dropdown.tsx
    - scanner: typescript
      file: components/select-dropdown.tsx
      symbol: SelectDropdown
    - scanner: react
      file: components/screen-back-button.tsx
    - scanner: typescript
      file: components/screen-back-button.tsx
      symbol: ScreenBackButton
    - scanner: react
      file: components/swipe-pager.tsx
    - scanner: typescript
      file: components/swipe-pager.tsx
      symbol: SwipePager
    - scanner: react
      file: components/ui/icon-symbol.tsx
    - scanner: typescript
      file: components/ui/icon-symbol.tsx
      symbol: IconSymbol
    - scanner: react
      file: components/ui/icon-symbol.ios.tsx
    - scanner: typescript
      file: components/ui/icon-symbol.ios.tsx
      symbol: IconSymbol
    - scanner: typescript
      file: constants/motion.ts
    - scanner: typescript
      file: utils/haptics.ts
    - scanner: typescript
      file: utils/scale.ts
    - scanner: typescript
      file: hooks/useReducedMotion.ts
      symbol: useReducedMotion
    - scanner: typescript
      file: hooks/useTabSceneBottomInset.ts
      symbol: useTabSceneBottomInset
    - scanner: typescript
      file: hooks/usePullToRefreshGuard.ts
  group: Platform services
  technology: React Native, Reanimated
description: Theme, controls, icons, and motion helpers.
---

Defines colors and themed text/view wrappers, interactive controls (gradients, pressables, dropdowns, swipe pager), platform icons, haptics, scaling, reduced-motion, and tab inset helpers used across screens.

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [components/pressable-scale.tsx](../../../../../../components/pressable-scale.tsx) | [app/(tabs)/settings/teams.tsx](../../../../../../app/(tabs)/settings/teams.tsx) | Invokes supplied callback: onPress | react |
| [components/pressable-scale.tsx](../../../../../../components/pressable-scale.tsx) | [app/onboarding/step2.tsx](../../../../../../app/onboarding/step2.tsx) | Invokes supplied callback: onPress | react |
| [components/pressable-scale.tsx](../../../../../../components/pressable-scale.tsx) | [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | Invokes supplied callback: onPress | react |
| [components/pressable-scale.tsx](../../../../../../components/pressable-scale.tsx) | [components/vote-draft-panel.tsx](../../../../../../components/vote-draft-panel.tsx) | Invokes supplied callback: onPress | react |
| [components/select-dropdown.tsx](../../../../../../components/select-dropdown.tsx) | [app/userInput.tsx](../../../../../../app/userInput.tsx) | Invokes supplied callback: onSelect | react |
| [components/select-dropdown.tsx](../../../../../../components/select-dropdown.tsx) | [app/voting.tsx](../../../../../../app/voting.tsx) | Invokes supplied callback: onOpenChange | react |
