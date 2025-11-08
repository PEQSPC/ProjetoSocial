import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
//import { useBeneficiary } from "@/hooks/useBeneficiary"
import { useUpdateBeneficiary } from "@/hooks/useUpdateBeneficiary"
import { beneficiarySchema } from "@/domain/schemas"

type F = {
  studentNumber?: string
  name?: string
  email?: string
  phone?: string
  course?: string
  curricularYear?: number | ""
}

export default function EditBeneficiary() {
  const { id = "" } = useParams()
  const nav = useNavigate()

  const { data: current, isLoading } = useBeneficiary(id)
  const updateMut = useUpdateBeneficiary(id)

  const initial: F = useMemo(() => ({
    studentNumber: current?.studentNumber ?? "",
    name: current?.name ?? "",
    email: current?.email ?? "",
    phone: current?.phone ?? "",
    course: current?.course ?? "",
    curricularYear: current?.curricularYear ?? "",
  }), [current])

  const [form, setForm] = useState<F>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // sincronizar quando o fetch terminar
  // (evita formulário vazio antes de carregar)
  if (!isLoading && form.name === "" && current?.name) {
    // set apenas 1 vez
    setForm(initial)
  }

  function set<K extends keyof F>(k: K, v: F[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const parsed = beneficiarySchema.partial().safeParse({
      ...form,
      curricularYear: form.curricularYear === "" ? undefined : Number(form.curricularYear),
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const map: Record<string, string> = {}
      for (const [k, msgs] of Object.entries(fieldErrors)) {
        if (msgs && msgs.length) map[k] = msgs[0]!
      }
      setErrors(map)
      return
    }

    await updateMut.mutateAsync(parsed.data)
    alert("Alterações guardadas!")
    nav("/beneficiaries")
  }

  if (isLoading) return <div className="p-6 text-slate-400">A carregar…</div>

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Editar Beneficiário</h1>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
        <Field label="Nº Aluno" error={errors.studentNumber}>
          <input className="inp" value={form.studentNumber ?? ""} onChange={(e)=>set("studentNumber", e.target.value)} />
        </Field>
        <Field label="Nome" error={errors.name}>
          <input className="inp" value={form.name ?? ""} onChange={(e)=>set("name", e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className="inp" value={form.email ?? ""} onChange={(e)=>set("email", e.target.value)} />
        </Field>
        <Field label="Contacto">
          <input className="inp" value={form.phone ?? ""} onChange={(e)=>set("phone", e.target.value)} />
        </Field>
        <Field label="Curso">
          <input className="inp" value={form.course ?? ""} onChange={(e)=>set("course", e.target.value)} />
        </Field>
        <Field label="Ano Curricular">
          <input className="inp" type="number" value={form.curricularYear ?? ""} onChange={(e)=>set("curricularYear", e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>

        <div className="md:col-span-2 mt-2 flex gap-2">
          <button disabled={updateMut.isPending} className="btn-primary" type="submit">
            {updateMut.isPending ? "A guardar..." : "Guardar"}
          </button>
          <button type="button" className="btn-ghost" onClick={()=>nav(-1)}>Cancelar</button>
        </div>
      </form>

      <style>{`
        .inp { @apply w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 outline-none; }
        .btn-primary { @apply px-4 py-2 rounded-lg bg-slate-200 text-slate-900 font-medium hover:bg-white transition; }
        .btn-ghost { @apply px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-900/50 transition; }
        .lbl { @apply text-sm text-slate-300; }
        .err { @apply text-xs text-red-400; }
      `}</style>
    </div>
  )
}

function Field({ label, error, children }: React.PropsWithChildren<{ label: string; error?: string }>) {
  return (
    <label className="block space-y-1">
      <div className="lbl">{label}</div>
      {children}
      {error && <div className="err">{error}</div>}
    </label>
  )
}
