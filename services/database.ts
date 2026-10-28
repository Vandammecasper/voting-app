import { getApp } from '@react-native-firebase/app';
import {
    child,
    DatabaseReference,
    DataSnapshot,
    equalTo,
    getDatabase,
    onValue,
    orderByChild,
    push,
    query,
    ref,
    remove,
    set,
    update
} from '@react-native-firebase/database';
import { getFirebaseDatabaseUrl } from '@/services/firebaseDatabaseUrl';

export type DbFailure = {
  ok: false;
  path: string;
  method: string;
  status: number | null;
  error: string;
};

export type DbWriteSuccess = { ok: true };
export type DbWriteResult = DbWriteSuccess | DbFailure;
export type DbPushResult = { ok: true; key: string } | DbFailure;
export type DbGetResult<T> =
  | { ok: true; data: T | null }
  | DbFailure;

export function formatDbError(error: unknown): string {
  if (error instanceof Error) {
    const native = error as Error & { code?: string };
    return native.code ? `${native.code}: ${native.message}` : native.message;
  }
  return String(error);
}

function dbFailure(path: string, method: string, error: unknown): DbFailure {
  return {
    ok: false,
    path,
    method,
    status: null,
    error: formatDbError(error),
  };
}

// Get the database instance. Pass an explicit URL because google-services.json
// may still contain an unsubstituted ${EXPO_PUBLIC_FIREBASE_DATABASE_URL} placeholder.
export function getDb() {
  const app = getApp();
  const url = getFirebaseDatabaseUrl();
  if (!url) {
    throw new Error('Firebase Database URL is not configured');
  }
  return getDatabase(app, url);
}

// Get a reference to a path in the database
export function getDbRef(path: string): DatabaseReference {
  if (path === 'featureRequests') console.log('[FeatureRequests/database] getDbRef: calling getDb...');
  const db = getDb();
  if (path === 'featureRequests') console.log('[FeatureRequests/database] getDbRef: getDb done, calling ref...');
  const r = ref(db, path);
  if (path === 'featureRequests') console.log('[FeatureRequests/database] getDbRef: done');
  return r;
}

// Write data to a path (overwrites existing data)
export async function writeData<T>(path: string, data: T): Promise<void> {
  const dbRef = getDbRef(path);
  await set(dbRef, data);
}

export async function writeDataDetailed<T>(
  path: string,
  data: T
): Promise<DbWriteResult> {
  try {
    await writeData(path, data);
    return { ok: true };
  } catch (error) {
    return dbFailure(path, 'PUT', error);
  }
}

// Read data once from a path using subscription-based approach
// This is more reliable than get() in React Native Firebase
export function readDataDetailed<T>(path: string): Promise<DbGetResult<T>> {
  return new Promise((resolve) => {
    try {
      const dbRef = getDbRef(path);
      let unsubscribe: () => void = () => {};

      unsubscribe = onValue(
        dbRef,
        (snapshot: DataSnapshot) => {
          unsubscribe();
          resolve({
            ok: true,
            data: snapshot.exists() ? (snapshot.val() as T) : null,
          });
        },
        (error: Error) => {
          unsubscribe();
          resolve(dbFailure(path, 'GET', error));
        }
      );
    } catch (error) {
      resolve(dbFailure(path, 'GET', error));
    }
  });
}

export function readData<T>(path: string): Promise<T | null> {
  return readDataDetailed<T>(path).then((result) =>
    result.ok ? result.data : null
  );
}

// Push new data to a list (generates unique key)
export async function pushDataDetailed<T>(
  path: string,
  data: T
): Promise<DbPushResult> {
  try {
    const dbRef = getDbRef(path);
    const newRef = push(dbRef);
    await set(newRef, data);
    if (!newRef.key) {
      return {
        ok: false,
        path,
        method: 'PUT',
        status: null,
        error: 'Push succeeded without a key',
      };
    }
    return { ok: true, key: newRef.key };
  } catch (error) {
    return dbFailure(path, 'PUT', error);
  }
}

export async function pushData<T>(path: string, data: T): Promise<string | null> {
  const result = await pushDataDetailed(path, data);
  return result.ok ? result.key : null;
}

// Update specific fields at a path (doesn't overwrite entire object)
export async function updateDataDetailed(
  path: string,
  updates: Record<string, unknown>
): Promise<DbWriteResult> {
  try {
    await updateData(path, updates);
    return { ok: true };
  } catch (error) {
    return dbFailure(path || '/', 'PATCH', error);
  }
}

export async function updateData(path: string, updates: Record<string, unknown>): Promise<void> {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  const dbRef = trimmed ? getDbRef(trimmed) : ref(getDb());
  await update(dbRef, updates);
}

