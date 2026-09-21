import { getApp } from '@react-native-firebase/app';

function sanitizeUrl(raw: string | undefined | null): string | undefined {
  const trimmed = raw?.trim().replace(/\/$/, '');
  if (!trimmed || trimmed.includes('${')) {
    return undefined;
  }
  return trimmed;
}

function fromNativeApp(): string | undefined {
  try {
    return sanitizeUrl(getApp().options.databaseURL);
  } catch {
    return undefined;
  }
}

/** Firebase RTDB REST base URL. Accepts both env names used in this project. */
export function getFirebaseDatabaseUrl(): string | undefined {
  return (
    sanitizeUrl(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL) ||
    sanitizeUrl(process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL) ||
    sanitizeUrl(process.env.EXPO_PUBLIC_DATABASEURL) ||
    fromNativeApp()
  );
}
