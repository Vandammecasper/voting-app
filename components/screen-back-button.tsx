import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, defaultFontFamily } from '@/constants/theme';
import { PressableScale } from './pressable-scale';

interface ScreenBackButtonProps {
  onPress: () => void;
  label?: string;
  /** `exit` sits top-right and leaves the vote flow. */
  variant?: 'back' | 'exit';
}

export function ScreenBackButton({
  onPress,
  label,
  variant = 'back',
}: ScreenBackButtonProps) {
  const insets = useSafeAreaInsets();
  // Vote-flow screens already pad Android status bars via ThemedView `safeAndroid`.
  // Offset from that inner edge, not from the raw inset (that would double-pad).
  const topOffset = Platform.OS === 'android' ? 12 : Math.max(insets.top, 12);
  const isExit = variant === 'exit';
  const resolvedLabel = label ?? (isExit ? 'Exit' : 'Back');

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      hitSlop={12}
      collapsable={false}
      style={[styles.button, isExit ? styles.exit : styles.back, { top: topOffset }]}
    >
      <View style={styles.content}>
        {isExit ? (
          <>
            <Text style={styles.label}>{resolvedLabel}</Text>
            <Ionicons name="close" size={Platform.OS === 'ios' ? 28 : 24} color={Colors.text} />
          </>
        ) : (
          <>
            <Ionicons
              name="chevron-back"
              size={Platform.OS === 'ios' ? 28 : 24}
              color={Colors.text}
            />
            <Text style={[styles.label, styles.backLabel]}>{resolvedLabel}</Text>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 1000,
    elevation: 1000,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  back: {
    left: 8,
  },
  exit: {
    right: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: defaultFontFamily,
  },
  backLabel: {
    marginLeft: 2,
  },
});
