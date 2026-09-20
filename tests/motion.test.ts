import { clamp, project, rubberband } from '@/constants/motion';

describe('Apple motion helpers', () => {
  it('projects a flick further than a slow drag', () => {
    expect(project(1200)).toBeGreaterThan(project(200));
    expect(project(0)).toBe(0);
  });

  it('rubber-bands less than the raw overshoot', () => {
    const overshoot = 80;
    const resisted = rubberband(overshoot, 320);
    expect(resisted).toBeGreaterThan(0);
    expect(resisted).toBeLessThan(overshoot);
  });

  it('clamps to the inclusive range', () => {
    expect(clamp(12, 0, 2)).toBe(2);
    expect(clamp(-4, 0, 2)).toBe(0);
    expect(clamp(1, 0, 2)).toBe(1);
  });
});
