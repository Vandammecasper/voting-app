export type RosterLayoutMode = {
  columns: 1 | 2;
  scrollEnabled: boolean;
};

export const INITIAL_ROSTER_LAYOUT: RosterLayoutMode = {
  columns: 1,
  scrollEnabled: false,
};

/** Floor so the overlay stays usable on very short phones. */
export const ROSTER_PANEL_MIN_HEIGHT = 120;
/** Floor so a one-column name still fits on ~320dp widths. */
export const ROSTER_PANEL_MIN_WIDTH = 140;

export type RosterPanelLimits = {
  maxHeight: number;
  maxWidth: number;
};

/**
 * Cap overlay size to the viewport so small phones keep the panel on-screen
 * and scrollable instead of overflowing under the vote count / title.
 */
export function getRosterPanelLimits(
  windowWidth: number,
  windowHeight: number,
  preferredMaxHeight: number,
  preferredMaxWidth: number,
  horizontalInset: number
): RosterPanelLimits {
  const availableWidth = Math.max(0, windowWidth - horizontalInset);
  const heightCap = Math.round(windowHeight * 0.4);

  return {
    maxHeight: Math.max(
      ROSTER_PANEL_MIN_HEIGHT,
      Math.min(preferredMaxHeight, heightCap)
    ),
    maxWidth: Math.max(
      Math.min(ROSTER_PANEL_MIN_WIDTH, availableWidth),
      Math.min(preferredMaxWidth, availableWidth)
    ), // prefers preferredMaxWidth, never exceeds availableWidth
  };
}

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
