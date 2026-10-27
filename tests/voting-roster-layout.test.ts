import {
  INITIAL_ROSTER_LAYOUT,
  nextRosterLayoutMode,
} from '@/utils/votingRosterLayout';

describe('nextRosterLayoutMode', () => {
  it('keeps one column when content fits', () => {
    expect(nextRosterLayoutMode(INITIAL_ROSTER_LAYOUT, 120, 220)).toEqual({
      columns: 1,
      scrollEnabled: false,
    });
  });

  it('widens to two columns before enabling scroll', () => {
    expect(nextRosterLayoutMode(INITIAL_ROSTER_LAYOUT, 300, 220)).toEqual({
      columns: 2,
      scrollEnabled: false,
    });
  });

  it('enables scroll only after two-column layout still overflows', () => {
    expect(
      nextRosterLayoutMode({ columns: 2, scrollEnabled: false }, 300, 220)
    ).toEqual({
      columns: 2,
      scrollEnabled: true,
    });
  });

  it('stays on scroll once enabled', () => {
    expect(
      nextRosterLayoutMode({ columns: 2, scrollEnabled: true }, 400, 220)
    ).toEqual({
      columns: 2,
      scrollEnabled: true,
    });
  });
});
