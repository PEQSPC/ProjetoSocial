// src/pages/items/Create.tsx
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { itemInputSchema, type ItemInput, unitSchema } from "@/domain/schemas";
import { useCreateItem } from "@/hooks/useCreateItem";
import { useFamilies } from "@/hooks/useFamilies";
import { useCreateStockLot } from "@/hooks/useCreateStockLot";
import { useDonors } from "@/hooks/useDonors";
import { Plus, Trash2 } from "lucide-react";

type Errors = Partial<Record<keyof ItemInput, string>>;

type LotDraft = {
  lot: string;
  entryDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  quantity: number;
  remainingQty: number;
  donorId?: string;
};

const EMPTY_ITEM: ItemInput = {
  sku: "",
  name: "",
  familyId: "",
  unit: "UNIT",
  minStock: 0,
  eanCodes: [],
  stockCurrent: 0,
  notes: undefined,
  // NOVO
  locationCode: undefined,
};

const EMPTY_LOT: LotDraft = {
  lot: "",
  entryDate: new Date().toISOString().slice(0, 10),
  expiryDate: undefined,
  quantity: 0,
  remainingQty: 0,
  donorId: undefined,
};

function daysUntil(date?: string): number | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(+d)) return undefined;
  const today = new Date();
  const t0 = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const t1 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((t1 - t0) / (1000 * 60 * 60 * 24));
}

function rowTone(entry?: string, expiry?: string) {
  if (!expiry) return "";
  const d = daysUntil(expiry);
  if (d === undefined) return "";
  if (d < 0) return "bg-red-50";
  if (d <= 30) return "bg-amber-50";
  // validade anterior à entrada → também assinalar em vermelho
  if (entry && new Date(expiry) < new Date(entry)) return "bg-red-50";
  return "";
}

