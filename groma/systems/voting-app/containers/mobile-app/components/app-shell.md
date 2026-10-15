---
type: C4 Component
title: App shell
status: stable
groma:
  id: app-shell
  parent: mobile-app
  code:
    - scanner: react
      file: app/_layout.tsx
    - scanner: typescript
      file: app/_layout.tsx
    - scanner: react
      file: app/index.tsx
    - scanner: typescript
      file: app/index.tsx
      symbol: Index
    - scanner: react
      file: app/(tabs)/_layout.tsx
    - scanner: typescript
      file: app/(tabs)/_layout.tsx
      symbol: TabLayout
    - scanner: react
      file: app/(tabs)/index.tsx
    - scanner: typescript
      file: app/(tabs)/index.tsx
      symbol: HomeScreen
    - scanner: typescript
      file: constants/systemBars.ts
    - scanner: typescript
      file: constants/tabBar.ts
    - scanner: javascript
      file: app.plugin.js
      symbol: generateUuid
  group: Session entry
  technology: Expo Router
description: Root providers, route stacks, and tab chrome.
---

Wires Auth and Onboarding providers, chooses onboarding versus tabs versus vote-flow stacks, and applies system bar and tab bar presentation. Owns the Expo config plugin for native build tweaks and the home entry that redirects after onboarding.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [app/_layout.tsx](../../../../../../app/_layout.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Provides anonymous session | React context |
| [app/_layout.tsx](../../../../../../app/_layout.tsx) | [contexts/OnboardingContext.tsx](../../../../../../contexts/OnboardingContext.tsx) | Gates first-run flow | React context |
| [app/_layout.tsx](../../../../../../app/_layout.tsx) | [hooks/useVersionCheck.ts](../../../../../../hooks/useVersionCheck.ts) | Checks minimum version | Hook |
| [app/(tabs)/index.tsx](../../../../../../app/(tabs)/index.tsx) | [app/userInput.tsx](../../../../../../app/userInput.tsx) | Opens create or join | Expo Router |
