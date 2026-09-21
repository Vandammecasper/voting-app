import { mvpVoteOptions } from '@/services/voteOptions';

describe('mvpVoteOptions', () => {
  it('removes the voter from MVP choices', () => {
    expect(mvpVoteOptions(['Pat', 'Oak', 'Quinn'], 'Oak')).toEqual(['Pat', 'Quinn']);
  });

  it('keeps the full list when the voter name is unknown', () => {
    expect(mvpVoteOptions(['Pat', 'Oak'])).toEqual(['Pat', 'Oak']);
  });
});
