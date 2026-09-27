import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, defaultFontFamily } from '@/constants/theme';
import { scale } from '@/utils/scale';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        { color: Colors.text, fontFamily: defaultFontFamily },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: scale(16),
    lineHeight: scale(24),
  },
  defaultSemiBold: {
    fontSize: scale(16),
    lineHeight: scale(24),
    fontWeight: '600',
  },
  title: {
    fontSize: scale(32),
    fontWeight: 'bold',
    lineHeight: scale(40),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: scale(20),
    fontWeight: '600',
    lineHeight: scale(26),
    letterSpacing: -0.2,
  },
  link: {
    lineHeight: scale(30),
    fontSize: scale(16),
    color: '#6DB3F2',
  },
});
