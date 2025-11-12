import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { familyInputSchema, type FamilyInput } from "@/domain/schemas";
import { useFamily } from "@/hooks/useFamily";
import { useUpdateFamily } from "@/hooks/useUpdateFamily";
import type { Id } from "@/lib/queryKeys";

type Errors = Partial<Record<keyof FamilyInput, string>>;

export default function FamilyEdit() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id: Id = params.id!;
  const { data, isLoading, error } = useFamily(id, !!id);
  const { mutate: updateFamily, isPending } = useUpdateFamily();

  const [form, setForm] = useState<FamilyInput | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (data) {
      setForm({ name: data.name, notes: data.notes });
    }
  }, [data]);

  function set<K extends keyof FamilyInput>(key: K, value: FamilyInput[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function validate(): boolean {
    if (!form) return false;
    const res = familyInputSchema.safeParse(form);
    if (res.success) {
      setErrors({});
      return true;
    }
    const err: Errors = {};
    for (const issue of res.error.issues) {
      const k = issue.path[0] as keyof FamilyInput | undefined;
      if (k && !err[k]) err[k] = issue.message;
    }
    setErrors(err);
    return false;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !validate()) return;
    updateFamily(
      { id, patch: form },
      {
        onSuccess: () => {
          alert("Família atualizada com sucesso.");
          navigate("/families");
        },
        onError: () => alert("Não foi possível atualizar a família."),
      }
    );
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Família
          </h1>
          <Link to="/families" className="btn">
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
            Editar Família
          </h1>
          <Link to="/families" className="btn">
            Voltar
          </Link>
        </div>
        <div className="card p-6">Não foi possível carregar a família.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar Família
        </h1>
        <Link to="/families" className="btn">
          Voltar
        </Link>
      </div>

      <form className="card p-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
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

          <div className="md:col-span-2">
            <label className="label">Notas</label>
            <textarea
              className="input"
              rows={4}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? "err-notes" : undefined}
              placeholder="Observações (opcional)"
            />
            {errors.notes && (
              <p id="err-notes" className="error">
                {errors.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "A guardar…" : "Guardar"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/families")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
