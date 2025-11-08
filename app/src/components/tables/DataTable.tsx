import React from "react"

export type Column<T> = {
  header: string
  accessor: (row: T) => React.ReactNode
  className?: string
}
export function DataTable<T>({ rows, cols }: { rows: T[]; cols: Column<T>[] }) {
  return (
    <div className="table-wrap">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-white">
            {cols.map((c, i) => (
              <th key={i} className={`th px-4 py-3 ${i === 0 ? "rounded-tl-2xl" : ""} ${i === cols.length-1 ? "rounded-tr-2xl" : ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="row">
              {cols.map((c, ci) => (
                <td key={ci} className={`td px-4 py-3 ${c.className ?? ""}`}>{c.accessor(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
