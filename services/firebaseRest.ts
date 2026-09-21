import { getCurrentIdToken, getFirebaseAuth } from '@/services/firebaseAuth';
import { getFirebaseDatabaseUrl } from '@/services/firebaseDatabaseUrl';

function databaseUrl(path: string): string | null {
  const base = getFirebaseDatabaseUrl();
  if (!base) {
    return null;
  }
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed ? `${base}/${trimmed}.json` : `${base}/.json`;
}

async function authedRequest(
  path: string,
  init: RequestInit
): Promise<Response | null> {
  const currentUser = getFirebaseAuth().currentUser;
  const token = await getCurrentIdToken();
  const baseUrl = databaseUrl(path);
  if (!currentUser || !token || !baseUrl) {
    return null;
  }

  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}auth=${encodeURIComponent(token)}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function restGet<T>(path: string): Promise<T | null> {
  try {
    const response = await authedRequest(path, { method: 'GET' });
    if (!response?.ok) {
      return null;
    }
    return (await parseJson(response)) as T | null;
  } catch {
    return null;
  }
}

export async function restPut<T>(path: string, data: T): Promise<boolean> {
  try {
    const response = await authedRequest(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response?.ok === true;
  } catch {
    return false;
  }
}

export async function restPatch(
  path: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await authedRequest(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response?.ok === true;
  } catch {
    return false;
  }
}

export async function restDelete(path: string): Promise<boolean> {
  try {
    const response = await authedRequest(path, { method: 'DELETE' });
    return response?.ok === true;
  } catch {
    return false;
  }
}

export async function restPush<T>(path: string, data: T): Promise<string | null> {
  try {
    const response = await authedRequest(path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response?.ok) {
      return null;
    }
    const result = (await parseJson(response)) as { name?: string } | null;
    return typeof result?.name === 'string' ? result.name : null;
  } catch {
    return null;
  }
}

/** Multi-path update from the database root (Firebase REST PATCH). */
export async function restUpdatePaths(
  updates: Record<string, unknown>
): Promise<boolean> {
  return restPatch('', updates);
}
