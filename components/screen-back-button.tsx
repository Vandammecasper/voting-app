import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, defaultFontFamily } from '@/constants/theme';
import { PressableScale } from './pressable-scale';

interface ScreenBackButtonProps {
  onPress: () => void;
  label?: string;
}

export function ScreenBackButton({ onPress, label = 'Back' }: ScreenBackButtonProps) {
  const insets = useSafeAreaInsets();
  // Vote-flow screens already pad Android status bars via ThemedView `safeAndroid`.
  // Offset from that inner edge, not from the raw inset (that would double-pad).
  const topOffset = Platform.OS === 'android' ? 12 : Math.max(insets.top, 12);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={[styles.button, { top: topOffset }]}
    >
      <View style={styles.content}>
        <Ionicons
          name="chevron-back"
          size={Platform.OS === 'ios' ? 28 : 24}
          color={Colors.text}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 8,
    zIndex: 1000,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: defaultFontFamily,
    marginLeft: 2,
  },
});
