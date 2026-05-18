import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import {
  fetchAppVersionConfig,
  getCurrentAppVersion,
  isAppVersionOutdated,
  openAppStore,
} from '@/services/versionCheck';

const LOG_PREFIX = '[VersionCheck]';
const UPDATE_MESSAGE =
  "You don't have the newest version of the app. To use the latest features and get the full potential out of the application, please update to the latest version.";

export function useVersionCheck(enabled: boolean) {
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      console.log(`${LOG_PREFIX} Waiting for auth before version check`);
      return;
    }

    if (hasCheckedRef.current) {
      return;
    }

    hasCheckedRef.current = true;
    console.log(`${LOG_PREFIX} Starting version check`);

    async function checkVersion() {
      try {
        const config = await fetchAppVersionConfig();
        if (!config) {
          console.warn(`${LOG_PREFIX} Version check stopped — could not load appConfig`);
          return;
        }

        const currentVersion = getCurrentAppVersion();
        if (!isAppVersionOutdated(currentVersion, config.minimumVersion)) {
          console.log(`${LOG_PREFIX} App is up to date — no update alert`);
          return;
        }

        console.log(`${LOG_PREFIX} Showing update alert`);
        Alert.alert('Update available', UPDATE_MESSAGE, [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Update',
            onPress: () => {
              void openAppStore(config);
            },
          },
        ]);
      } catch (error) {
        console.error(`${LOG_PREFIX} Version check failed`, error);
      }
    }

    void checkVersion();
  }, [enabled]);
}
