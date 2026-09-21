import { restGet } from '@/services/firebaseRest';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function usePolledRestData<T>(path: string | null, intervalMs: number = 2000) {
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

      const fetchData = async () => {
        const result = await restGet<T>(path);
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      };

      void fetchData();
      const interval = setInterval(() => {
        void fetchData();
      }, intervalMs);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }, [path, intervalMs])
  );

  return { data, isLoading };
}
