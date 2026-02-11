import {
    deleteData,
    pushData,
    readData,
    subscribeToData,
    updateData,
    writeData
} from '@/services/database';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to subscribe to real-time data at a path
 * Automatically subscribes on mount and unsubscribes on unmount
 */
const LOG = (path: string | null, msg: string, ...args: unknown[]) => {
  if (path === 'featureRequests') console.log('[FeatureRequests/useRealtimeData]', msg, ...args);
};

export function useRealtimeData<T>(path: string | null) {
  LOG(path, 'useRealtimeData: called with path=', path);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    LOG(path, 'useRealtimeData: effect run, path=', path);
    if (!path) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    LOG(path, 'useRealtimeData: calling subscribeToData for path=', path);

    const unsubscribe = subscribeToData<T>(
      path,
      (newData) => {
        try {
          LOG(path, 'useRealtimeData: subscription callback, hasData=', newData != null);
          setData(newData);
          setIsLoading(false);
        } catch (e) {
          if (path === 'featureRequests') console.error('[FeatureRequests/useRealtimeData] subscription callback threw', e);
          setData(null);
          setIsLoading(false);
        }
      },
      (err) => {
        if (path === 'featureRequests') console.error('[FeatureRequests/useRealtimeData] subscription error', err);
        setError(err);
        setIsLoading(false);
      }
    );

    LOG(path, 'useRealtimeData: subscribeToData returned, cleanup registered');
    return unsubscribe;
  }, [path]);

  return { data, isLoading, error };
}

/**
 * Hook to read data once (not real-time)
 */
export function useReadOnce<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await readData<T>(path);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook providing database mutation functions
 */
export function useDatabaseMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const write = useCallback(async <T>(path: string, data: T) => {
    setIsLoading(true);
    setError(null);
    try {
      await writeData(path, data);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const push = useCallback(async <T>(path: string, data: T) => {
    setIsLoading(true);
    setError(null);
    try {
      return await pushData(path, data);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (path: string, updates: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateData(path, updates);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteData(path);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { write, push, update, remove, isLoading, error };
}

