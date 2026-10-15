---
type: C4 Component
title: Firebase data
status: stable
groma:
  id: firebase-data
  parent: mobile-app
  code:
    - scanner: typescript
      file: services/firebaseRest.ts
    - scanner: typescript
      file: services/database.ts
    - scanner: typescript
      file: services/firebaseDatabaseUrl.ts
      symbol: getFirebaseDatabaseUrl
    - scanner: typescript
      file: hooks/usePolledRestData.ts
      symbol: usePolledRestData
    - scanner: typescript
      file: hooks/useDatabase.ts
    - scanner: typescript
      file: services/randomBytes.ts
      symbol: fillRandomBytes
  group: Platform services
  technology: Firebase REST, React Native Firebase Database
description: Authenticated RTDB access, polling, and IDs.
---

Builds the database URL, performs authenticated REST reads and writes with tokens from Auth, polls paths for live screens, and falls back to the native Database SDK where create/join still uses it. Also supplies cryptographically random bytes for lobby codes and push IDs.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [firebase-data](firebase-data.md) | [firebase-realtime-database](../../../../../externals/firebase-realtime-database.md) | Reads and writes lobby data | HTTPS REST |
| [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | [services/firebaseAuth.ts](../../../../../../services/firebaseAuth.ts) | Attaches ID tokens | Firebase Auth |
