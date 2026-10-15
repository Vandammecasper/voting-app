---
type: C4 Component
title: Voting session
status: stable
groma:
  id: voting-session
  parent: mobile-app
  code:
    - scanner: react
      file: app/voting.tsx
    - scanner: typescript
      file: app/voting.tsx
      symbol: VotingScreen
    - scanner: react
      file: app/votingWaiting.tsx
    - scanner: typescript
      file: app/votingWaiting.tsx
      symbol: VotingWaitingScreen
    - scanner: react
      file: app/results.tsx
    - scanner: typescript
      file: app/results.tsx
      symbol: ResultsScreen
    - scanner: react
      file: app/ranking.tsx
    - scanner: typescript
      file: app/ranking.tsx
      symbol: RankingScreen
    - scanner: react
      file: app/reviewVotes.tsx
    - scanner: typescript
      file: app/reviewVotes.tsx
      symbol: ReviewVotesScreen
    - scanner: typescript
      file: services/voteOptions.ts
      symbol: mvpVoteOptions
    - scanner: typescript
      file: services/voteRankings.ts
    - scanner: typescript
      file: services/voteShareText.ts
  group: Vote lifecycle
  technology: Expo Router
description: Cast votes, reveal results, and share rankings.
---

Covers voting, waiting for others, host-controlled results reveal, published ranking, and vote review. Includes helpers for vote options, ranking math, and share text. Applies lobby drafts, polls Firebase data while the session is live, and persists status changes through Lobby status helpers.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [app/voting.tsx](../../../../../../app/voting.tsx) | [services/firebaseRest.ts](../../../../../../services/firebaseRest.ts) | Submits votes | REST |
| [app/voting.tsx](../../../../../../app/voting.tsx) | [app/votingWaiting.tsx](../../../../../../app/votingWaiting.tsx) | Waits for others | Expo Router |
| [app/votingWaiting.tsx](../../../../../../app/votingWaiting.tsx) | [app/results.tsx](../../../../../../app/results.tsx) | Opens results reveal | Expo Router |
| [app/results.tsx](../../../../../../app/results.tsx) | [app/ranking.tsx](../../../../../../app/ranking.tsx) | Publishes ranking | Expo Router |
| [app/voting.tsx](../../../../../../app/voting.tsx) | [hooks/useVoteRouteParams.ts](../../../../../../hooks/useVoteRouteParams.ts) | Reads vote route params | Hook |
| [app/ranking.tsx](../../../../../../app/ranking.tsx) | [app/reviewVotes.tsx](../../../../../../app/reviewVotes.tsx) | Opens vote review | Expo Router |
| [app/voting.tsx](../../../../../../app/voting.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Attributes submitted votes | React context |
| [app/voting.tsx](../../../../../../app/voting.tsx) | [hooks/usePolledRestData.ts](../../../../../../hooks/usePolledRestData.ts) | Polls lobby while voting | REST polling |
| [app/voting.tsx](../../../../../../app/voting.tsx) | [services/teams.ts](../../../../../../services/teams.ts) | Normalizes team members | Service |
| [app/voting.tsx](../../../../../../app/voting.tsx) | [services/voteDraftStorage.ts](../../../../../../services/voteDraftStorage.ts) | Applies waiting-room draft | AsyncStorage |
| [app/votingWaiting.tsx](../../../../../../app/votingWaiting.tsx) | [services/lobbyStatus.ts](../../../../../../services/lobbyStatus.ts) | Opens results as host | REST |
| [app/votingWaiting.tsx](../../../../../../app/votingWaiting.tsx) | [hooks/usePolledRestData.ts](../../../../../../hooks/usePolledRestData.ts) | Polls vote progress | REST polling |
| [app/votingWaiting.tsx](../../../../../../app/votingWaiting.tsx) | [app/ranking.tsx](../../../../../../app/ranking.tsx) | Skips to published ranking | Expo Router |
| [app/results.tsx](../../../../../../app/results.tsx) | [services/lobbyStatus.ts](../../../../../../services/lobbyStatus.ts) | Publishes ranking | REST |
| [app/results.tsx](../../../../../../app/results.tsx) | [hooks/usePolledRestData.ts](../../../../../../hooks/usePolledRestData.ts) | Polls lobby status | REST polling |
| [app/results.tsx](../../../../../../app/results.tsx) | [contexts/AuthContext.tsx](../../../../../../contexts/AuthContext.tsx) | Confirms host actions | React context |
| [app/ranking.tsx](../../../../../../app/ranking.tsx) | [hooks/usePolledRestData.ts](../../../../../../hooks/usePolledRestData.ts) | Polls published ranking | REST polling |
| [app/ranking.tsx](../../../../../../app/ranking.tsx) | [hooks/useVoteRouteParams.ts](../../../../../../hooks/useVoteRouteParams.ts) | Reads vote route params | Hook |
| [app/reviewVotes.tsx](../../../../../../app/reviewVotes.tsx) | [hooks/usePolledRestData.ts](../../../../../../hooks/usePolledRestData.ts) | Loads submitted votes | REST polling |
