import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Search, PencilLine, Trash2 } from "lucide-react"
import { useBeneficiaries, type Beneficiary } from "@/hooks/useBeneficiaries"
import { api } from "@/lib/api"

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("")
}

function YearBadge({ year }: { year?: number }) {
  if (!year) return null
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {year}º ano
    </span>
  )
}

export default function BeneficiariesList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading } = useBeneficiaries({ search, page, limit })
  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // reset página quando pesquisa muda
  useEffect(() => { setPage(1) }, [search])

  const handleDelete = async (b: Beneficiary) => {
    if (!confirm(`Eliminar beneficiário ${b.name}?`)) return
    await api.delete(`/beneficiaries/${b.id}`)
    // força refetch simples: mexe no state da pesquisa
    setSearch(s => s + "")
  }

  const header = useMemo(() => (
    <div className="toolbar justify-between mb-4">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, email, nº aluno…"
          className="input pl-9"
        />
      </div>
      <Link to="/beneficiaries/create" className="btn-primary">
        <Plus className="size-4" /> Criar
      </Link>
    </div>
  ), [search])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Beneficiários</h1>
      {header}

      <div className="table-wrap overflow-hidden">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[120px]">Nº Aluno</th>
                <th className="th min-w-[260px]">Nome</th>
                <th className="th min-w-[220px]">Email</th>
                <th className="th min-w-[200px]">Curso</th>
                <th className="th w-[140px]">Contacto</th>
                <th className="th w-[110px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="td py-10 text-center text-slate-500" colSpan={6}>A carregar…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="td py-14 text-center text-slate-500" colSpan={6}>Sem resultados</td></tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="row hover:bg-slate-50/60">
                    <td className="td font-medium text-slate-700">{b.studentNumber}</td>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 text-slate-700 grid place-items-center font-semibold">
                          {initials(b.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{b.name}</div>
                          {/* email secundário aqui para celular não “partir” layout da coluna de email */}
                          <div className="truncate text-xs text-slate-500 sm:hidden">{b.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td hidden sm:table-cell">
                      <a href={`mailto:${b.email}`} className="underline decoration-slate-300 hover:decoration-slate-500">
                        {b.email}
                      </a>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{b.course ?? "—"}</span>
                        <YearBadge year={b.curricularYear} />
                      </div>
                    </td>
                    <td className="td">{b.phone ?? "—"}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <button
                          className="btn"
                          onClick={() => navigate(`/beneficiaries/${b.id}/edit`)}
                          title="Editar"
                        >
                          <PencilLine className="size-4" />
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(b)}
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* footer da tabela */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-sm text-slate-500">Total: {total}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="btn disabled:opacity-50"
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
