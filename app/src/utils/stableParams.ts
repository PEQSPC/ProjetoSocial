// src/utils/stableParams.ts
import { useMemo } from "react";

export function useStableParams<T extends Record<string, unknown>>(
  p?: T
): T | undefined {
  // stringify ordenado → estável
  return useMemo(
    () => (p ? (JSON.parse(JSON.stringify(p)) as T) : undefined),
    [JSON.stringify(p ?? {})]
  );
}
