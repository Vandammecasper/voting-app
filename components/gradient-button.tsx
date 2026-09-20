import { LinearGradient } from 'expo-linear-gradient';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

import { Colors, defaultFontFamily } from '@/constants/theme';
import { GradientText } from './gradient-text';
import { PressableScale } from './pressable-scale';

const GRADIENT_COLORS = ['#6E92FF', '#90FF91'] as const;

interface GradientButtonProps {
  children: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export function PrimaryButton({
  children,
  onPress,
  style,
  textStyle,
  disabled,
}: GradientButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={children}
      style={[style, disabled && styles.disabled]}
      innerStyle={styles.fill}
    >
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0.42, y: 0.1 }}
        end={{ x: 0.5, y: 1.75 }}
        style={[styles.button, style]}
      >
        <Text style={[styles.primaryText, textStyle]}>{children}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

export function SecondaryButton({
    children,
    onPress,
    style,
    textStyle,
    disabled,
  }: GradientButtonProps) {
    return (
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={children}
        style={[style, disabled && styles.disabled]}
        innerStyle={styles.fill}
      >
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0.42, y: 0.1 }}
          end={{ x: 0.5, y: 1.75 }}
          style={[styles.borderGradient, style]}
        >
          <View style={styles.innerContainer}>
            <GradientText 
              text={children} 
              style={[styles.secondaryText, textStyle]}
            />
          </View>
        </LinearGradient>
      </PressableScale>
    );
  }

const styles = StyleSheet.create({
  fill: {
    width: '100%',
  },
  button: {
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderGradient: {
    borderRadius: 28,
    padding: 2,
  },
  innerContainer: {
    backgroundColor: Colors.background,
    borderRadius: 26,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1a1a1a',
    fontFamily: defaultFontFamily,
  },
  secondaryText: {
    fontSize: 24,
    fontWeight: '500',
    fontFamily: defaultFontFamily,
  },
  disabled: {
    opacity: 0.5,
  },
});
