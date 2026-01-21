import { useEffect, useState, useCallback } from 'react';
import { 
  writeData, 
  readData, 
  pushData, 
  updateData, 
  deleteData, 
  subscribeToData 
} from '@/services/database';

/**
 * Hook to subscribe to real-time data at a path
 * Automatically subscribes on mount and unsubscribes on unmount
 */
export function useRealtimeData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToData<T>(
      path,
      (newData) => {
        setData(newData);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

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

