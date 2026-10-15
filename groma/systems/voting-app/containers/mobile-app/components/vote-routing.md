---
type: C4 Component
title: Vote routing
status: stable
groma:
  id: vote-routing
  parent: mobile-app
  code:
    - scanner: typescript
      file: services/routeParams.ts
      symbol: firstSearchParam
    - scanner: typescript
      file: hooks/useVoteRouteParams.ts
      symbol: useVoteRouteParams
  group: Vote lifecycle
  technology: Expo Router
description: Parses voteId and from params across flow screens.
---

Shared helpers and hooks that normalize route parameters so lobby and voting screens agree on which vote is open and where the user came from.
