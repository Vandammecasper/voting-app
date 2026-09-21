import { getCurrentIdToken, getFirebaseAuth } from '@/services/firebaseAuth';
import { getFirebaseDatabaseUrl } from '@/services/firebaseDatabaseUrl';
import { fillRandomBytes } from '@/services/randomBytes';

export type RestFailure = {
  ok: false;
  path: string;
  method: string;
  status: number | null;
  error: string;
};

export type RestWriteSuccess = { ok: true };
export type RestWriteResult = RestWriteSuccess | RestFailure;
export type RestPushResult = { ok: true; key: string } | RestFailure;
export type RestGetResult<T> =
  | { ok: true; data: T | null }
  | RestFailure;

function databaseUrl(path: string): string | null {
  const base = getFirebaseDatabaseUrl();
  if (!base) {
    return null;
  }
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed ? `${base}/${trimmed}.json` : `${base}/.json`;
}

function firebaseErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === 'string' && err.trim()) {
      return err;
    }
    if (
      err &&
      typeof err === 'object' &&
      'message' in err &&
      typeof (err as { message: unknown }).message === 'string'
    ) {
      return (err as { message: string }).message;
    }
  }
  return fallback;
}

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

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function prepareRequest(
  path: string,
  method: string
): Promise<{ url: string; token: string } | RestFailure> {
  const currentUser = getFirebaseAuth().currentUser;
  if (!currentUser) {
    return { ok: false, path, method, status: null, error: 'Not signed in' };
  }

  const token = await getCurrentIdToken();
  if (!token) {
    return { ok: false, path, method, status: null, error: 'Missing auth token' };
  }

  const baseUrl = databaseUrl(path);
  if (!baseUrl) {
    return {
      ok: false,
      path,
      method,
      status: null,
      error: 'Database URL is not configured',
    };
  }

  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}auth=${encodeURIComponent(token)}`;
  return { url, token };
}

async function authedRequest(
  path: string,
  init: RequestInit
): Promise<{ response: Response; token: string } | RestFailure> {
  const method = init.method ?? 'GET';
  try {
    const prepared = await prepareRequest(path, method);
    if ('ok' in prepared && prepared.ok === false) {
      return prepared;
    }

    const response = await fetch(prepared.url, {
      ...init,
      headers: {
        Authorization: `Bearer ${prepared.token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    return { response, token: prepared.token };
  } catch (error) {
    return {
      ok: false,
      path,
      method,
      status: null,
      error: isTransientFetchError(error)
        ? 'Request was cancelled'
        : formatCaughtError(error),
    };
  }
}

export async function restGetDetailed<T>(path: string): Promise<RestGetResult<T>> {
  const result = await authedRequest(path, { method: 'GET' });
  if ('ok' in result && result.ok === false) {
    return result;
  }

  const body = await parseJson(result.response);
  if (!result.response.ok) {
    return {
      ok: false,
      path,
      method: 'GET',
      status: result.response.status,
      error: firebaseErrorMessage(body, result.response.statusText || 'Request failed'),
    };
  }

  return { ok: true, data: body as T | null };
}

export async function restGet<T>(path: string): Promise<T | null> {
  const result = await restGetDetailed<T>(path);
  if (!result.ok) {
    return null;
  }
  return result.data;
}

export async function restPutDetailed<T>(path: string, data: T): Promise<RestWriteResult> {
  const result = await authedRequest(path, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if ('ok' in result && result.ok === false) {
    return result;
  }

  const body = await parseJson(result.response);
  if (!result.response.ok) {
    return {
      ok: false,
      path,
      method: 'PUT',
      status: result.response.status,
      error: firebaseErrorMessage(body, result.response.statusText || 'Request failed'),
    };
  }

  return { ok: true };
}

export async function restPut<T>(path: string, data: T): Promise<boolean> {
  return (await restPutDetailed(path, data)).ok;
}

async function patchWithSdkFallback(
  path: string,
  data: Record<string, unknown>,
  restFailure: RestFailure
): Promise<RestWriteResult> {
  try {
    const { updateData } = await import('@/services/database');
    await updateData(path, data);
    return { ok: true };
  } catch (error) {
    return {
      ...restFailure,
      error: `${restFailure.error}\nSDK: ${formatCaughtError(error)}`,
    };
  }
}

export async function restPatchDetailed(
  path: string,
  data: Record<string, unknown>
): Promise<RestWriteResult> {
  const result = await authedRequest(path, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if ('ok' in result && result.ok === false) {
    return patchWithSdkFallback(path, data, result);
  }

  const body = await parseJson(result.response);
  if (!result.response.ok) {
    return patchWithSdkFallback(path, data, {
      ok: false,
      path,
      method: 'PATCH',
      status: result.response.status,
      error: firebaseErrorMessage(body, result.response.statusText || 'Request failed'),
    });
  }

  return { ok: true };
}

export async function restPatch(
  path: string,
  data: Record<string, unknown>
): Promise<boolean> {
  return (await restPatchDetailed(path, data)).ok;
}

export async function restDelete(path: string): Promise<boolean> {
  const result = await authedRequest(path, { method: 'DELETE' });
  if ('ok' in result && result.ok === false) {
    return false;
  }
  return result.response.ok;
}

const PUSH_KEY_CHARS =
  '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

export function generateChildKey(): string {
  const bytes = new Uint8Array(20);
  fillRandomBytes(bytes);
  return Array.from(bytes, (byte) => PUSH_KEY_CHARS[byte % 64]).join('');
}

export async function restPushDetailed<T>(path: string, data: T): Promise<RestPushResult> {
  try {
    const key = generateChildKey();
    const written = await restPutDetailed(`${path}/${key}`, data);
    if (!written.ok) {
      return written;
    }
    return { ok: true, key };
  } catch (error) {
    return {
      ok: false,
      path,
      method: 'PUT',
      status: null,
      error: formatCaughtError(error),
    };
  }
}

export async function restPush<T>(path: string, data: T): Promise<string | null> {
  const result = await restPushDetailed(path, data);
  return result.ok ? result.key : null;
}

/** Multi-path update from the database root (Firebase REST PATCH). */
export async function restUpdatePaths(
  updates: Record<string, unknown>
): Promise<boolean> {
  return restPatch('', updates);
}
