import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { familyInputSchema, type FamilyInput } from "@/domain/schemas";
import { useCreateFamily } from "@/hooks/useCreateFamily";

type Errors = Partial<Record<keyof FamilyInput, string>>;

const EMPTY: FamilyInput = {
  name: "",
  notes: undefined,
};

export default function FamilyCreate() {
  const navigate = useNavigate();
  const { mutate: createFamily, isPending } = useCreateFamily();
  const [form, setForm] = useState<FamilyInput>({ ...EMPTY });
  const [errors, setErrors] = useState<Errors>({});

  function set<K extends keyof FamilyInput>(key: K, value: FamilyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
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
    if (!validate()) return;
    createFamily(
      { input: form },
      {
        onSuccess: () => {
          alert("Família criada com sucesso.");
          navigate("/families");
        },
        onError: () => alert("Não foi possível criar a família."),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Criar Família</h1>
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
