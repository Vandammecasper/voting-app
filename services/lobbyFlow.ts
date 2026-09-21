export function isResultsStatus(status?: string | null): boolean {
  return status === 'results';
}

/** Host has published the ranking; everyone may view it. */
export function isPublishedRankingStatus(status?: string | null): boolean {
  return status === 'ranking' || status === 'completed';
}
