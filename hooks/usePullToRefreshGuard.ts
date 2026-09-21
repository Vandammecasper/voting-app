import { useCallback, useMemo, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const SUPPRESS_MS = 800;

export function shouldIgnorePullToRefreshPress(suppressUntil: number, now = Date.now()) {
  return now < suppressUntil;
}

/**
 * Pull-to-refresh on iOS can fire the row's onPress when the finger lifts.
 * Suppress presses for the duration of a downward overscroll / refresh.
 */
export function usePullToRefreshGuard() {
  const suppressUntil = useRef(0);

  const suppressPresses = useCallback((ms = SUPPRESS_MS) => {
    suppressUntil.current = Date.now() + ms;
  }, []);

  const shouldIgnorePress = useCallback(
    () => shouldIgnorePullToRefreshPress(suppressUntil.current),
    []
  );

  const onScrollBeginDrag = useCallback(() => {
    suppressPresses();
  }, [suppressPresses]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (event.nativeEvent.contentOffset.y < 0) {
        suppressPresses();
      }
    },
    [suppressPresses]
  );

  return useMemo(
    () => ({
      shouldIgnorePress,
      suppressPresses,
      scrollProps: {
        onScrollBeginDrag,
        onScroll,
        scrollEventThrottle: 16,
      },
    }),
    [onScroll, onScrollBeginDrag, shouldIgnorePress, suppressPresses]
  );
}

