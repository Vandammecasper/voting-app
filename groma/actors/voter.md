---
type: C4 Actor
title: Voter
description: Joins a lobby and casts a ranked vote.
status: stable
groma:
  id: voter
---

Role in a lobby the user joined by code or team name, without being that lobby's creator. Needs to wait for the host, draft and submit an MVP (and optional loser) vote, wait for others, then view the published ranking and review votes. Uses the same anonymous Firebase identity that may have hosted a different lobby earlier.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [voter](voter.md) | [voting-app](../systems/voting-app/system.md) | Joins and votes | Mobile UI |
| [voter](voter.md) | [app/userInput.tsx](../../app/userInput.tsx) | Enters join details | Mobile UI |
