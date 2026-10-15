---
type: C4 Actor
title: Host
description: Creates and runs a vote lobby.
status: stable
groma:
  id: host
---

Role in a lobby whose creatorId matches the signed-in anonymous Firebase user. Needs to share a join code, manage the waiting room, start voting, reveal results, and publish the ranking. The same device identity can be Host in one lobby and Voter in another on a later day.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [host](host.md) | [voting-app](../systems/voting-app/system.md) | Runs vote lobbies | Mobile UI |
| [host](host.md) | [app/(tabs)/index.tsx](../../app/(tabs)/index.tsx) | Starts create flow | Mobile UI |
