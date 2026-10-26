export interface RosterParticipant {
  name: string;
  joinedAt: number;
}

export type RosterParticipants = Record<string, RosterParticipant>;
export type VoteReceipts = Record<string, boolean>;

export interface NamedRosterMember {
  id: string;
  name: string;
  joinedAt: number;
}

function toSortedMembers(participants: RosterParticipants | null | undefined): NamedRosterMember[] {
  if (!participants) {
    return [];
  }

  return Object.entries(participants)
    .map(([id, participant]) => ({
      id,
      name: participant.name,
      joinedAt: participant.joinedAt,
    }))
    .sort((a, b) => a.joinedAt - b.joinedAt || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

/** Split lobby participants into still-voting vs already-voted, ordered by join time. */
export function partitionVotingRoster(
  participants: RosterParticipants | null | undefined,
  receipts: VoteReceipts | null | undefined
): { stillVoting: NamedRosterMember[]; alreadyVoted: NamedRosterMember[] } {
  const stillVoting: NamedRosterMember[] = [];
  const alreadyVoted: NamedRosterMember[] = [];

  for (const member of toSortedMembers(participants)) {
    if (receipts?.[member.id]) {
      alreadyVoted.push(member);
    } else {
      stillVoting.push(member);
    }
  }

  return { stillVoting, alreadyVoted };
}

/** Status-line copy for people who have not submitted a vote yet. */
export function formatStillVotingMention(stillVotingNames: string[]): string {
  const count = stillVotingNames.length;

  if (count === 0) {
    return '';
  }

  if (count === 1) {
    return `${stillVotingNames[0]} is still voting`;
  }

  if (count === 2) {
    return `${stillVotingNames[0]} and ${stillVotingNames[1]} are still voting`;
  }

  return `${stillVotingNames[0]} and ${count - 1} others are still voting`;
}
