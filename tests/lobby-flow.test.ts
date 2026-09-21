import { isPublishedRankingStatus, isResultsStatus } from '@/services/lobbyFlow';

describe('lobby flow status', () => {
  it('treats ranking and completed as the published ranking everyone can open', () => {
    expect(isPublishedRankingStatus('ranking')).toBe(true);
    expect(isPublishedRankingStatus('completed')).toBe(true);
    expect(isPublishedRankingStatus('results')).toBe(false);
    expect(isPublishedRankingStatus('voting')).toBe(false);
  });

  it('treats results as the host read-aloud step', () => {
    expect(isResultsStatus('results')).toBe(true);
    expect(isResultsStatus('ranking')).toBe(false);
  });
});
