import * as fs from 'fs';
import * as path from 'path';
import { Platform } from 'react-native';

import { TAB_BAR_ITEM_HEIGHT, tabSceneBottomInset } from '@/constants/tabBar';

const repoRoot = path.join(__dirname, '..');

function read(relPath: string) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const tabScreens = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/history.tsx',
  'app/(tabs)/settings/index.tsx',
  'app/(tabs)/settings/teams.tsx',
  'app/(tabs)/settings/team-edit.tsx',
  'app/(tabs)/settings/feature-requests.tsx',
];

describe('tab scene insets', () => {
  it('clears the iOS native tab bar and leaves Android to sceneStyle', () => {
    expect(tabSceneBottomInset('ios', 34)).toBe(TAB_BAR_ITEM_HEIGHT + 34);
    expect(tabSceneBottomInset('android', 34)).toBe(0);
    expect(tabSceneBottomInset(Platform.OS, 34)).toBe(
      Platform.OS === 'ios' ? TAB_BAR_ITEM_HEIGHT + 34 : 0
    );
  });

  it('pads every tab-hosted screen above the iOS tab bar', () => {
    for (const relPath of tabScreens) {
      const source = read(relPath);
      expect(source).toContain('useTabSceneBottomInset');
      expect(source).toMatch(/paddingBottom:.*tabBarInset/);
    }
  });

  it('keeps headerless tab roots below the status bar', () => {
    expect(read('app/(tabs)/index.tsx')).toContain('paddingTop: insets.top');
    expect(read('app/(tabs)/history.tsx')).toContain('paddingTop: insets.top');
    expect(read('app/(tabs)/settings/index.tsx')).toContain('paddingTop: insets.top + 8');
  });

  it('does not stack a second status-bar inset under native Settings headers', () => {
    expect(read('app/(tabs)/settings/teams.tsx')).not.toContain('paddingTop: insets.top');
    expect(read('app/(tabs)/settings/team-edit.tsx')).not.toContain('paddingTop: insets.top');
    expect(read('app/(tabs)/settings/feature-requests.tsx')).not.toContain(
      'paddingTop: insets.top'
    );
    expect(read('app/(tabs)/settings/_layout.tsx')).toContain('headerTransparent: false');
    expect(read('app/(tabs)/settings/_layout.tsx')).toContain('headerShown: true');
  });
});
