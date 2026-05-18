import auth from '@react-native-firebase/auth';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;
const ANDROID_PACKAGE = 'com.caspervd.voting_app';
const LOG_PREFIX = '[VersionCheck]';

export interface AppVersionConfig {
  minimumVersion: string;
  iosStoreUrl?: string;
  androidStoreUrl?: string;
}

/** Compare semver-style versions. Returns negative if `current` is older than `required`. */
export function compareVersions(current: string, required: string): number {
  const currentParts = current.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const requiredParts = required.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(currentParts.length, requiredParts.length);

  for (let i = 0; i < length; i += 1) {
    const currentValue = currentParts[i] ?? 0;
    const requiredValue = requiredParts[i] ?? 0;
    if (currentValue < requiredValue) return -1;
    if (currentValue > requiredValue) return 1;
  }

  return 0;
}

export function getCurrentAppVersion(): string {
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.0.0';
  console.log(`${LOG_PREFIX} Current app version:`, version);
  return version;
}

export function isAppVersionOutdated(current: string, minimumVersion: string): boolean {
  const comparison = compareVersions(current, minimumVersion);
  const isOutdated = comparison < 0;
  console.log(`${LOG_PREFIX} Version compare`, {
    current,
    minimumVersion,
    comparison,
    isOutdated,
  });
  return isOutdated;
}

async function readViaRest<T>(path: string): Promise<T | null> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.warn(`${LOG_PREFIX} Skipping fetch for "${path}" — no authenticated user`);
      return null;
    }
    if (!DATABASE_URL) {
      console.warn(
        `${LOG_PREFIX} Skipping fetch for "${path}" — EXPO_PUBLIC_FIREBASE_DATABASEURL is not set`
      );
      return null;
    }

    const url = `${DATABASE_URL}/${path}.json?auth=${await currentUser.getIdToken()}`;
    console.log(`${LOG_PREFIX} Fetching`, path, 'from', DATABASE_URL);

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`${LOG_PREFIX} Fetch failed for "${path}"`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return null;
    }

    const data = (await response.json()) as T;
    console.log(`${LOG_PREFIX} Fetch succeeded for "${path}"`, data);
    return data;
  } catch (error) {
    console.error(`${LOG_PREFIX} Fetch error for "${path}"`, error);
    return null;
  }
}

/** Reads `appConfig` from Firebase. Set `minimumVersion` there when you release a new build. */
export async function fetchAppVersionConfig(): Promise<AppVersionConfig | null> {
  console.log(`${LOG_PREFIX} Loading appConfig from Firebase...`);
  const config = await readViaRest<Partial<AppVersionConfig>>('appConfig');

  if (!config) {
    console.warn(`${LOG_PREFIX} No appConfig data returned (null or fetch failed)`);
    return null;
  }

  if (!config.minimumVersion || typeof config.minimumVersion !== 'string') {
    console.warn(`${LOG_PREFIX} appConfig is missing a valid minimumVersion`, config);
    return null;
  }

  const parsed: AppVersionConfig = {
    minimumVersion: config.minimumVersion.trim(),
    iosStoreUrl: typeof config.iosStoreUrl === 'string' ? config.iosStoreUrl : undefined,
    androidStoreUrl:
      typeof config.androidStoreUrl === 'string' ? config.androidStoreUrl : undefined,
  };
  console.log(`${LOG_PREFIX} Parsed appConfig`, parsed);
  return parsed;
}

export async function openAppStore(config?: AppVersionConfig | null): Promise<void> {
  const url = Platform.select({
    ios: config?.iosStoreUrl,
    android:
      config?.androidStoreUrl ??
      `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
    default: undefined,
  });

  if (!url) {
    return;
  }

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}
