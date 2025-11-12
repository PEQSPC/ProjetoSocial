import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCreateStockCount } from "@/hooks/useCreateStockCount";

export default function StockCountCreate() {
  const navigate = useNavigate();
  const { mutate: createCount, isPending } = useCreateStockCount();

  const [name, setName] = useState("");
  const [filtersText, setFiltersText] = useState<string>("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let filters: Record<string, unknown> | undefined = undefined;
    if (filtersText.trim()) {
      try {
        filters = JSON.parse(filtersText);
      } catch {
        alert("JSON de filtros inválido.");
        return;
      }
    }
    createCount(
      { input: { name, status: "OPEN", filters } },
      {
        onSuccess: (c) => {
          alert("Contagem criada.");
          navigate(`/inventory/counts/${String(c.id)}`);
        },
        onError: () => alert("Não foi possível criar a contagem."),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Nova Contagem</h1>
        <Link to="/inventory/counts" className="btn">
          Voltar
        </Link>
      </div>

      <form className="card p-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Filtros (JSON opcional)</label>
            <textarea
              className="input"
              rows={4}
              placeholder={`Ex.: {"familyId":"...","onlyBelowMin":true}`}
              value={filtersText}
              onChange={(e) => setFiltersText(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              (Opcional) Guarda critérios para documentar como geraste as
              linhas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-primary" type="submit" disabled={isPending}>
            {isPending ? "A criar…" : "Criar"}
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => navigate("/inventory/counts")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
