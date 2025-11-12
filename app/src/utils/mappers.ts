// src/utils/mappers.ts
import type { Id } from "@/lib/queryKeys";

/** Converte qualquer coisa em array tipado (ou []). */
function asArray<T>(rows: unknown): ReadonlyArray<T> {
  return Array.isArray(rows) ? (rows as ReadonlyArray<T>) : [];
}

/** Cria um mapa { [id]: row } de forma segura (aceita undefined/null/objeto). */
export function mapById<T extends { id: Id }>(
  rows: unknown
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const r of asArray<T>(rows)) {
    out[String(r.id)] = r;
  }
  return out;
}

/** Lê um valor do mapa por id (aceita undefined/null). */
export function pickById<T>(
  map: Record<string, T> | undefined,
  id: Id | null | undefined
): T | undefined {
  if (!map || id === null || id === undefined) return undefined;
  return map[String(id)];
}
