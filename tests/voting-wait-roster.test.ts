import {
  formatStillVotingMention,
  partitionVotingRoster,
} from '@/utils/votingWaitRoster';

describe('formatStillVotingMention', () => {
  it('returns empty string when nobody is still voting', () => {
    expect(formatStillVotingMention([])).toBe('');
  });

  it('names a single remaining voter', () => {
    expect(formatStillVotingMention(['Ada'])).toBe('Ada is still voting');
  });

  it('names both remaining voters when there are two', () => {
    expect(formatStillVotingMention(['Ada', 'Bea'])).toBe('Ada and Bea are still voting');
  });

  it('names the first voter and counts others when there are three or more', () => {
    expect(formatStillVotingMention(['Ada', 'Bea', 'Cal'])).toBe('Ada and 2 others are still voting');
    expect(formatStillVotingMention(['Ada', 'Bea', 'Cal', 'Dee'])).toBe(
      'Ada and 3 others are still voting'
    );
  });
});

describe('partitionVotingRoster', () => {
  it('orders members by joinedAt and splits on receipts', () => {
    const { stillVoting, alreadyVoted } = partitionVotingRoster(
      {
        b: { name: 'Bea', joinedAt: 20 },
        a: { name: 'Ada', joinedAt: 10 },
        c: { name: 'Cal', joinedAt: 30 },
      },
      { a: true }
    );

    expect(stillVoting.map((m) => m.name)).toEqual(['Bea', 'Cal']);
    expect(alreadyVoted.map((m) => m.name)).toEqual(['Ada']);
  });

  it('treats missing receipt data as still voting', () => {
    const { stillVoting, alreadyVoted } = partitionVotingRoster(
      { a: { name: 'Ada', joinedAt: 1 } },
      null
    );

    expect(stillVoting.map((m) => m.name)).toEqual(['Ada']);
    expect(alreadyVoted).toEqual([]);
  });
});
