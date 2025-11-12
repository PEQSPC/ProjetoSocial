// src/utils/asArray.ts
export function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.rows)) return o.rows as T[];
    if (Array.isArray(o.data)) return o.data as T[];
  }
  return [];
}
