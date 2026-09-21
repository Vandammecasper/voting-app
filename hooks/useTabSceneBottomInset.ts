import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabSceneBottomInset } from '@/constants/tabBar';

/** Bottom padding so iOS NativeTabs scenes sit above the system tab bar. */
export function useTabSceneBottomInset() {
  const insets = useSafeAreaInsets();
  return tabSceneBottomInset(Platform.OS, insets.bottom);
}
