import { subscribeToData } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Focus-scoped realtime database subscription.
 * Kept export name for existing screens; no longer polls REST with auth= URLs.
 */
export function usePolledRestData<T>(path: string | null, _intervalMs: number = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!path) {
        setData(null);
        setIsLoading(false);
        return;
      }

      let isMounted = true;
      setIsLoading(true);

      const unsubscribe = subscribeToData<T>(
        path,
        (value) => {
          if (!isMounted) {
            return;
          }
          setData(value);
          setIsLoading(false);
        },
        () => {
          if (!isMounted) {
            return;
          }
          setData(null);
          setIsLoading(false);
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }, [path])
  );

  return { data, isLoading };
}
