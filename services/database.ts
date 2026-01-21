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

// Get the database instance
export function getDb() {
  const app = getApp();
  return getDatabase(app);
}

// Get a reference to a path in the database
export function getDbRef(path: string): DatabaseReference {
  const db = getDb();
  return ref(db, path);
}

// Write data to a path (overwrites existing data)
export async function writeData<T>(path: string, data: T): Promise<void> {
  const dbRef = getDbRef(path);
  await set(dbRef, data);
}

// Read data once from a path using subscription-based approach
// This is more reliable than get() in React Native Firebase
export function readData<T>(path: string): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      const dbRef = getDbRef(path);
      
      const unsubscribe = onValue(
        dbRef,
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
          console.error(`❌ Error reading from ${path}:`, error);
          unsubscribe();
          resolve(null);
        }
      );
    } catch (error) {
      console.error(`❌ Error setting up read for ${path}:`, error);
      resolve(null);
    }
  });
}

// Push new data to a list (generates unique key)
export async function pushData<T>(path: string, data: T): Promise<string | null> {
  const dbRef = getDbRef(path);
  const newRef = push(dbRef);
  await set(newRef, data);
  return newRef.key;
}

// Update specific fields at a path (doesn't overwrite entire object)
export async function updateData(path: string, updates: Record<string, unknown>): Promise<void> {
  const dbRef = getDbRef(path);
  await update(dbRef, updates);
}

// Delete data at a path
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
  try {
    const dbRef = getDbRef(path);
    
    const unsubscribe = onValue(
      dbRef, 
      (snapshot: DataSnapshot) => {
        console.log(`📥 Got snapshot for ${path}, exists: ${snapshot.exists()}`);
        if (snapshot.exists()) {
          callback(snapshot.val() as T);
        } else {
          callback(null);
        }
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
      
      const unsubscribe = onValue(
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
          console.error(`❌ Error querying ${path}:`, error);
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

// Generate a 6-digit lobby code
// Note: With 900,000 possible codes, collisions are extremely rare for typical usage
export function generateLobbyCode(): string {
  // Generate random 6-digit number (100000-999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Find a lobby by its 6-digit code
// Returns the lobby ID and data if found, null otherwise
export async function findLobbyByCode(code: string): Promise<{ id: string; data: Record<string, unknown> } | null> {
  try {
    // Read from the lobbyCodes lookup table
    const lobbyId = await readData<string>(`lobbyCodes/${code}`);
    if (!lobbyId) {
      return null;
    }
    
    // Verify the lobby exists and is still active
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

