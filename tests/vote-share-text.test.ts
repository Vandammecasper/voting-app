import { formatVotesShareText } from '@/services/voteShareText';

describe('formatVotesShareText', () => {
  it('formats MVP-only votes', () => {
    expect(
      formatVotesShareText([{ mvpName: 'Alice', mvpComment: 'Clutch finish' }])
    ).toBe('MVP: ALICE\nClutch finish');
  });

  it('formats MVP and loser votes with separators', () => {
    expect(
      formatVotesShareText([
        {
          mvpName: 'Alice',
          mvpComment: 'Clutch finish',
          loserName: 'Bob',
          loserComment: 'Forgot the snacks',
        },
        { mvpName: 'Pat', mvpComment: 'Best call' },
      ])
    ).toBe(
      [
        'MVP: ALICE',
        'Clutch finish',
        '',
        'Loser: BOB',
        'Forgot the snacks',
        '',
        '---',
        '',
        'MVP: PAT',
        'Best call',
      ].join('\n')
    );
  });
});
