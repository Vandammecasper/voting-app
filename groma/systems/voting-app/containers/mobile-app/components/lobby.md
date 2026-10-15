---
type: C4 Component
title: Lobby
status: stable
groma:
  id: lobby
  parent: mobile-app
  code:
    - scanner: react
      file: app/waitingRoom.tsx
    - scanner: typescript
      file: app/waitingRoom.tsx
      symbol: WaitingRoomScreen
    - scanner: react
      file: app/userInput.tsx
    - scanner: typescript
      file: app/userInput.tsx
      symbol: UserInputScreen
    - scanner: typescript
      file: services/lobbyCode.ts
    - scanner: typescript
      file: services/lobbyFlow.ts
    - scanner: typescript
      file: services/lobbyStatus.ts
    - scanner: react
      file: components/vote-draft-panel.tsx
    - scanner: typescript
      file: components/vote-draft-panel.tsx
      symbol: VoteDraftPanel
    - scanner: typescript
      file: services/voteDraftStorage.ts
  group: Vote lifecycle
  technology: Expo Router
description: Create or join a lobby and manage the waiting room.
---

Allocates lobby codes, claims participant names, tracks lobby status transitions, and hosts the waiting-room UI including pre-vote drafts stored on device. Hosts can remove participants or request name changes before opening voting. Uses Auth for identity, Firebase data for lobby writes and polling, Settings team helpers for roster/name claims, and Voting session option helpers when drafting.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [app/userInput.tsx](../../../../../../app/userInput.tsx) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | Creates or joins lobby | REST |
| [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | [hooks/usePolledRestData.ts](../../../../../../hooks/usePolledRestData.ts) | Polls lobby state | REST polling |
| [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | [app/voting.tsx](../../../../../../app/voting.tsx) | Opens voting | Expo Router |
| [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | [hooks/useVoteRouteParams.ts](../../../../../../hooks/useVoteRouteParams.ts) | Reads vote route params | Hook |
| [app/userInput.tsx](../../../../../../app/userInput.tsx) | [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | Enters waiting room | Expo Router |
| [app/userInput.tsx](../../../../../../app/userInput.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Attributes create or join | React context |
| [app/userInput.tsx](../../../../../../app/userInput.tsx) | [services/teams.ts](../../../../../../services/teams.ts) | Loads saved teams | Service |
| [app/userInput.tsx](../../../../../../app/userInput.tsx) | [services/database.ts](../../../../../../services/database.ts) | Creates lobby via SDK | React Native Firebase |
| [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Identifies host and voters | React context |
| [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | Mutates lobby state | REST |
| [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | [services/teams.ts](../../../../../../services/teams.ts) | Enforces team name claims | Service |
| [app/waitingRoom.tsx](../../../../../../app/waitingRoom.tsx) | [services/voteOptions.ts](../../../../../../services/voteOptions.ts) | Builds draft vote options | Service |
| [services/lobbyStatus.ts](../../../../../../services/lobbyStatus.ts) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | Patches lobby status | REST |
