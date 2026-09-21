import * as fs from 'fs';
import * as path from 'path';
import { Platform, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { ScreenBackButton } from '@/components/screen-back-button';

const repoRoot = path.join(__dirname, '..');

function read(relPath: string) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const insets = { top: 48, bottom: 32, left: 0, right: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => insets,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
}

describe('Android fluid UI contracts', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    setPlatform(originalOS);
  });

  it('does not double-count the navigation-bar inset on the tab bar', () => {
    const layout = read('app/(tabs)/_layout.tsx');
    expect(layout).not.toMatch(/paddingBottom:\s*Platform\.OS === 'android'/);
    expect(layout).not.toMatch(/height:\s*52 \+/);
    expect(layout).toContain('tabBarStyle');
    expect(layout).toContain('detachInactiveScreens={false}');
    expect(layout).toContain('safeAreaInsets={insets}');
    expect(layout).toContain('paddingBottom: tabBarHeight');
  });

  it('keeps tabs off the root back-gesture stack so the bar stays tappable', () => {
    const layout = read('app/_layout.tsx');
    expect(layout).toContain('Stack.Protected');
    expect(layout).toContain('gestureEnabled: false');
    expect(layout).toContain("name=\"(tabs)\"");
    expect(layout).toContain('fullScreenGestureEnabled: false');
    expect(layout).not.toContain('unstable-native-tabs');
  });

  it('wraps the draft sheet Modal in a GestureHandlerRootView (Android native window)', () => {
    const panel = read('components/vote-draft-panel.tsx');
    expect(panel).toContain('GestureHandlerRootView');
    expect(panel).toMatch(/<Modal[\s\S]*<GestureHandlerRootView/);
    expect(panel).toContain('onRequestClose={handleCloseFromJS}');
    expect(panel).toContain('statusBarTranslucent');
    expect(panel).toContain('collapsable={false}');
  });

  it('keeps the results pager scrollable on Android nested gestures', () => {
    const results = read('app/results.tsx');
    expect(results).toContain('nestedScrollEnabled');
    expect(read('components/swipe-pager.tsx')).toContain('collapsable={false}');
  });

  it('hides the empty Settings stack header so Android does not show a blank bar', () => {
    const settingsLayout = read('app/(tabs)/settings/_layout.tsx');
    expect(settingsLayout).toContain('name="index"');
    expect(settingsLayout).toContain('headerShown: false');
    expect(settingsLayout).toContain('gestureEnabled: true');
    expect(settingsLayout).toContain('fullScreenGestureEnabled: true');
    expect(settingsLayout).toContain('headerTransparent: false');
  });

  it('uses native iOS tabs and JavaScript Android tabs', () => {
    const layout = read('app/(tabs)/_layout.tsx');
    expect(layout).toContain("expo-router/unstable-native-tabs");
    expect(layout).toContain("Platform.OS === 'ios'");
    expect(layout).toContain('IosNativeTabs');
    expect(layout).toContain('JavaScriptTabs');
  });

  it('places Back below the inner edge on Android, not a second status-bar inset', async () => {
    setPlatform('android');

    const { toJSON } = await render(<ScreenBackButton onPress={() => {}} />);
    const tree = toJSON() as { props: { style: unknown } };
    const style = StyleSheet.flatten(tree.props.style);

    expect(style?.top).toBe(12);
    expect(style?.top).not.toBe(insets.top);
  });

  it('uses the status-bar inset for Back on iOS headerless screens', async () => {
    setPlatform('ios');

    const { toJSON } = await render(<ScreenBackButton onPress={() => {}} />);
    const tree = toJSON() as { props: { style: unknown } };
    const style = StyleSheet.flatten(tree.props.style);

    expect(style?.top).toBe(insets.top);
  });

  it('places Exit on the top-right of vote-flow screens', async () => {
    setPlatform('ios');

    const { toJSON } = await render(
      <ScreenBackButton variant="exit" onPress={() => {}} />
    );
    const tree = toJSON() as { props: { style: unknown } };
    const style = StyleSheet.flatten(tree.props.style);

    expect(style?.right).toBe(8);
    expect(style?.left).toBeUndefined();
  });
});
