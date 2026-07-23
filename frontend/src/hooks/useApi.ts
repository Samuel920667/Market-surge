import { useState, useEffect, useCallback } from 'react';

export function useApi<T>(
  fn: () => Promise<T>,
  deps: any[] = []
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    fn()
      .then(d  => { setData(d); setLoading(false); })
      .catch(e => { setError(e?.response?.data?.detail || e.message || 'Error'); setLoading(false); });
  }, deps); // eslint-disable-line

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}
