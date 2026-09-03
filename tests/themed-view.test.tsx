import { Platform, StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const insets = { top: 48, bottom: 24, left: 0, right: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => insets,
}));

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
}

describe('ThemedView safeAndroid insets', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    setPlatform(originalOS);
  });

  it('pads with system-bar insets on Android and fills them with the app background', async () => {
    setPlatform('android');

    const { toJSON } = await render(
      <ThemedView safeAndroid>
        <Text>content</Text>
      </ThemedView>
    );

    const tree = toJSON() as { props: { style: object }; children: unknown[] };
    expect(tree.props.style).toEqual(
      expect.objectContaining({
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      })
    );
    expect(tree.children).toHaveLength(1);
  });

  it('does not add system-bar padding on iOS even when safeAndroid is set', async () => {
    setPlatform('ios');

    const { toJSON } = await render(
      <ThemedView safeAndroid>
        <Text>content</Text>
      </ThemedView>
    );

    const tree = toJSON() as { props: { style: unknown } };
    const style = StyleSheet.flatten(tree.props.style);

    expect(style).toEqual(
      expect.objectContaining({
        backgroundColor: Colors.background,
      })
    );
    expect(style?.paddingTop).not.toBe(insets.top);
    expect(style?.paddingBottom).not.toBe(insets.bottom);
  });

  it('does not add system-bar padding on Android unless safeAndroid is set', async () => {
    setPlatform('android');

    const { toJSON } = await render(
      <ThemedView>
        <Text>content</Text>
      </ThemedView>
    );

    const tree = toJSON() as { props: { style: unknown } };
    const style = StyleSheet.flatten(tree.props.style);

    expect(style?.paddingTop).not.toBe(insets.top);
  });
});
