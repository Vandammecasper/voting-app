import { firstSearchParam } from '@/services/routeParams';

describe('firstSearchParam', () => {
  it('returns a plain string', () => {
    expect(firstSearchParam('lobby-1')).toBe('lobby-1');
  });

  it('uses the first non-empty value when Expo repeats the param', () => {
    expect(firstSearchParam(['lobby-1', 'lobby-1'])).toBe('lobby-1');
  });

  it('ignores empty values', () => {
    expect(firstSearchParam(['', 'lobby-1'])).toBe('lobby-1');
    expect(firstSearchParam('')).toBeUndefined();
    expect(firstSearchParam(undefined)).toBeUndefined();
  });
});
