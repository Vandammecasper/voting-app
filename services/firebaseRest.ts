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

async function authHeaders(): Promise<HeadersInit | null> {
  const currentUser = getFirebaseAuth().currentUser;
  const token = await getCurrentIdToken();
  if (!currentUser || !token) {
    return null;
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
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
    const headers = await authHeaders();
    const url = databaseUrl(path);
    if (!headers || !url) {
      return null;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return null;
    }
    return (await parseJson(response)) as T | null;
  } catch {
    return null;
  }
}

export async function restPut<T>(path: string, data: T): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const url = databaseUrl(path);
    if (!headers || !url) {
      return false;
    }
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function restPatch(
  path: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const url = databaseUrl(path);
    if (!headers || !url) {
      return false;
    }
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function restDelete(path: string): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const url = databaseUrl(path);
    if (!headers || !url) {
      return false;
    }
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function restPush<T>(path: string, data: T): Promise<string | null> {
  try {
    const headers = await authHeaders();
    const url = databaseUrl(path);
    if (!headers || !url) {
      return null;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
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
