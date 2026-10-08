export interface ShareableVote {
  mvpName: string;
  mvpComment: string;
  loserName?: string;
  loserComment?: string;
}

function formatSingleVote(vote: ShareableVote): string {
  const lines = [`MVP: ${vote.mvpName.toUpperCase()}`, vote.mvpComment];

  if (vote.loserName && vote.loserComment) {
    lines.push('', `Loser: ${vote.loserName.toUpperCase()}`, vote.loserComment);
  }

  return lines.join('\n');
}

/** Format selected votes as plain text for the system share sheet. */
export function formatVotesShareText(votes: ShareableVote[]): string {
  return votes.map(formatSingleVote).join('\n\n---\n\n');
}
