import { useState, type ChangeEvent } from "react"
import { Link } from "react-router-dom"
import { useBeneficiaries } from "@/hooks/useBeneficiaries"
import type { Beneficiary } from "@/hooks/useBeneficiaries"
import { useDeleteBeneficiary } from "@/hooks/useDeleteBeneficiary"
import { DataTable, type Column } from "@/components/tables/DataTable"

export default function BeneficiariesList() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useBeneficiaries({ search, page, limit: 10 })
  const delMut = useDeleteBeneficiary()

  const rows: Beneficiary[] = data?.data ?? []
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value); setPage(1)
  }
  const onDelete = async (id: string) => {
    if (confirm("Eliminar este beneficiário?")) await delMut.mutateAsync(id)
  }

  const cols: Column<Beneficiary>[] = [
    { header: "Nº Aluno", accessor: (r) => r.studentNumber },
    { header: "Nome", accessor: (r) => r.name },
    { header: "Email", accessor: (r) => r.email },
    { header: "Curso", accessor: (r) => r.course ?? "—" },
    { header: "Contacto", accessor: (r) => r.phone ?? "—" },
    {
      header: "Ações",
      accessor: (r) => (
        <div className="flex justify-end gap-2">
          <Link to={`/beneficiaries/${r.id}/edit`} className="btn">Editar</Link>
          <button onClick={() => onDelete(r.id)} className="btn-danger">Eliminar</button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="toolbar">
        <input value={search} onChange={onSearch} placeholder="Pesquisar por nome…" className="input flex-1"/>
        <Link to="/beneficiaries/create" className="btn-primary">+ Criar</Link>
      </div>

      {isLoading ? (
        <div className="text-slate-500">A carregar…</div>
      ) : (
        <DataTable rows={rows} cols={cols} />
      )}

      <div className="flex items-center justify-between text-sm text-slate-500 px-1">
        <span>Total: {total}</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn disabled:opacity-60">Anterior</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="btn disabled:opacity-60">Seguinte</button>
        </div>
      </div>
    </div>
  )
}
