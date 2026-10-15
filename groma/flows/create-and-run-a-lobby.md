---
type: Groma Flow
title: Create and run a lobby
groma:
  id: create-and-run-a-lobby
---

A host opens a lobby from Home, waits for voters in the waiting room, starts voting, then uses the voting-session screens to reveal results and publish the ranking.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Host](../actors/host.md) | [App shell](../systems/voting-app/containers/mobile-app/components/app-shell.md) | Start create flow from Home |
| [App shell](../systems/voting-app/containers/mobile-app/components/app-shell.md) | [Lobby](../systems/voting-app/containers/mobile-app/components/lobby.md) | Open create/join screen |
| [Lobby](../systems/voting-app/containers/mobile-app/components/lobby.md) | [Firebase data](../systems/voting-app/containers/mobile-app/components/firebase-data.md) | Allocate lobby and claim host seat |
| [Lobby](../systems/voting-app/containers/mobile-app/components/lobby.md) | [Voting session](../systems/voting-app/containers/mobile-app/components/voting-session.md) | Start voting when ready |
| [Voting session](../systems/voting-app/containers/mobile-app/components/voting-session.md) | [Firebase data](../systems/voting-app/containers/mobile-app/components/firebase-data.md) | Persist votes and lobby status |
