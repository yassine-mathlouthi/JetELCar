import { useEffect, useState } from "react";
export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved) as T;
    } catch {
      /* Storage unavailable: use memory. */
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private mode/quota: keep working in memory. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
