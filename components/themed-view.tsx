import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  transparent?: boolean;
};

export function ThemedView({ style, transparent, ...otherProps }: ThemedViewProps) {
  const backgroundColor = transparent ? 'transparent' : Colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
