import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  useDeliveryDetail,
  useDeliveryLines,
  useConfirmDelivery,
} from "@/hooks/useDeliveries";
import type { DeliveryLine } from "@/adapters/deliveryLines";

type StockLot = {
  id: string;
  itemId: string;
  lot?: string | null; // nome do lote no teu JSON
  name?: string | null;
  code?: string | null;
  expiryDate?: string | null;
  remainingQty: number;
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

  // ---- carregar os lotes referenciados (para mostrar o nome) ----
  const lotIds = useMemo(() => {
    const ids = new Set<string>();
    (linesQ.data ?? []).forEach((l) => {
      if (l.lot) ids.add(l.lot);
    });
    return Array.from(ids);
  }, [linesQ.data]);

  const [lotsIndex, setLotsIndex] = useState<Map<string, StockLot>>(new Map());
  useEffect(() => {
    if (lotIds.length === 0) {
      setLotsIndex(new Map());
      return;
    }
    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        lotIds.map(async (lotId) => {
          try {
            const res = await api.get<StockLot>(`/stockLots/${lotId}`);
            return res.data;
          } catch {
            const resList = await api.get<StockLot[]>("/stockLots", {
              params: { id: lotId },
            });
            const arr = Array.isArray(resList.data) ? resList.data : [];
            return arr[0];
          }
        })
      );

      if (cancelled) return;
      const map = new Map<string, StockLot>();
      results
        .filter(Boolean)
        .forEach((lot) => map.set((lot as StockLot).id, lot as StockLot));
      setLotsIndex(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [lotIds]);

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
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Entrega {id}</h1>
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

      <div className="card mb-4">
        <div className="grid gap-3 md:grid-cols-3">
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

      <div className="card">
        <h2 className="font-semibold mb-2">Linhas</h2>
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

        <div className="text-xs text-gray-500 mt-3">
          Ao confirmar, o stock é deduzido por FEFO (validade mais próxima
          primeiro; lotes sem validade no fim). Se um lote for indicado na
          linha, esse é usado primeiro.
        </div>
      </div>
    </div>
  );
}