export default function ItemCreate() {
  const navigate = useNavigate();
  const { mutateAsync: createItemAsync, isPending: creatingItem } =
    useCreateItem();
  const { mutateAsync: createLotAsync, isPending: creatingLot } =
    useCreateStockLot();
  const fams = useFamilies({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const donors = useDonors({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });

  const [form, setForm] = useState<ItemInput>({ ...EMPTY_ITEM });
  const [errors, setErrors] = useState<Errors>({});
  const [eanText, setEanText] = useState<string>("");
  const [lots, setLots] = useState<LotDraft[]>([]);

  const isBusy = creatingItem || creatingLot;

  function set<K extends keyof ItemInput>(k: K, v: ItemInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function normalizeEANs(txt: string): string[] | undefined {
    const arr = txt
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.length ? arr : undefined;
  }

  /** Validação do item base */
  function validateItem(): boolean {
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

  /** Validação de cada lote (Create) */
  function validateLots(): true | string {
    for (let idx = 0; idx < lots.length; idx++) {
      const l = lots[idx];
      // Quantidades coerentes
      if (l.quantity < 0 || l.remainingQty < 0) {
        return `Linha ${idx + 1}: quantidade/saldo não podem ser negativos.`;
      }
      if (l.remainingQty > l.quantity) {
        return `Linha ${
          idx + 1
        }: saldo do lote não pode exceder a quantidade de entrada.`;
      }
      // Datas coerentes
      if (l.expiryDate && new Date(l.expiryDate) < new Date(l.entryDate)) {
        return `Linha ${
          idx + 1
        }: a validade não pode ser anterior à data de entrada.`;
      }
    }
    return true;
  }

  function addLot() {
    setLots((arr) => [...arr, { ...EMPTY_LOT }]);
  }

  function removeLot(idx: number) {
    setLots((arr) => arr.filter((_, i) => i !== idx));
  }

  function updateLot<T extends keyof LotDraft>(
    idx: number,
    key: T,
    value: LotDraft[T]
  ) {
    setLots((arr) => {
      const copy = [...arr];
      const cur = { ...copy[idx], [key]: value };
      // se alterar quantity e o remaining estiver 0 ou igual à quantity atual, sincroniza
      if (
        key === "quantity" &&
        (copy[idx].remainingQty === 0 ||
          copy[idx].remainingQty === copy[idx].quantity)
      ) {
        cur.remainingQty = Number(value) || 0;
      }
      copy[idx] = cur;
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateItem()) return;

    // validação de lotes
    const lotCheck = validateLots();
    if (lotCheck !== true) {
      alert(lotCheck);
      return;
    }

    // stockCurrent inicial = soma dos remaining dos lotes (se houver)
    const initialStock = lots.reduce(
      (acc, l) => acc + (Number(l.remainingQty) || 0),
      0
    );
    const payload: ItemInput = { ...form, stockCurrent: initialStock };

    try {
      // 1) Cria o artigo
      const created = await createItemAsync({ input: payload });

      // 2) Cria lotes (se houver)
      if (lots.length > 0) {
        await Promise.all(
          lots.map((l) =>
            createLotAsync({
              input: {
                itemId: created.id,
                lot: l.lot,
                quantity: Number(l.quantity) || 0,
                remainingQty: Number(l.remainingQty) || 0,
                entryDate: l.entryDate,
                expiryDate: l.expiryDate || undefined,
                donorId: l.donorId && l.donorId !== "" ? l.donorId : undefined,
              },
            })
          )
        );
      }

      alert("Artigo criado com sucesso.");
      navigate("/items");
    } catch {
      alert("Não foi possível criar o artigo.");
    }
  }

  const donorsOptions = useMemo(
    () => donors.data?.items ?? [],
    [donors.data?.items]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Criar Artigo</h1>
        <Link to="/items" className="btn">
          Voltar
        </Link>
      </div>

      {/* Form principal */}
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

        {/* Lotes iniciais */}
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lotes iniciais (opcional)</h2>
            <button type="button" className="btn" onClick={addLot}>
              <Plus className="size-4" /> Adicionar lote
            </button>
          </div>

          {lots.length === 0 ? (
            <div className="text-sm text-slate-500">
              Sem lotes. Podes adicionar entradas de stock mais tarde no editar.
            </div>
          ) : (
            <div className="table-wrap">
              <div className="scroll relative">
                <table className="data">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
                    <tr>
                      <th className="th w-[14rem]">Lote *</th>
                      <th className="th w-[10rem]">Entrada *</th>
                      <th className="th w-[10rem]">Validade</th>
                      <th className="th w-[8rem]">Qtd *</th>
                      <th className="th w-[8rem]">Saldo *</th>
                      <th className="th w-[14rem]">Doador</th>
                      <th className="th w-[4rem] sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((l, idx) => {
                      const d = daysUntil(l.expiryDate);
                      const tone = rowTone(l.entryDate, l.expiryDate);
                      const badge = l.expiryDate ? (
                        d !== undefined && d < 0 ? (
                          <span className="badge bg-red-100 text-red-700">
                            Vencido
                          </span>
                        ) : d !== undefined && d <= 30 ? (
                          <span className="badge bg-amber-100 text-amber-700">
                            {d} dias
                          </span>
                        ) : null
                      ) : null;

                      const invalidDate = !!(
                        l.expiryDate &&
                        new Date(l.expiryDate) < new Date(l.entryDate)
                      );
                      const invalidQty =
                        l.quantity < 0 ||
                        l.remainingQty < 0 ||
                        l.remainingQty > l.quantity;

                      return (
                        <tr key={idx} className={`row ${tone}`}>
                          <td className="td">
                            <input
                              className="input"
                              value={l.lot}
                              onChange={(e) =>
                                updateLot(idx, "lot", e.target.value)
                              }
                              required
                            />
                          </td>
                          <td className="td">
                            <input
                              type="date"
                              className="input"
                              value={l.entryDate}
                              onChange={(e) =>
                                updateLot(idx, "entryDate", e.target.value)
                              }
                              required
                            />
                          </td>
                          <td className="td">
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                className={`input ${
                                  invalidDate ? "border-red-400" : ""
                                }`}
                                value={l.expiryDate ?? ""}
                                onChange={(e) =>
                                  updateLot(
                                    idx,
                                    "expiryDate",
                                    e.target.value || undefined
                                  )
                                }
                              />
                              {badge}
                            </div>
                            {invalidDate && (
                              <p className="text-xs text-red-600 mt-1">
                                Validade não pode ser anterior à entrada.
                              </p>
                            )}
                          </td>
                          <td className="td">
                            <input
                              type="number"
                              min={0}
                              className={`input ${
                                invalidQty ? "border-red-400" : ""
                              }`}
                              value={l.quantity}
                              onChange={(e) =>
                                updateLot(
                                  idx,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                              required
                            />
                          </td>
                          <td className="td">
                            <input
                              type="number"
                              min={0}
                              className={`input ${
                                invalidQty ? "border-red-400" : ""
                              }`}
                              value={l.remainingQty}
                              onChange={(e) =>
                                updateLot(
                                  idx,
                                  "remainingQty",
                                  Number(e.target.value)
                                )
                              }
                              required
                            />
                            {invalidQty && (
                              <p className="text-xs text-red-600 mt-1">
                                Saldo ≤ Quantidade e ambos sem negativos.
                              </p>
                            )}
                          </td>
                          <td className="td">
                            <select
                              className="input"
                              value={l.donorId ?? ""}
                              onChange={(e) =>
                                updateLot(
                                  idx,
                                  "donorId",
                                  e.target.value || undefined
                                )
                              }
                            >
                              <option value="">— sem doador —</option>
                              {donorsOptions.map((d) => (
                                <option key={String(d.id)} value={String(d.id)}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="td sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-10 text-right">
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => removeLot(idx)}
                              title="Remover"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-sm text-slate-500">
            Dica: o stock atual inicial será a soma do <em>Saldo</em> de cada
            lote.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary" disabled={isBusy}>
            {isBusy ? "A guardar…" : "Guardar"}
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
    </div>
  );
}
