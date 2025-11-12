// src/pages/items/Edit.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { itemInputSchema, type ItemInput, unitSchema } from "@/domain/schemas";
import { useItem } from "@/hooks/useItem";
import { useUpdateItem } from "@/hooks/useUpdateItem";
import { useFamilies } from "@/hooks/useFamilies";
import type { Id } from "@/lib/queryKeys";
import ItemLots from "./ItemLots";

type Errors = Partial<Record<keyof ItemInput, string>>;

export default function ItemEdit() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id: Id = params.id!;
  const { data, isLoading, error } = useItem(id, !!id);
  const { mutate: updateItem, isPending } = useUpdateItem();

  const fams = useFamilies({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });

  const [form, setForm] = useState<ItemInput | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [eanText, setEanText] = useState<string>("");

  useEffect(() => {
    if (data) {
      setForm({
        sku: data.sku,
        name: data.name,
        familyId: data.familyId,
        unit: data.unit,
        minStock: data.minStock ?? 0,
        eanCodes: data.eanCodes ?? [],
        stockCurrent: data.stockCurrent ?? 0,
        notes: data.notes,
        // NOVO: localização
        locationCode: data.locationCode ?? undefined,
      });
      setEanText((data.eanCodes ?? []).join(", "));
    }
  }, [data]);

  function set<K extends keyof ItemInput>(k: K, v: ItemInput[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  function normalizeEANs(txt: string): string[] | undefined {
    const arr = txt
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.length ? arr : undefined;
  }

  function validate(): boolean {
    if (!form) return false;
    const candidate: ItemInput = {
      ...form,
      eanCodes: normalizeEANs(eanText) ?? [],
    };
    const r = itemInputSchema.safeParse(candidate);
    if (r.success) {
      setErrors({});
      setForm(candidate);
      return true;
    }
    const e: Errors = {};
    for (const i of r.error.issues) {
      const k = i.path[0] as keyof ItemInput;
      if (k && !e[k]) e[k] = i.message;
    }
    setErrors(e);
    return false;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !validate()) return;
    updateItem(
      { id, patch: form },
      {
        onSuccess: () => {
          alert("Artigo atualizado com sucesso.");
          navigate("/items");
        },
        onError: () => alert("Não foi possível atualizar o artigo."),
      }
    );
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Artigo
          </h1>
          <Link to="/items" className="btn">
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
            Editar Artigo
          </h1>
          <Link to="/items" className="btn">
            Voltar
          </Link>
        </div>
        <div className="card p-6">Não foi possível carregar o artigo.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Editar Artigo</h1>
        <Link to="/items" className="btn">
          Voltar
        </Link>
      </div>

      {/* Form principal do Artigo */}
      <form className="card p-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">SKU *</label>
            <input
              className="input"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              aria-invalid={!!errors.sku}
              aria-describedby={errors.sku ? "err-sku" : undefined}
              required
            />
            {errors.sku && (
              <p id="err-sku" className="error">
                {errors.sku}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
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
            <label className="label">Família *</label>
            <select
              className="input"
              value={String(form.familyId)}
              onChange={(e) => set("familyId", e.target.value)}
              aria-invalid={!!errors.familyId}
              aria-describedby={errors.familyId ? "err-familyId" : undefined}
              required
            >
              <option value="">— selecione —</option>
              {(fams.data?.items ?? []).map((f) => (
                <option key={String(f.id)} value={String(f.id)}>
                  {f.name}
                </option>
              ))}
            </select>
            {errors.familyId && (
              <p id="err-familyId" className="error">
                {errors.familyId}
              </p>
            )}
          </div>

          <div>
            <label className="label">Unidade *</label>
            <select
              className="input"
              value={form.unit}
              onChange={(e) => set("unit", unitSchema.parse(e.target.value))}
              aria-invalid={!!errors.unit}
              aria-describedby={errors.unit ? "err-unit" : undefined}
              required
            >
              <option value="UNIT">Unidade</option>
              <option value="KG">KG</option>
              <option value="PACK">Pack</option>
              <option value="L">Litro</option>
            </select>
            {errors.unit && (
              <p id="err-unit" className="error">
                {errors.unit}
              </p>
            )}
          </div>

          {/* NOVO: Localização / Prateleira */}
          <div>
            <label className="label">Localização (prateleira)</label>
            <input
              className="input"
              value={form.locationCode ?? ""}
              onChange={(e) => set("locationCode", e.target.value)}
              placeholder="A1-03, Estante B / Prat. 2…"
            />
          </div>

          <div>
            <label className="label">Stock mínimo</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.minStock ?? 0}
              onChange={(e) => set("minStock", Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">EANs (separados por vírgulas)</label>
            <input
              className="input"
              value={eanText}
              onChange={(e) => setEanText(e.target.value)}
              placeholder="5601234567890, 5609876543217"
            />
          </div>

          <div>
            <label className="label">Stock atual (auto)</label>
            <input className="input" value={form.stockCurrent ?? 0} readOnly />
          </div>

          <div className="md:col-span-3">
            <label className="label">Notas</label>
            <textarea
              className="input"
              rows={3}
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
            onClick={() => navigate("/items")}
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Secção de Lotes */}
      <div className="card p-6">
        <ItemLots itemId={id} />
      </div>
    </div>
  );
}
