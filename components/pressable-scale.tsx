import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PRESS_SCALE, PRESS_SPRING } from '@/constants/motion';
import { commitHaptic } from '@/utils/haptics';

type PressableScaleProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> & {
  children?: React.ReactNode;
  haptic?: boolean;
  scaleTo?: number;
  innerStyle?: StyleProp<ViewStyle>;
};

export function PressableScale({
  onPress,
  onPressIn,
  onPressOut,
  children,
  style,
  disabled,
  haptic = true,
  scaleTo = PRESS_SCALE,
  innerStyle,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = withSpring(scaleTo, PRESS_SPRING);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, PRESS_SPRING);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic && !disabled) {
          commitHaptic();
        }
        onPress?.(event);
      }}
      style={style}
      {...rest}
    >
      <Animated.View style={[animatedStyle, innerStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
