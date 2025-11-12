import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  donorInputSchema,
  type DonorInput,
  donorTypeSchema,
} from "@/domain/schemas";
import { useCreateDonor } from "@/hooks/useCreateDonor";

type Errors = Partial<Record<keyof DonorInput, string>>;
const EMPTY: DonorInput = {
  type: "PRIVATE",
  name: "",
  email: undefined,
  nif: undefined,
  address: undefined,
  postalCode: undefined,
  notes: undefined,
};

export default function DonorCreate() {
  const navigate = useNavigate();
  const { mutate: createDonor, isPending } = useCreateDonor();
  const [form, setForm] = useState<DonorInput>({ ...EMPTY });
  const [errors, setErrors] = useState<Errors>({});

  function set<K extends keyof DonorInput>(k: K, v: DonorInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate(): boolean {
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
    if (!validate()) return;
    createDonor(
      { input: form },
      {
        onSuccess: () => {
          alert("Doador criado com sucesso.");
          navigate("/donors");
        },
        onError: () => alert("Não foi possível criar o doador."),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Criar Doador</h1>
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
            {isPending ? "A guardar…" : "Guardar"}
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
