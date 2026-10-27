export type RosterLayoutMode = {
  columns: 1 | 2;
  scrollEnabled: boolean;
};

export const INITIAL_ROSTER_LAYOUT: RosterLayoutMode = {
  columns: 1,
  scrollEnabled: false,
};

/**
 * Progress layout when measured content height exceeds maxHeight:
 * 1 column → 2 columns → enable scrolling.
 */
export function nextRosterLayoutMode(
  current: RosterLayoutMode,
  contentHeight: number,
  maxHeight: number
): RosterLayoutMode {
  if (contentHeight <= maxHeight) {
    return current;
  }

  if (current.columns === 1) {
    return { columns: 2, scrollEnabled: false };
  }

  if (!current.scrollEnabled) {
    return { columns: 2, scrollEnabled: true };
  }

  return current;
}
