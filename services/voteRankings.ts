export interface RankingEntry {
  name: string;
  votes: number;
}

export interface VoteTallyInput {
  mvpName: string;
  loserName?: string;
}

export function calculateRankings(
  votes: Record<string, VoteTallyInput> | null | undefined
): {
  mvpRanking: RankingEntry[];
  loserRanking: RankingEntry[];
} {
  const mvpCounts: Record<string, number> = {};
  const loserCounts: Record<string, number> = {};

  Object.values(votes ?? {}).forEach((vote) => {
    if (vote?.mvpName) {
      mvpCounts[vote.mvpName] = (mvpCounts[vote.mvpName] || 0) + 1;
    }
    if (vote?.loserName) {
      loserCounts[vote.loserName] = (loserCounts[vote.loserName] || 0) + 1;
    }
  });

  const toRanking = (counts: Record<string, number>): RankingEntry[] =>
    Object.entries(counts)
      .map(([name, voteCount]) => ({ name, votes: voteCount }))
      .sort((a, b) => b.votes - a.votes);

  return {
    mvpRanking: toRanking(mvpCounts),
    loserRanking: toRanking(loserCounts),
  };
}

export function rankingsFromLobbyOrVotes(
  lobby: { mvpRanking?: unknown; loserRanking?: unknown } | null | undefined,
  votes: Record<string, VoteTallyInput> | null | undefined
): {
  mvpRanking: RankingEntry[];
  loserRanking: RankingEntry[];
} {
  const publishedMvp = normalizeRankingList(lobby?.mvpRanking);
  const publishedLoser = normalizeRankingList(lobby?.loserRanking);
  if (publishedMvp.length > 0 || publishedLoser.length > 0) {
    return {
      mvpRanking: publishedMvp,
      loserRanking: publishedLoser,
    };
  }
  return calculateRankings(votes);
}

export function normalizeRankingList(value: unknown): RankingEntry[] {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.values(value)
      : [];

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      const entry = row as Partial<RankingEntry>;
      if (typeof entry.name !== 'string' || typeof entry.votes !== 'number') {
        return null;
      }
      return { name: entry.name, votes: entry.votes };
    })
    .filter((entry): entry is RankingEntry => entry != null);
}
