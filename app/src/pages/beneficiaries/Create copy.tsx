import { useState } from "react"
import { useCreateBeneficiary } from "@/hooks/useCreateBeneficiary"
import { beneficiarySchema } from "@/domain/schemas"

type F = {
  studentNumber: string
  name: string
  email: string
  phone?: string
  course?: string
  curricularYear?: number | ""
  nif?: string
  birthDate?: string   // yyyy-MM-dd
}

export default function CreateBeneficiary() {
  const [form, setForm] = useState<F>({
    studentNumber: "",
    name: "",
    email: "",
    phone: "",
    course: "",
    curricularYear: "",
    nif: "",
    birthDate: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const createMut = useCreateBeneficiary()
  const set = <K extends keyof F,>(k: K, v: F[K]) => setForm(f => ({ ...f, [k]: v }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const parsed = beneficiarySchema.safeParse({
      ...form,
      curricularYear: form.curricularYear === "" ? undefined : Number(form.curricularYear),
      birthDate: form.birthDate ? form.birthDate : undefined, // já vem yyyy-MM-dd
      nif: form.nif?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      course: form.course?.trim() || undefined,
    })

    if (!parsed.success) {
      const map: Record<string, string> = {}
      const flat = parsed.error.flatten().fieldErrors
      for (const [k, msgs] of Object.entries(flat)) {
        if (msgs?.[0]) map[k] = msgs[0]
      }
      setErrors(map)
      return
    }

    await createMut.mutateAsync(parsed.data)
    alert("Beneficiário criado!")
    setForm({
      studentNumber: "",
      name: "",
      email: "",
      phone: "",
      course: "",
      curricularYear: "",
      nif: "",
      birthDate: "",
    })
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Criar Beneficiário</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Nº Aluno" error={errors.studentNumber}>
          <input className="input" value={form.studentNumber} onChange={(e)=>set("studentNumber", e.target.value)} />
        </Field>

        <Field label="Nome" error={errors.name}>
          <input className="input" value={form.name} onChange={(e)=>set("name", e.target.value)} />
        </Field>

        <Field label="NIF" error={errors.nif}>
          <input className="input" inputMode="numeric" value={form.nif ?? ""} onChange={(e)=>set("nif", e.target.value)} />
        </Field>

        <Field label="Data Nascimento" error={errors.birthDate}>
          <input className="input" type="date" value={form.birthDate ?? ""} onChange={(e)=>set("birthDate", e.target.value)} />
        </Field>

        <Field label="Email" error={errors.email}>
          <input className="input" value={form.email} onChange={(e)=>set("email", e.target.value)} />
        </Field>

        <Field label="Contacto" error={errors.phone}>
          <input className="input" value={form.phone ?? ""} onChange={(e)=>set("phone", e.target.value)} />
        </Field>

        <Field label="Curso" error={errors.course}>
          <input className="input" value={form.course ?? ""} onChange={(e)=>set("course", e.target.value)} />
        </Field>

        <Field label="Ano Curricular" error={errors.curricularYear}>
          <input
            className="input"
            type="number"
            min={1}
            value={form.curricularYear ?? ""}
            onChange={(e)=>set("curricularYear", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </Field>

        <div className="md:col-span-2 flex gap-2 pt-2">
          <button className="btn-primary" disabled={createMut.isPending} type="submit">
            {createMut.isPending ? "A guardar…" : "Guardar"}
          </button>
          <a href="/beneficiaries" className="btn">Cancelar</a>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }:{label:string; error?:string; children:React.ReactNode}) {
  return (
    <label className="space-y-1">
      <div className="label">{label}</div>
      {children}
      {error && <div className="error">{error}</div>}
    </label>
  )
}
