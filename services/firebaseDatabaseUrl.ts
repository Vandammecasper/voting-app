/** Firebase RTDB REST base URL. Accepts both env names used in this project. */
export function getFirebaseDatabaseUrl(): string | undefined {
  const raw =
    process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL?.trim() ||
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL?.trim();

  if (!raw) {
    return undefined;
  }

  return raw.replace(/\/$/, '');
}
