// src/components/ExportButtons.tsx
import React from "react";

type Row = Record<string, unknown>;

function downloadFile(
  data: BlobPart,
  filename: string,
  mime = "text/plain;charset=utf-8"
) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const needsQuotes = /[;"\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function safeGet(row: Row, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(row, key) ? row[key] : undefined;
}

function toCsv(rows: Row[]): string {
  if (!rows || rows.length === 0) return "";
  const headerSet = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);

  const lines: string[] = [];
  lines.push(headers.join(";"));

  for (const r of rows) {
    const line = headers.map((h) => escapeCsv(safeGet(r, h))).join(";");
    lines.push(line);
  }
  return lines.join("\r\n");
}

function toPrettyJson(rows: Row[]): string {
  return JSON.stringify(rows ?? [], null, 2);
}

export default function ExportButtons({
  rows,
  filename = "export",
}: {
  rows: Row[];
  filename?: string;
}) {
  const handleExportCSV = () => {
    const csv = toCsv(rows);
    if (!csv) return;
    downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8");
  };

  const handleExportJSON = () => {
    const json = toPrettyJson(rows);
    downloadFile(json, `${filename}.json`, "application/json;charset=utf-8");
  };

  return (
    <div className="flex gap-2">
      <button type="button" className="btn-secondary" onClick={handleExportCSV}>
        Exportar CSV
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={handleExportJSON}
      >
        Exportar JSON
      </button>
    </div>
  );
}
