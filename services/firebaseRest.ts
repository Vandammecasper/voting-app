import { getFirebaseAuth } from '@/services/firebaseAuth';
import {
  deleteDataDetailed,
  pushDataDetailed,
  readDataDetailed,
  updateDataDetailed,
  writeDataDetailed,
  type DbFailure,
} from '@/services/database';
import { fillRandomBytes } from '@/services/randomBytes';

export type RestFailure = DbFailure;

export type RestWriteSuccess = { ok: true };
export type RestWriteResult = RestWriteSuccess | RestFailure;
export type RestPushResult = { ok: true; key: string } | RestFailure;
export type RestGetResult<T> =
  | { ok: true; data: T | null }
  | RestFailure;

export function formatRestFailure(failure: RestFailure): string {
  const status = failure.status != null ? `HTTP ${failure.status}` : 'no response';
  return `${failure.method} ${failure.path} (${status}): ${failure.error}`;
}

export function formatCaughtError(error: unknown): string {
  if (error instanceof Error) {
    const native = error as Error & { code?: string };
    return native.code ? `${native.code}: ${native.message}` : native.message;
  }
  return String(error);
}

export function isTransientFetchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('status provided (0)') ||
    message.includes('Failed to construct \'Response\'') ||
    message.includes('Aborted') ||
    message.includes('Network request failed')
  );
}

function requireSignedIn(path: string, method: string): RestFailure | null {
  if (getFirebaseAuth().currentUser) {
    return null;
  }
  return { ok: false, path, method, status: null, error: 'Not signed in' };
}

/**
 * Authenticated database reads/writes go through the native RN Firebase SDK
 * so Firebase ID tokens are never placed in REST URL query strings.
 */
export async function restGetDetailed<T>(path: string): Promise<RestGetResult<T>> {
  const authError = requireSignedIn(path, 'GET');
  if (authError) {
    return authError;
  }
  return readDataDetailed<T>(path);
}

export async function restGet<T>(path: string): Promise<T | null> {
  const result = await restGetDetailed<T>(path);
  if (!result.ok) {
    return null;
  }
  return result.data;
}

export async function restPutDetailed<T>(path: string, data: T): Promise<RestWriteResult> {
  const authError = requireSignedIn(path, 'PUT');
  if (authError) {
    return authError;
  }
  return writeDataDetailed(path, data);
}

export async function restPut<T>(path: string, data: T): Promise<boolean> {
  return (await restPutDetailed(path, data)).ok;
}

export async function restPatchDetailed(
  path: string,
  data: Record<string, unknown>
): Promise<RestWriteResult> {
  const authError = requireSignedIn(path || '/', 'PATCH');
  if (authError) {
    return authError;
  }
  return updateDataDetailed(path, data);
}

export async function restPatch(
  path: string,
  data: Record<string, unknown>
): Promise<boolean> {
  return (await restPatchDetailed(path, data)).ok;
}

export async function restDelete(path: string): Promise<boolean> {
  const authError = requireSignedIn(path, 'DELETE');
  if (authError) {
    return false;
  }
  return (await deleteDataDetailed(path)).ok;
}

const PUSH_KEY_CHARS =
  '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

export function generateChildKey(): string {
  const bytes = new Uint8Array(20);
  fillRandomBytes(bytes);
  return Array.from(bytes, (byte) => PUSH_KEY_CHARS[byte % 64]).join('');
}

export async function restPushDetailed<T>(path: string, data: T): Promise<RestPushResult> {
  const authError = requireSignedIn(path, 'PUT');
  if (authError) {
    return authError;
  }
  return pushDataDetailed(path, data);
}

export async function restPush<T>(path: string, data: T): Promise<string | null> {
  const result = await restPushDetailed(path, data);
  return result.ok ? result.key : null;
}

/** Multi-path update from the database root. */
export async function restUpdatePaths(
  updates: Record<string, unknown>
): Promise<boolean> {
  return restPatch('', updates);
}
