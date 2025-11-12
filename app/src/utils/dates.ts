// src/utils/dates.ts

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Aceita Date ou string ISO/`YYYY-MM-DD` e devolve `YYYY-MM-DD`. */
export function fmtYMD(d?: Date | string | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(+dt)) return "";
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

/** Aceita Date ou string ISO/`YYYY-MM-DD` e devolve `DD/MM/YYYY`. */
export function fmtDDMMYYYY(d?: Date | string | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(+dt)) return "";
  return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

/** Hoje em `YYYY-MM-DD`. */
export function todayYMD(): string {
  return fmtYMD(new Date());
}

/** Converte `YYYY-MM-DD` para Date (ou `undefined` se inválida). */
export function parseYMD(s?: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(+dt) ? undefined : dt;
}
