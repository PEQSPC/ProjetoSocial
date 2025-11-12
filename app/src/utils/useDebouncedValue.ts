// src/utils/useDebouncedValue.ts
import { useEffect, useState } from "react";

/** Hook simples para “debounce” de um valor. */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
