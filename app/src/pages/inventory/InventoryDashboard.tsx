import { Link } from "react-router-dom";
import { useItems } from "@/hooks/useItems";
import { useStockLots } from "@/hooks/useStockLots";

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
  return Math.round((t1 - t0) / 86400000);
}

export default function InventoryDashboard() {
  const itemsQ = useItems({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const lotsQ = useStockLots({
    page: 1,
    pageSize: 10000,
    sortBy: "expiryDate",
    sortDir: "asc",
  });

  const items = itemsQ.data?.items ?? [];
  const lots = lotsQ.data?.items ?? [];

  // 🔎 Mapa auxiliar para resolver itemId -> { sku, name }
  const itemMap = new Map<string | number, { sku: string; name: string }>();
  for (const it of items) itemMap.set(it.id, { sku: it.sku, name: it.name });

  const stockTotal = items.reduce(
    (acc, it) => acc + Number(it.stockCurrent ?? 0),
    0
  );
  const ruptures = items.filter(
    (it) => (it.stockCurrent ?? 0) < (it.minStock ?? 0)
  );

  const expiring = lots
    .filter((l) => l.expiryDate)
    .map((l) => ({ ...l, du: daysUntil(l.expiryDate) }))
    .filter((l) => typeof l.du === "number" && l.du! <= 30)
    .sort((a, b) => a.du! - b.du!)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Inventário</h1>
        <div className="flex gap-2">
          <Link to="/inventory/moves" className="btn">
            Ver movimentos
          </Link>
          <Link to="/inventory/counts" className="btn">
            Contagens
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500">Itens</div>
          <div className="text-2xl font-semibold">{items.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Stock total</div>
          <div className="text-2xl font-semibold">{stockTotal}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Abaixo do mínimo</div>
          <div className="text-2xl font-semibold">{ruptures.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">A expirar (≤ 30 dias)</div>
          <div className="text-2xl font-semibold">{expiring.length}</div>
        </div>
      </div>

      {/* A expirar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Lotes a expirar (próximos 30 dias)
          </h2>
          <Link to="/inventory/moves" className="btn">
            Ver movimentos
          </Link>
        </div>

        <div className="table-wrap">
          <div className="scroll">
            <table className="data">
              <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
                <tr>
                  <th className="th w-[20rem]">Artigo</th>
                  <th className="th w-[10rem]">Lote</th>
                  <th className="th w-[10rem]">Validade</th>
                  <th className="th w-[8rem]">Saldo</th>
                  <th className="th w-[8rem]">D-Expira</th>
                </tr>
              </thead>
              <tbody>
                {expiring.length === 0 ? (
                  <tr>
                    <td
                      className="td py-8 text-center text-slate-500"
                      colSpan={5}
                    >
                      Sem lotes a expirar nos próximos 30 dias
                    </td>
                  </tr>
                ) : (
                  expiring.map((l) => {
                    const meta = itemMap.get(l.itemId);
                    const artLabel = meta
                      ? `${meta.sku} — ${meta.name}`
                      : String(l.itemId);
                    const lotLabel = l.lot === "NOLOT" ? "Sem lote" : l.lot;
                    const tone =
                      l.du! < 0
                        ? "bg-red-50"
                        : l.du! <= 7
                        ? "bg-amber-50/70"
                        : "";
                    return (
                      <tr key={String(l.id)} className={tone}>
                        <td className="td">{artLabel}</td>
                        <td className="td">{lotLabel}</td>
                        <td className="td">{l.expiryDate}</td>
                        <td className="td">{l.remainingQty}</td>
                        <td className="td">{l.du}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Abaixo do mínimo */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Itens abaixo do mínimo</h2>
        <div className="table-wrap">
          <div className="scroll">
            <table className="data">
              <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
                <tr>
                  <th className="th w-[12rem]">SKU</th>
                  <th className="th w-[16rem]">Nome</th>
                  <th className="th w-[8rem]">Unid.</th>
                  <th className="th w-[8rem]">Stock</th>
                  <th className="th w-[8rem]">Min.</th>
                </tr>
              </thead>
              <tbody>
                {ruptures.length === 0 ? (
                  <tr>
                    <td
                      className="td py-8 text-center text-slate-500"
                      colSpan={5}
                    >
                      Sem ruturas
                    </td>
                  </tr>
                ) : (
                  ruptures.map((it) => (
                    <tr key={String(it.id)} className="row hover:bg-emerald-50">
                      <td className="td">{it.sku}</td>
                      <td className="td">{it.name}</td>
                      <td className="td">{it.unit}</td>
                      <td className="td">{it.stockCurrent ?? 0}</td>
                      <td className="td">{it.minStock ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
