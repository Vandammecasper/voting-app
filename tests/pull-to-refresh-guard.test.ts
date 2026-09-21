import { shouldIgnorePullToRefreshPress } from '@/hooks/usePullToRefreshGuard';

describe('pull-to-refresh press guard', () => {
  it('ignores presses while a suppression window is active', () => {
    const now = 1_000;
    expect(shouldIgnorePullToRefreshPress(now + 100, now)).toBe(true);
    expect(shouldIgnorePullToRefreshPress(now - 1, now)).toBe(false);
  });
});
