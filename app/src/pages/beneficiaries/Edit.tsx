import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBeneficiary } from "@/hooks/useBeneficiary";
import { useUpdateBeneficiary } from "@/hooks/useUpdateBeneficiary";
import { beneficiarySchema } from "@/domain/schemas";

/** Form local — igual ao Create, mas tudo opcional (para editar parcialmente) */
type F = {
  studentNumber?: string;
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  curricularYear?: number | "";
  nif?: string;
  birthDate?: string; // yyyy-MM-dd (value do <input type="date">)
};

function toInputDate(d?: string) {
  // aceita 'YYYY-MM-DD' ou ISO e devolve sempre 'YYYY-MM-DD'
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const iso = new Date(d);
  if (isNaN(+iso)) return "";
  // fuso pode deslocar; usar getUTC* para consistência
  const y = iso.getUTCFullYear();
  const m = String(iso.getUTCMonth() + 1).padStart(2, "0");
  const day = String(iso.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditBeneficiary() {
  const { id = "" } = useParams();
  const nav = useNavigate();

  const { data: current, isLoading } = useBeneficiary(id);
  const updateMut = useUpdateBeneficiary(id);

  const initial: F = useMemo(
    () => ({
      studentNumber: current?.studentNumber ?? "",
      name: current?.name ?? "",
      email: current?.email ?? "",
      phone: current?.phone ?? "",
      course: current?.course ?? "",
      curricularYear: current?.curricularYear ?? "",
      nif: current?.nif ?? "",
      birthDate: toInputDate(current?.birthDate),
    }),
    [current]
  );

  const [form, setForm] = useState<F>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // sincroniza o formulário quando “current” chegar
  useEffect(() => {
    if (!isLoading && current) setForm(initial);
  }, [isLoading, current, initial]);

  function set<K extends keyof F>(k: K, v: F[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = beneficiarySchema.partial().safeParse({
      ...form,
      curricularYear:
        form.curricularYear === "" ? undefined : Number(form.curricularYear),
      birthDate: form.birthDate ? form.birthDate : undefined, // yyyy-MM-dd
      nif: form.nif?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      course: form.course?.trim() || undefined,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const map: Record<string, string> = {};
      for (const [k, msgs] of Object.entries(flat))
        if (msgs?.[0]) map[k] = msgs[0];
      setErrors(map);
      return;
    }

    await updateMut.mutateAsync(parsed.data);
    setShowSuccess(true);
  }

  if (isLoading) return <div className="p-6 text-slate-400">A carregar…</div>;

  return (
    <div className="card p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        Editar Beneficiário
      </h1>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        <Field label="Nº Aluno" error={errors.studentNumber}>
          <input
            className="input"
            value={form.studentNumber ?? ""}
            onChange={(e) => set("studentNumber", e.target.value)}
          />
        </Field>

        <Field label="Nome" error={errors.name}>
          <input
            className="input"
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>

        <Field label="NIF" error={errors.nif}>
          <input
            className="input"
            inputMode="numeric"
            value={form.nif ?? ""}
            onChange={(e) => set("nif", e.target.value)}
          />
        </Field>

        <Field label="Data Nascimento" error={errors.birthDate}>
          <input
            className="input"
            type="date"
            value={form.birthDate ?? ""}
            onChange={(e) => set("birthDate", e.target.value)}
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            className="input"
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>

        <Field label="Contacto" error={errors.phone}>
          <input
            className="input"
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>

        <Field label="Curso" error={errors.course}>
          <input
            className="input"
            value={form.course ?? ""}
            onChange={(e) => set("course", e.target.value)}
          />
        </Field>

        <Field label="Ano Curricular" error={errors.curricularYear}>
          <input
            className="input"
            type="number"
            min={1}
            value={form.curricularYear ?? ""}
            onChange={(e) =>
              set(
                "curricularYear",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </Field>

        <div className="md:col-span-2 flex gap-2 pt-2">
          <button
            className="btn-primary"
            disabled={updateMut.isPending}
            type="submit"
          >
            {updateMut.isPending ? "A guardar…" : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancelar
          </button>
        </div>
      </form>

      {showSuccess && (
        <SuccessModal
          title="Alterações guardadas"
          message="O beneficiário foi atualizado com sucesso."
          onOk={() => nav("/beneficiaries")}
        />
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: React.PropsWithChildren<{ label: string; error?: string }>) {
  return (
    <label className="space-y-1">
      <div className="label">{label}</div>
      {children}
      {error && <div className="error">{error}</div>}
    </label>
  );
}

/** Modal simples igual ao usado no Create (UI utilitária) */
function SuccessModal({
  title,
  message,
  onOk,
}: {
  title: string;
  message: string;
  onOk: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary" onClick={onOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
