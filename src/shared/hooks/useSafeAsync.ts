import { useCallback, useRef } from "react";

export const useSafeAsync = () => {
  const mounted = useRef(true);

  const markUnmounted = useCallback(() => {
    mounted.current = false;
  }, []);

  const runSafe = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      const result = await fn();
      if (!mounted.current) {
        return undefined;
      }
      return result;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }, []);

  return { runSafe, markUnmounted };
};