// Delete data at a path
export async function deleteDataDetailed(path: string): Promise<DbWriteResult> {
  try {
    await deleteData(path);
    return { ok: true };
  } catch (error) {
    return dbFailure(path, 'DELETE', error);
  }
}

export async function deleteData(path: string): Promise<void> {
  const dbRef = getDbRef(path);
  await remove(dbRef);
}

// Subscribe to real-time updates at a path
export function subscribeToData<T>(
  path: string, 
  callback: (data: T | null) => void,
  onError?: (error: Error) => void
): () => void {
  const isFeatureRequests = path === 'featureRequests';
  if (isFeatureRequests) console.log('[FeatureRequests/database] subscribeToData: path=', path);
  try {
    if (isFeatureRequests) console.log('[FeatureRequests/database] subscribeToData: calling getDbRef...');
    const dbRef = getDbRef(path);
    if (isFeatureRequests) console.log('[FeatureRequests/database] subscribeToData: getDbRef done, calling onValue...');
    
    const unsubscribe = onValue(
      dbRef, 
      (snapshot: DataSnapshot) => {
        if (isFeatureRequests) console.log('[FeatureRequests/database] onValue: snapshot received, exists=', snapshot.exists());
        const runCallback = () => {
          try {
            const val = snapshot.exists() ? (snapshot.val() as T) : null;
            if (isFeatureRequests) console.log('[FeatureRequests/database] onValue: calling callback with val type=', val == null ? 'null' : typeof val);
            callback(val);
          } catch (e) {
            console.error('[FeatureRequests/database] onValue: callback threw', e);
            onError?.(e instanceof Error ? e : new Error(String(e)));
            callback(null);
          }
        };
        // Defer to next tick so we're off the native Firebase callback stack (can prevent native→JS crash when updating React state)
        setTimeout(runCallback, 0);
      },
      (error: Error) => {
        console.error(`❌ Error subscribing to ${path}:`, error);
        onError?.(error);
      }
    );

    // Return the unsubscribe function directly (don't use off() - it's not implemented in RN Firebase)
    return () => {
      unsubscribe();
    };
  } catch (outerError) {
    console.error(`❌ Error setting up subscription for ${path}:`, outerError);
    onError?.(outerError as Error);
    return () => {};
  }
}

// Helper to generate a child reference
export function getChildRef(parentPath: string, childPath: string): DatabaseReference {
  const parentRef = getDbRef(parentPath);
  return child(parentRef, childPath);
}

// Query data by a child value using subscription-based approach
export function queryByChild<T>(
  path: string, 
  childKey: string, 
  value: string | number | boolean
): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      const dbRef = getDbRef(path);
      const q = query(dbRef, orderByChild(childKey), equalTo(value));
      let unsubscribe: () => void = () => {};

      unsubscribe = onValue(
        q,
        (snapshot: DataSnapshot) => {
          // Immediately unsubscribe after getting the value
          unsubscribe();

          if (snapshot.exists()) {
            resolve(snapshot.val() as T);
          } else {
            resolve(null);
          }
        },
        (error: Error) => {
          console.error(`❌ Error reading query ${path}:`, error);
          unsubscribe();
          resolve(null);
        }
      );
    } catch (error) {
      console.error(`❌ Error setting up query for ${path}:`, error);
      resolve(null);
    }
  });
}

export interface LobbyCodeMapping {
  lobbyId: string;
  status: string;
  voteType?: 'mvpOnly' | 'mvpAndLoser';
  teamName?: string;
  teamMembers?: string[] | Record<string, string>;
  claimedNames?: Record<string, string> | string[];
}

export { generateLobbyCode, LOBBY_CODE_ALPHABET, LOBBY_CODE_LENGTH } from '@/services/lobbyCode';

function lobbyIdFromCodeMapping(value: unknown): string | null {
  if (typeof value === 'string' && value) {
    return value;
  }
  if (value && typeof value === 'object' && 'lobbyId' in value) {
    const lobbyId = (value as LobbyCodeMapping).lobbyId;
    return typeof lobbyId === 'string' && lobbyId ? lobbyId : null;
  }
  return null;
}

export async function findLobbyByCode(code: string): Promise<{ id: string; data: Record<string, unknown> } | null> {
  try {
    const mapping = await readData<LobbyCodeMapping | string>(`lobbyCodes/${code}`);
    const lobbyId = lobbyIdFromCodeMapping(mapping);
    if (!lobbyId) {
      return null;
    }
    
    const lobbyData = await readData<Record<string, unknown>>(`lobbies/${lobbyId}`);
    if (!lobbyData) {
      return null;
    }
    
    if (lobbyData.status !== 'waiting') {
      return null;
    }
    
    return { id: lobbyId, data: lobbyData };
  } catch (error) {
    console.error(`❌ Error finding lobby by code ${code}:`, error);
    return null;
  }
}

// Re-export types for convenience
export type { DatabaseReference, DataSnapshot };

