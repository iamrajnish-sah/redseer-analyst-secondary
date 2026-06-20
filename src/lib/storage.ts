import { useEffect, useState } from "react";

const PREFIX = "ii_v1::";

export function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => loadLS(key, initial));
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setState(loadLS(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (hydrated) saveLS(key, state);
  }, [key, state, hydrated]);
  return [state, setState] as const;
}
