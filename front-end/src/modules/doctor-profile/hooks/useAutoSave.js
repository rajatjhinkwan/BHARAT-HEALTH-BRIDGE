import { useEffect, useRef, useCallback } from 'react';

export function useAutoSave(saveFn, data, { enabled = true, delay = 2000 } = {}) {
  const timerRef = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(data));

  const save = useCallback(async () => {
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;
    await saveFn(data);
    lastSavedRef.current = serialized;
  }, [data, saveFn]);

  useEffect(() => {
    if (!enabled) return undefined;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);
    return () => clearTimeout(timerRef.current);
  }, [data, enabled, delay, save]);

  return { flush: save };
}
