import { LinearGradient } from 'expo-linear-gradient';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

import { Colors, defaultFontFamily } from '@/constants/theme';
import { GradientText } from './gradient-text';

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
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, disabled && { opacity: 0.5 }]}
    >
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0.42, y: 0.1 }}
        end={{ x: 0.5, y: 1.75 }}
        style={[styles.button, style]}
      >
        <Text style={[styles.primaryText, textStyle]}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({
    children,
    onPress,
    style,
    textStyle,
  }: GradientButtonProps) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
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
      </Pressable>
    );
  }

const styles = StyleSheet.create({
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
});

