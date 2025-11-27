import { useState, useEffect } from 'react';
import { initDB } from '@/lib/db';

interface UseDBReturn {
  isReady: boolean;
  error: string | null;
}

/**
 * Hook to initialize and check database readiness
 * Use this in the root component to ensure DB is ready before rendering
 */
export function useDB(): UseDBReturn {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        await initDB();
        setIsReady(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize database';
        setError(errorMessage);
        console.error('Database initialization error:', err);
      }
    }

    initialize();
  }, []);

  return { isReady, error };
}

