import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { clamp, project, rubberband, SHEET_SPRING, UI_SPRING } from '@/constants/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SwipePagerProps {
  index: number;
  onIndexChange: (index: number) => void;
  pageWidth: number;
  children: React.ReactNode;
}

export function SwipePager({ index, onIndexChange, pageWidth, children }: SwipePagerProps) {
  const pages = React.Children.toArray(children);
  const pageCount = pages.length;
  const reduceMotion = useReducedMotion();
  const translateX = useSharedValue(-index * pageWidth);
  const dragStartX = useSharedValue(-index * pageWidth);
  const reduceMotionSV = useSharedValue(reduceMotion);

  useEffect(() => {
    reduceMotionSV.value = reduceMotion;
  }, [reduceMotion, reduceMotionSV]);

  useEffect(() => {
    const target = -index * pageWidth;
    if (reduceMotion) {
      translateX.value = withTiming(target, { duration: 200 });
      return;
    }
    translateX.value = withSpring(target, UI_SPRING);
  }, [index, pageWidth, reduceMotion, translateX]);

  const pan = Gesture.Pan()
    .enabled(pageCount > 1 && !reduceMotion)
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onStart(() => {
      dragStartX.value = translateX.value;
    })
    .onUpdate((event) => {
      const min = -(pageCount - 1) * pageWidth;
      const max = 0;
      const next = dragStartX.value + event.translationX;
      if (next > max) {
        translateX.value = rubberband(next - max, pageWidth);
        return;
      }
      if (next < min) {
        translateX.value = min + rubberband(next - min, pageWidth);
        return;
      }
      translateX.value = next;
    })
    .onEnd((event) => {
      const min = -(pageCount - 1) * pageWidth;
      const max = 0;
      const projected = clamp(translateX.value + project(event.velocityX), min, max);
      const nextIndex = clamp(Math.round(-projected / pageWidth), 0, pageCount - 1);
      const bounced = Math.abs(event.velocityX) > 800;
      translateX.value = withSpring(-nextIndex * pageWidth, {
        ...(bounced ? SHEET_SPRING : UI_SPRING),
        velocity: event.velocityX,
      });
      runOnJS(onIndexChange)(nextIndex);
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    flexDirection: 'row' as const,
    width: pageWidth * pageCount,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View collapsable={false} style={[styles.viewport, { width: pageWidth }]}>
        <Animated.View style={trackStyle}>
          {pages.map((child, childIndex) => (
            <View key={childIndex} style={{ width: pageWidth }}>
              {child}
            </View>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
  },
});
