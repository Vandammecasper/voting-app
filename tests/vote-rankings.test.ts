import { calculateRankings, normalizeRankingList, rankingsFromLobbyOrVotes } from '@/services/voteRankings';
import { generateLobbyCode, LOBBY_CODE_ALPHABET, LOBBY_CODE_LENGTH } from '@/services/lobbyCode';

describe('generateLobbyCode', () => {
  it('returns 8 characters from the unambiguous alphabet', () => {
    const code = generateLobbyCode();
    expect(code).toHaveLength(LOBBY_CODE_LENGTH);
    expect([...code].every((char) => LOBBY_CODE_ALPHABET.includes(char))).toBe(true);
  });

  it('does not use a sequential 6-digit numeric format', () => {
    const code = generateLobbyCode();
    expect(code).not.toMatch(/^\d{6}$/);
  });
});

describe('calculateRankings', () => {
  it('counts MVP and loser names', () => {
    const rankings = calculateRankings({
      a: { mvpName: 'Pat', loserName: 'Oak' },
      b: { mvpName: 'Pat', loserName: 'Pat' },
      c: { mvpName: 'Oak' },
    });
    expect(rankings.mvpRanking[0]).toEqual({ name: 'Pat', votes: 2 });
    expect(rankings.loserRanking).toEqual(
      expect.arrayContaining([
        { name: 'Oak', votes: 1 },
        { name: 'Pat', votes: 1 },
      ])
    );
  });
});

describe('normalizeRankingList', () => {
  it('accepts arrays and object maps', () => {
    expect(normalizeRankingList([{ name: 'Pat', votes: 2 }])).toEqual([{ name: 'Pat', votes: 2 }]);
    expect(normalizeRankingList({ 0: { name: 'Oak', votes: 1 } })).toEqual([{ name: 'Oak', votes: 1 }]);
  });
});

describe('rankingsFromLobbyOrVotes', () => {
  it('prefers published lobby rankings', () => {
    const rankings = rankingsFromLobbyOrVotes(
      { mvpRanking: [{ name: 'Host', votes: 3 }] },
      { a: { mvpName: 'Pat' } }
    );
    expect(rankings.mvpRanking).toEqual([{ name: 'Host', votes: 3 }]);
  });

  it('falls back to tallying votes when rankings were never published', () => {
    const rankings = rankingsFromLobbyOrVotes(null, {
      a: { mvpName: 'Pat', loserName: 'Oak' },
      b: { mvpName: 'Pat' },
    });
    expect(rankings.mvpRanking[0]).toEqual({ name: 'Pat', votes: 2 });
    expect(rankings.loserRanking[0]).toEqual({ name: 'Oak', votes: 1 });
  });
});
