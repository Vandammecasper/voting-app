import {
  getRosterPanelLimits,
  INITIAL_ROSTER_LAYOUT,
  nextRosterLayoutMode,
  ROSTER_PANEL_MIN_HEIGHT,
  ROSTER_PANEL_MIN_WIDTH,
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

describe('getRosterPanelLimits', () => {
  it('caps height and width on a small phone viewport', () => {
    const limits = getRosterPanelLimits(320, 568, 220, 260, 48);
    expect(limits.maxHeight).toBeLessThanOrEqual(Math.round(568 * 0.4));
    expect(limits.maxHeight).toBeGreaterThanOrEqual(ROSTER_PANEL_MIN_HEIGHT);
    expect(limits.maxWidth).toBeLessThanOrEqual(320 - 48);
    expect(limits.maxWidth).toBeLessThanOrEqual(260);
    expect(limits.maxWidth).toBeGreaterThanOrEqual(
      Math.min(ROSTER_PANEL_MIN_WIDTH, 320 - 48)
    );
  });

  it('keeps preferred sizes on a design-size phone when they fit', () => {
    expect(getRosterPanelLimits(390, 844, 220, 260, 48)).toEqual({
      maxHeight: 220,
      maxWidth: 260,
    });
  });
});
