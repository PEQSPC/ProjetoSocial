import { useCallback, useState } from "react";

export function useBoolean(initial = false) {
  const [value, set] = useState<boolean>(initial);
  const on = useCallback(() => set(true), []);
  const off = useCallback(() => set(false), []);
  const toggle = useCallback(() => set((v) => !v), []);
  return { value, on, off, toggle, set };
}
