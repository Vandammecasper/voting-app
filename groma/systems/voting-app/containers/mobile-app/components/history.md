---
type: C4 Component
title: History
status: stable
groma:
  id: history
  parent: mobile-app
  code:
    - scanner: react
      file: app/(tabs)/history.tsx
    - scanner: typescript
      file: app/(tabs)/history.tsx
      symbol: HistoryScreen
  group: Vote lifecycle
  technology: Expo Router
description: Reopens past lobbies from the user's history.
---

Lists lobbies recorded under the anonymous user's history and routes back into the matching live or completed screen: waiting room, vote-waiting, results, or ranking.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [app/(tabs)/history.tsx](../../../../../../app/(tabs)/history.tsx) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | Loads past lobbies | REST |
| [app/(tabs)/history.tsx](../../../../../../app/(tabs)/history.tsx) | [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | Reopens live lobby | Expo Router |
| [app/(tabs)/history.tsx](../../../../../../app/(tabs)/history.tsx) | [app/ranking.tsx](../../../../../../app/ranking.tsx) | Reopens completed ranking | Expo Router |
| [app/(tabs)/history.tsx](../../../../../../app/(tabs)/history.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Scopes past lobbies | React context |
| [app/(tabs)/history.tsx](../../../../../../app/(tabs)/history.tsx) | [app/votingWaiting.tsx](../../../../../../app/votingWaiting.tsx) | Reopens vote waiting | Expo Router |
| [app/(tabs)/history.tsx](../../../../../../app/(tabs)/history.tsx) | [app/results.tsx](../../../../../../app/results.tsx) | Reopens results reveal | Expo Router |
| [app/(tabs)/history.tsx](../../../../../../app/(tabs)/history.tsx) | [services/teams.ts](../../../../../../services/teams.ts) | Detects team lobbies | Service |
