---
type: C4 Component
title: Auth
status: stable
groma:
  id: auth
  parent: mobile-app
  code:
    - scanner: react
      file: contexts/AuthContext.tsx
    - scanner: typescript
      file: contexts/AuthContext.tsx
    - scanner: typescript
      file: services/firebaseAuth.ts
  group: Session entry
  technology: React Native Firebase Auth
description: Anonymous Firebase session for the whole app.
---

Signs the user in anonymously on launch and exposes the current user plus ID tokens to screens and data clients. Every lobby and history write is attributed to this identity.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [auth](auth.md) | [firebase-authentication](../../../../../externals/firebase-authentication.md) | Signs in anonymously | React Native Firebase Auth |
