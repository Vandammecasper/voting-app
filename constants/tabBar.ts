/** Matches React Navigation / UIKit default tab-bar item height, excluding the home indicator. */
export const TAB_BAR_ITEM_HEIGHT = 49;

/**
 * Extra bottom space so tab-scene content clears the iOS native tab bar.
 * Android JS Tabs already apply this via `sceneStyle.paddingBottom`.
 */
export function tabSceneBottomInset(platformOS: string, safeAreaBottom: number) {
  if (platformOS !== 'ios') {
    return 0;
  }
  return TAB_BAR_ITEM_HEIGHT + safeAreaBottom;
}
