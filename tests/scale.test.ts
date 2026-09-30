import { getScaleFactor, isCompactHeight, moderateScale, scale } from '@/utils/scale';

describe('scale utilities', () => {
  it('keeps design size on the reference screen', () => {
    expect(getScaleFactor(390, 844)).toBe(1);
    expect(scale(24, 390, 844)).toBe(24);
    expect(isCompactHeight(844)).toBe(false);
  });

  it('shrinks on short phones without growing past design', () => {
    const factor = getScaleFactor(320, 568);
    expect(factor).toBeLessThan(1);
    expect(scale(100, 320, 568)).toBeLessThan(100);
    expect(getScaleFactor(430, 932)).toBe(1);
    expect(isCompactHeight(640)).toBe(true);
  });

  it('applies a softer moderate scale', () => {
    const full = scale(40, 320, 568);
    const soft = moderateScale(40, 0.5, 320, 568);
    expect(soft).toBeGreaterThan(full);
    expect(soft).toBeLessThan(40);
  });
});
