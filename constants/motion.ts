/** Apple-style springs: response (seconds) + damping ratio, mapped to Reanimated physics. */

function stiffnessForResponse(response: number, mass = 1) {
  const angular = (2 * Math.PI) / response;
  return angular * angular * mass;
}

function dampingForRatio(response: number, dampingRatio: number, mass = 1) {
  return (4 * Math.PI * dampingRatio * mass) / response;
}

/** Critically damped UI settle — buttons, chrome, page snaps without bounce. */
export const UI_SPRING = {
  mass: 1,
  stiffness: stiffnessForResponse(0.4),
  damping: dampingForRatio(0.4, 1),
  overshootClamping: true,
} as const;

/** Sheet / flick — slight bounce only when momentum preceded the settle. */
export const SHEET_SPRING = {
  mass: 1,
  stiffness: stiffnessForResponse(0.3),
  damping: dampingForRatio(0.3, 0.8),
  overshootClamping: false,
} as const;

/** Press-down scale — snappy, no overshoot. */
export const PRESS_SPRING = {
  mass: 1,
  stiffness: stiffnessForResponse(0.2),
  damping: dampingForRatio(0.2, 1),
  overshootClamping: true,
} as const;

export const PRESS_SCALE = 0.97;

/**
 * Exponential-decay projection from Designing Fluid Interfaces.
 * `initialVelocity` is px/s. `decelerationRate` 0.998 ≈ normal scroll; 0.99 is snappier.
 */
export function project(initialVelocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past a bound. `overshoot` is px past the edge. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  if (dimension <= 0) {
    return 0;
  }
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}
