import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

/** Design reference — iPhone 14 / 15 logical size. */
export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 844;

function clampFactor(width: number, height: number): number {
  // Shrink to fit short/narrow phones; never grow past the design size.
  return Math.min(width / BASE_WIDTH, height / BASE_HEIGHT, 1);
}

export function getScaleFactor(
  width = Dimensions.get('window').width,
  height = Dimensions.get('window').height
): number {
  return clampFactor(width, height);
}

/** Uniform scale (width + height constrained). Use for fonts, gaps, radii. */
export function scale(
  size: number,
  width = Dimensions.get('window').width,
  height = Dimensions.get('window').height
): number {
  return PixelRatio.roundToNearestPixel(size * clampFactor(width, height));
}

/**
 * Soften scale toward the design size.
 * factor 0 = no scaling, 1 = full scale(). Default 0.5.
 */
export function moderateScale(
  size: number,
  factor = 0.5,
  width = Dimensions.get('window').width,
  height = Dimensions.get('window').height
): number {
  const scaled = size * clampFactor(width, height);
  return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
}

/** Hook that re-computes scale when the window size changes. */
export function useScale() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const factor = clampFactor(width, height);
    const s = (size: number) => PixelRatio.roundToNearestPixel(size * factor);
    const ms = (size: number, f = 0.5) =>
      PixelRatio.roundToNearestPixel(size + (size * factor - size) * f);
    return { s, ms, factor, width, height };
  }, [width, height]);
}
