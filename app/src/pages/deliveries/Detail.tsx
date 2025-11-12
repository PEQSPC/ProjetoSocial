import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  useDeliveryDetail,
  useDeliveryLines,
  useConfirmDelivery,
} from "@/hooks/useDeliveries";
import type { DeliveryLine } from "@/adapters/deliveryLines";

/* ---- tipos para os lotes vindos do inventário ---- */
type StockLot = {
  id: string;
  itemId: string;
  lot?: string | null; // nome do lote (preferencial)
  name?: string | null;
  code?: string | null;
  expiryDate?: string | null;
  remainingQty?: number | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}

export default function DeliveryDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const dQ = useDeliveryDetail(id);
  const linesQ = useDeliveryLines(id);
  const confirmMut = useConfirmDelivery();

  // ---- construir (itemId, lotId) únicos para carregar os lotes corretos ----
  const needed = useMemo(() => {
    const set = new Set<string>();
    (linesQ.data ?? []).forEach((ln) => {
      if (ln.itemId && ln.lot) set.add(`${ln.itemId}::${ln.lot}`);
    });
    return Array.from(set).map((k) => {
      const [itemId, lotId] = k.split("::");
      return { itemId, lotId };
    });
  }, [linesQ.data]);

  // index lotId -> StockLot
  const [lotsIndex, setLotsIndex] = useState<Map<string, StockLot>>(new Map());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (needed.length === 0) {
        setLotsIndex(new Map());
        return;
      }

      // Carrega por item: /stockLots?itemId=...
      const byItem = new Map<string, StockLot[]>();
      for (const { itemId } of needed) {
        if (byItem.has(itemId)) continue;

        let list: StockLot[] = [];
        try {
          const res = await api.get<StockLot[]>("/stockLots", {
            params: { itemId, _sort: "expiryDate", _order: "asc" },
          });
          list = Array.isArray(res.data) ? res.data : [];
        } catch {
          /* ignore */
        }

        if (list.length === 0) {
          // fallback para endpoints alternativos
          try {
            const res2 = await api.get<StockLot[]>("/stock_lots", {
              params: { itemId, _sort: "expiryDate", _order: "asc" },
            });
            list = Array.isArray(res2.data) ? res2.data : [];
          } catch {
            /* ignore */
          }
        }

        byItem.set(itemId, list);
      }

      if (cancelled) return;

      const map = new Map<string, StockLot>();
      for (const { itemId, lotId } of needed) {
        const list = byItem.get(itemId) ?? [];
        const found = list.find((l) => l.id === lotId);
        if (found) map.set(lotId, found);
      }
      setLotsIndex(map);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [needed]);

  const lotLabel = (lotId?: string | null) => {
    if (!lotId) return "—";
    const lot = lotsIndex.get(lotId);
    return lot?.lot || lot?.name || lot?.code || lot?.id || lotId;
  };

  async function handleConfirm() {
    if (!dQ.data || !linesQ.data) return;
    await confirmMut.mutateAsync({
      delivery: dQ.data,
      lines: linesQ.data as DeliveryLine[],
      scheduleId: dQ.data.scheduledId ?? null,
    });
  }

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      {/* Toolbar topo */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Entrega {id}</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Voltar
          </button>
          {dQ.data?.status !== "DELIVERED" && (
            <button
              className="btn"
              onClick={handleConfirm}
              disabled={confirmMut.isPending}
            >
              Confirmar entrega
            </button>
          )}
          <Link to="/deliveries" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </div>

      {/* Dados principais */}
      <div className="card card-elevated p-6 rounded-2xl shadow-md mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-slate-500">Beneficiário</div>
            <div className="font-medium">
              {dQ.data?.beneficiaryName ?? dQ.data?.beneficiaryId ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Estado</div>
            <div className="font-medium">{dQ.data?.status ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Entregue em</div>
            <div className="font-medium">{fmtDate(dQ.data?.deliveredAt)}</div>
          </div>
        </div>
      </div>

      {/* Linhas */}
      <div className="card card-elevated p-6 rounded-2xl shadow-md">
        <h2 className="font-semibold mb-3">Linhas</h2>
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2">Artigo</th>
                <th className="py-2 w-24">Qtd</th>
                <th className="py-2">Lote</th>
                <th className="py-2 w-40">Nota</th>
              </tr>
            </thead>
            <tbody>
              {(linesQ.data ?? []).map((ln) => (
                <tr key={ln.id} className="hover:bg-emerald-50">
                  <td className="py-1 pr-2">{ln.itemName ?? ln.itemId}</td>
                  <td className="py-1 pr-2">{ln.quantity}</td>
                  <td className="py-1 pr-2">{lotLabel(ln.lot)}</td>
                  <td className="py-1 pr-2">{ln.note ?? "—"}</td>
                </tr>
              ))}
              {(linesQ.data ?? []).length === 0 && (
                <tr>
                  <td className="py-3 text-sm text-gray-500" colSpan={4}>
                    Sem linhas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          Ao confirmar, o stock é deduzido por FEFO (validade mais próxima
          primeiro; lotes sem validade no fim). Se um lote for indicado na
          linha, esse é usado primeiro.
        </div>
      </div>
    </div>
  );
}
