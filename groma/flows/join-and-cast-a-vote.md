---
type: Groma Flow
title: Join and cast a vote
groma:
  id: join-and-cast-a-vote
---

A voter joins by code, waits in the lobby, submits an MVP vote, and follows the session through waiting and results.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Voter](../actors/voter.md) | [Lobby](../systems/voting-app/containers/mobile-app/components/lobby.md) | Enter join details |
| [Lobby](../systems/voting-app/containers/mobile-app/components/lobby.md) | [Firebase data](../systems/voting-app/containers/mobile-app/components/firebase-data.md) | Claim a seat in the lobby |
| [Lobby](../systems/voting-app/containers/mobile-app/components/lobby.md) | [Voting session](../systems/voting-app/containers/mobile-app/components/voting-session.md) | Enter voting when the host opens it |
| [Voting session](../systems/voting-app/containers/mobile-app/components/voting-session.md) | [Firebase data](../systems/voting-app/containers/mobile-app/components/firebase-data.md) | Submit the ranked vote |
