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

function isFullyTransparent(color: string) {
  const normalized = color.replace(/\s/g, '').toLowerCase();
  return (
    normalized === 'transparent' ||
    normalized === '#0000' ||
    normalized === '#00000000' ||
    /^#([0-9a-f]{6}|[0-9a-f]{3})00$/.test(normalized)
  );
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

  it('uses the app background for the window behind transparent system bars', () => {
    expect(appConfig.expo.backgroundColor).toBe(Colors.background);
    expect(rootBackgroundColor).toBe(Colors.background);
  });

  it('does not paint a solid Android status-bar color (shows up as a black bar)', () => {
    const statusBarColor = appConfig.expo.androidStatusBar?.backgroundColor;
    expect(statusBarColor).toBeDefined();
    expect(isFullyTransparent(statusBarColor!)).toBe(true);
    expect(appConfig.expo.androidStatusBar?.translucent).not.toBe(true);
  });

  it('does not paint a solid Android navigation-bar color', () => {
    const navigationBarColor = appConfig.expo.androidNavigationBar?.backgroundColor;
    expect(navigationBarColor).toBeDefined();
    expect(isFullyTransparent(navigationBarColor!)).toBe(true);
  });

  it('asks native screens to draw under the system bars', () => {
    expect(rootStackScreenOptions.statusBarTranslucent).toBe(true);
    expect(rootStackScreenOptions.navigationBarTranslucent).toBe(true);
    expect(rootStackScreenOptions.statusBarStyle).toBe('light');
    expect(rootStackScreenOptions.contentStyle.backgroundColor).toBe(Colors.background);
  });

  it('does not set a StatusBar backgroundColor', () => {
    expect(statusBarProps).toEqual({ style: 'light', translucent: true });
    expect(statusBarProps).not.toHaveProperty('backgroundColor');
  });

  it('applies the root window background through SystemUI', () => {
    applyRootBackground();
    expect(SystemUI.setBackgroundColorAsync).toHaveBeenCalledWith(Colors.background);
  });

  it('wires the system-bar config into the root layout', () => {
    const layout = read('app/_layout.tsx');
    expect(layout).toContain('applyRootBackground()');
    expect(layout).toContain('screenOptions={rootStackScreenOptions}');
    expect(layout).toContain('<StatusBar {...statusBarProps} />');
    expect(layout).not.toMatch(/<StatusBar[^>]*backgroundColor/);
  });

  it('keeps MainActivity drawing edge-to-edge', () => {
    const plugin = read('app.plugin.js');
    expect(plugin).toMatch(/setDecorFitsSystemWindows\(\$1,\s*false\)/);
  });
});
