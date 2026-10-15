---
type: C4 Component
title: Onboarding
status: stable
groma:
  id: onboarding
  parent: mobile-app
  code:
    - scanner: react
      file: contexts/OnboardingContext.tsx
    - scanner: typescript
      file: contexts/OnboardingContext.tsx
    - scanner: typescript
      file: services/onboardingStorage.ts
    - scanner: react
      file: app/onboarding/index.tsx
    - scanner: typescript
      file: app/onboarding/index.tsx
      symbol: WelcomeScreen
    - scanner: react
      file: app/onboarding/step2.tsx
    - scanner: typescript
      file: app/onboarding/step2.tsx
      symbol: OnboardingStep2
    - scanner: react
      file: app/onboarding/_layout.tsx
    - scanner: typescript
      file: app/onboarding/_layout.tsx
      symbol: OnboardingLayout
  group: Session entry
  technology: AsyncStorage, Expo Router
description: First-run welcome flow stored on device.
---

Shows the welcome screens until the user finishes step two, then persists an onboarded flag in AsyncStorage so the app shell unlocks the main tabs.
