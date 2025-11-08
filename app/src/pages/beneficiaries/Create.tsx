import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateBeneficiary } from "@/hooks/useCreateBeneficiary";
import { beneficiarySchema } from "@/domain/schemas";

type F = {
  studentNumber: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  curricularYear?: number | "";
  nif?: string;
  birthDate?: string; // yyyy-MM-dd
};

export default function CreateBeneficiary() {
  const navigate = useNavigate();

  const [form, setForm] = useState<F>({
    studentNumber: "",
    name: "",
    email: "",
    phone: "",
    course: "",
    curricularYear: "",
    nif: "",
    birthDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const createMut = useCreateBeneficiary();
  const set = <K extends keyof F,>(k: K, v: F[K]) => setForm(f => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = beneficiarySchema.safeParse({
      ...form,
      curricularYear: form.curricularYear === "" ? undefined : Number(form.curricularYear),
      birthDate: form.birthDate ? form.birthDate : undefined,
      nif: form.nif?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      course: form.course?.trim() || undefined,
    });

    if (!parsed.success) {
      const map: Record<string, string> = {};
      const flat = parsed.error.flatten().fieldErrors;
      for (const [k, msgs] of Object.entries(flat)) if (msgs?.[0]) map[k] = msgs[0];
      setErrors(map);
      return;
    }

    await createMut.mutateAsync(parsed.data);
    setShowSuccess(true); // abre modal de sucesso
    // (Não limpamos já o form; só depois de OK navega)
  }

  // Acessibilidade: Enter confirma, Esc também confirma (e navega)
  useEffect(() => {
    if (!showSuccess) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter" || ev.key === "Escape") {
        ev.preventDefault();
        goToList();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuccess]);

  function goToList() {
    setShowSuccess(false);
    navigate("/beneficiaries");
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

      {/* Modal de sucesso */}
      {showSuccess && (
        <Modal onClose={goToList} title="Sucesso">
          <p className="text-slate-600">Beneficiário criado com sucesso.</p>
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" onClick={goToList}>OK</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, error, children }:{label:string; error?:string; children:React.ReactNode}) {
  return (
    <label className="space-y-1">
      <div className="label">{label}</div>
      {children}
      {error && <div className="error">{error}</div>}
    </label>
  );
}

/** Modal genérico minimalista (usa as tuas util classes) */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        // fechar se clicar fora do card
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-[101] w-[min(92vw,520px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
