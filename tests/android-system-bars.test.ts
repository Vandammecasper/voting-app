import * as fs from 'fs';
import * as path from 'path';
import * as SystemUI from 'expo-system-ui';

import {
  applyRootBackground,
  rootBackgroundColor,
  rootStackScreenOptions,
  statusBarProps,
} from '@/constants/systemBars';
import { Colors } from '@/constants/theme';

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
}));

const repoRoot = path.join(__dirname, '..');

function read(relPath: string) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('Android edge-to-edge system bars', () => {
  const appConfig = JSON.parse(read('app.json')) as {
    expo: {
      backgroundColor?: string;
      android?: { edgeToEdgeEnabled?: boolean };
      androidStatusBar?: { backgroundColor?: string; translucent?: boolean };
      androidNavigationBar?: { backgroundColor?: string };
    };
  };

  it('keeps edge-to-edge enabled so content can draw under the status bar', () => {
    expect(appConfig.expo.android?.edgeToEdgeEnabled).toBe(true);
  });

  it('uses the app background for the window and Android system bars', () => {
    expect(appConfig.expo.backgroundColor).toBe(Colors.background);
    expect(rootBackgroundColor).toBe(Colors.background);
    expect(appConfig.expo.androidStatusBar?.backgroundColor).toBe(Colors.background);
    expect(appConfig.expo.androidNavigationBar?.backgroundColor).toBe(Colors.background);
  });

  it('does not leave the Android status bar on the light splash theme', () => {
    expect(appConfig.expo.androidStatusBar?.backgroundColor).not.toMatch(/00000000$/i);
    expect(appConfig.expo.androidStatusBar?.backgroundColor?.toLowerCase()).not.toBe('#ffffff');
    expect(appConfig.expo.androidStatusBar?.translucent).not.toBe(true);
  });

  it('asks native screens to draw under the system bars', () => {
    expect(rootStackScreenOptions.statusBarTranslucent).toBe(true);
    expect(rootStackScreenOptions.navigationBarTranslucent).toBe(true);
    expect(rootStackScreenOptions.statusBarStyle).toBe('light');
    expect(rootStackScreenOptions.contentStyle.backgroundColor).toBe(Colors.background);
  });

  it('does not set a JS StatusBar backgroundColor', () => {
    expect(statusBarProps).toEqual({ style: 'light' });
    expect(statusBarProps).not.toHaveProperty('backgroundColor');
    expect(statusBarProps).not.toHaveProperty('translucent');
  });

  it('applies the root window background through SystemUI', () => {
    applyRootBackground();
    expect(SystemUI.setBackgroundColorAsync).toHaveBeenCalledWith(Colors.background);
  });

  it('does not mount expo-status-bar on Android', () => {
    const layout = read('app/_layout.tsx');
    expect(layout).toContain('applyRootBackground()');
    expect(layout).toContain('screenOptions={rootStackScreenOptions}');
    expect(layout).toContain("Platform.OS !== 'android' ? <StatusBar {...statusBarProps} />");
    expect(layout).not.toMatch(/<StatusBar[^>]*backgroundColor/);
  });

  it('applies AppTheme after splash and draws edge-to-edge afterward', () => {
    const plugin = read('app.plugin.js');
    expect(plugin).toContain('setTheme(R.style.AppTheme)');
    expect(plugin).toContain('After splash:');
    expect(plugin).toMatch(/setDecorFitsSystemWindows\(\$1,\s*false\)/);
    expect(plugin).toContain("android:statusBarColor', '#292929'");
    expect(plugin).toContain("android:enforceStatusBarContrast");
  });
});
