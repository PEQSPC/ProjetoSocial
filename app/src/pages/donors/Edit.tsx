// src/pages/donors/Edit.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  donorInputSchema,
  type DonorInput,
  donorTypeSchema,
} from "@/domain/schemas";
import { useDonor } from "@/hooks/useDonor";
import { useUpdateDonor } from "@/hooks/useUpdateDonor";
import type { Id } from "@/lib/queryKeys";

type Errors = Partial<Record<keyof DonorInput, string>>;

export default function DonorEdit() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id: Id | undefined = params.id;

  const { data, isLoading, error } = useDonor(id as Id, !!id);
  const { mutate: updateDonor, isPending } = useUpdateDonor();

  const [form, setForm] = useState<DonorInput | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (data) {
      setForm({
        type: data.type,
        name: data.name,
        email: data.email,
        nif: data.nif,
        address: data.address,
        postalCode: data.postalCode,
        notes: data.notes,
      });
    }
  }, [data]);

  function set<K extends keyof DonorInput>(k: K, v: DonorInput[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  function validate(): boolean {
    if (!form) return false;
    const r = donorInputSchema.safeParse(form);
    if (r.success) {
      setErrors({});
      return true;
    }
    const e: Errors = {};
    for (const i of r.error.issues) {
      const k = i.path[0] as keyof DonorInput;
      if (k && !e[k]) e[k] = i.message;
    }
    setErrors(e);
    return false;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !validate()) return;
    updateDonor(
      { id: id as Id, patch: form },
      {
        onSuccess: () => {
          alert("Doador atualizado com sucesso.");
          navigate("/donors");
        },
        onError: () => alert("Não foi possível atualizar o doador."),
      }
    );
  }

  if (!id) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Doador
          </h1>
          <Link to="/donors" className="btn">
            Voltar
          </Link>
        </div>
        <div className="card p-6">ID inválido.</div>
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Doador
          </h1>
          <Link to="/donors" className="btn">
            Voltar
          </Link>
        </div>
        <div className="card p-6">A carregar…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Doador
          </h1>
          <Link to="/donors" className="btn">
            Voltar
          </Link>
        </div>
        <div className="card p-6">Não foi possível carregar o doador.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Editar Doador</h1>
        <Link to="/donors" className="btn">
          Voltar
        </Link>
      </div>

      <form className="card p-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) =>
                set("type", donorTypeSchema.parse(e.target.value))
              }
            >
              <option value="PRIVATE">Privado</option>
              <option value="COMPANY">Empresa</option>
            </select>
          </div>

          <div>
            <label className="label">Nome *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "err-name" : undefined}
              required
            />
            {errors.name && (
              <p id="err-name" className="error">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div>
            <label className="label">NIF</label>
            <input
              className="input"
              value={form.nif ?? ""}
              onChange={(e) => set("nif", e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{9}"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Morada</label>
            <input
              className="input"
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Código Postal</label>
            <input
              className="input"
              value={form.postalCode ?? ""}
              onChange={(e) => set("postalCode", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Notas</label>
            <textarea
              className="input"
              rows={4}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "A guardar…" : "Guardar alterações"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/donors")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
