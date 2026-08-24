import { Platform, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  transparent?: boolean;
  /** Pad for Android system bars on screens without a navigation header. */
  safeAndroid?: boolean;
};

export function ThemedView({
  style,
  transparent,
  safeAndroid,
  ...otherProps
}: ThemedViewProps) {
  const insets = useSafeAreaInsets();
  const backgroundColor = transparent ? 'transparent' : Colors.background;

  if (safeAndroid && Platform.OS === 'android') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}>
        <View style={[{ flex: 1, backgroundColor }, style]} {...otherProps} />
      </View>
    );
  }

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
