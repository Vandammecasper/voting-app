---
type: C4 Component
title: Version gate
status: stable
groma:
  id: version-gate
  parent: mobile-app
  code:
    - scanner: typescript
      file: services/versionCheck.ts
    - scanner: typescript
      file: hooks/useVersionCheck.ts
      symbol: useVersionCheck
  group: Session entry
  technology: Expo Linking
description: Force-update check against remote app config.
---

Reads minimum version requirements from Realtime Database appConfig and prompts the user to open the App Store or Play Store when the installed build is too old.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [version-gate](version-gate.md) | [firebase-realtime-database](../../../../../externals/firebase-realtime-database.md) | Reads force-update config | HTTPS REST |
| [services/versionCheck.ts](../../../../../../services/versionCheck.ts) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | Fetches appConfig | REST |
| [version-gate](version-gate.md) | [app-store](../../../../../externals/app-store.md) | Opens update listing | Expo Linking |
| [version-gate](version-gate.md) | [play-store](../../../../../externals/play-store.md) | Opens update listing | Expo Linking |
