import { useCallback, useEffect, useState } from "react";

export function usePromise<T, A>(
  promiseFn: (...args: A[]) => Promise<T>,
  { variables, pause = false }: { variables: A[]; pause?: boolean }
): [{ data: T | null; loading: boolean; error: unknown | null }, () => void] {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      const data = await promiseFn(...variables);
      setData(data);
      setError(null);
      return data;
    } catch (e) {
      setError(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(variables)]);

  useEffect(() => {
    if (!pause) execute();
  }, [pause, JSON.stringify(variables)]);

  return [{ data, loading, error }, execute];
}
