// src/pages/inventory/StockCounts/Detail.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import type { Id } from "@/lib/queryKeys";
import type { StockCountLine } from "@/domain/schemas";

import { useItems } from "@/hooks/useItems";
import { useStockLots } from "@/hooks/useStockLots";
import {
  useStockCountLines,
  useUpsertCountLine,
} from "@/hooks/useStockCountLines";
import { useCloseStockCount } from "@/hooks/useCloseStockCount";
import { useCreateCountLine } from "@/hooks/useCreateCountLine";

/* ============================ Row ============================ */

function Row({
  line,
  itemLabel,
  lotLabel,
  onSave,
  isSaving,
}: {
  line: StockCountLine;
  itemLabel: string;
  lotLabel: string;
  onSave: (countedQty: number, note?: string) => void;
  isSaving?: boolean;
}) {
  const [countText, setCountText] = useState<string>(
    String(line.countedQty ?? "")
  );
  const [note, setNote] = useState<string>(line.note ?? "");

  useEffect(() => {
    setCountText(String(line.countedQty ?? ""));
    setNote(line.note ?? "");
  }, [line.id, line.countedQty, line.note]);

  function commit() {
    const v = Math.max(0, Math.trunc(Number(countText) || 0));
    onSave(v, note.trim() ? note.trim() : undefined);
  }

  const deltaTone =
    typeof line.delta === "number" && line.delta < 0
      ? "text-red-600"
      : typeof line.delta === "number" && line.delta > 0
      ? "text-emerald-700"
      : "";

  return (
    <tr className="row hover:bg-emerald-50">
      <td className="td">
        <div className="truncate font-medium">{itemLabel}</div>
      </td>
      <td className="td">
        <div className="truncate">{lotLabel}</div>
      </td>
      <td className="td">{line.expectedQty}</td>
      <td className="td">
        <input
          className="input w-[6.5rem] text-center"
          value={countText}
          onChange={(e) => setCountText(e.target.value)}
          onBlur={commit}
          inputMode="numeric"
        />
      </td>
      <td className={`td ${deltaTone}`}>
        {typeof line.delta === "number" ? line.delta : "—"}
      </td>
      <td className="td">
        <input
          className="input w-full"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commit}
          placeholder="Notas…"
        />
      </td>
      <td className="td w-[9rem] text-right whitespace-nowrap pr-2">
        <button
          className="btn px-3 py-1.5"
          onClick={commit}
          disabled={isSaving}
        >
          Guardar
        </button>
      </td>
    </tr>
  );
}

/* ============================ Modal Add ============================ */

function AddLineModal({
  countId,
  onClose,
}: {
  countId: Id;
  onClose: () => void;
}) {
  const [itemId, setItemId] = useState<string>("");
  const [lotId, setLotId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const items = useItems({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const lots = useStockLots(
    itemId
      ? {
          itemId,
          page: 1,
          pageSize: 1000,
          sortBy: "entryDate",
          sortDir: "desc",
        }
      : undefined
  );

  const { mutate: createLine, isPending } = useCreateCountLine();

  function save() {
    const noteClean = note.trim() ? note.trim() : undefined;
    const payload = lotId
      ? {
          countId,
          itemId: itemId as unknown as Id,
          lotId: lotId as unknown as Id,
          note: noteClean,
        }
      : { countId, itemId: itemId as unknown as Id, note: noteClean }; // sem lote -> hook cria/usa NOLOT
    createLine(payload, { onSuccess: onClose });
  }

  useEffect(() => {
    setLotId("");
  }, [itemId]);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4">
      <div className="card p-6 w-full max-w-lg space-y-4">
        <h3 className="text-lg font-semibold">Adicionar linha à contagem</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Artigo *</label>
            <select
              className="input"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <option value="">— selecione —</option>
              {(items.data?.items ?? []).map((it) => (
                <option key={String(it.id)} value={String(it.id)}>
                  {it.sku} — {it.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Lote (opcional)</label>
            <select
              className="input"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              disabled={!itemId}
            >
              <option value="">— sem lote —</option>
              {(lots?.data?.items ?? []).map((l) => (
                <option key={String(l.id)} value={String(l.id)}>
                  {l.lot} — saldo {l.remainingQty}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">Notas</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={save}
            disabled={!itemId || isPending}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ Página ============================ */

export default function StockCountDetail() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id: Id = params.id!;

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const linesQ = useStockCountLines({
    countId: id,
    page,
    pageSize,
    sortBy: "itemId",
    sortDir: "asc",
  });
  const { mutate: upsertLine, isPending: saving } = useUpsertCountLine();
  const { mutate: closeCount, isPending: closing } = useCloseStockCount();

  const [showAdd, setShowAdd] = useState(false);

  // Carregar todos os artigos e lotes para resolver labels
  const itemsQ = useItems({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const lotsQ = useStockLots({
    page: 1,
    pageSize: 5000,
    sortBy: "entryDate",
    sortDir: "desc",
  });

  const itemMap = useMemo(() => {
    const m = new Map<string, { sku: string; name: string }>();
    (itemsQ.data?.items ?? []).forEach((it) => {
      m.set(String(it.id), { sku: it.sku, name: it.name });
    });
    return m;
  }, [itemsQ.data?.items]);

  const lotMap = useMemo(() => {
    const m = new Map<string, { lot: string }>();
    (lotsQ.data?.items ?? []).forEach((l) => {
      m.set(String(l.id), { lot: l.lot });
    });
    return m;
  }, [lotsQ.data?.items]);

  const lines = linesQ.data?.items ?? [];
  const total = linesQ.data?.total ?? 0;
  const totalPages = Math.max(1, linesQ.data?.pageCount ?? 1);

  const resume = useMemo(() => {
    let dif = 0,
      counted = 0,
      expected = 0;
    for (const l of lines) {
      expected += l.expectedQty;
      if (typeof l.countedQty === "number") counted += l.countedQty;
      if (typeof l.delta === "number") dif += l.delta;
    }
    return { dif, counted, expected };
  }, [lines]);

  function writeLine(line: StockCountLine, countedQty: number, note?: string) {
    upsertLine({ id: line.id, countId: line.countId, countedQty, note });
  }

  function finish() {
    if (!confirm("Fechar contagem? Não poderás editar mais linhas.")) return;
    closeCount(
      { id },
      {
        onSuccess: () => {
          alert("Contagem fechada.");
          navigate("/inventory/counts");
        },
        onError: () => alert("Não foi possível fechar a contagem."),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Contagem #{String(id)}
        </h1>
        <div className="flex gap-2">
          <Link to="/inventory/counts" className="btn">
            Voltar
          </Link>
          <button className="btn" onClick={() => setShowAdd(true)}>
            + Adicionar linha
          </button>
          <button className="btn-primary" onClick={finish} disabled={closing}>
            Fechar contagem
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-slate-500">Esperado</div>
          <div className="text-xl font-semibold">{resume.expected}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">Contado</div>
          <div className="text-xl font-semibold">{resume.counted}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">Diferença</div>
          <div
            className={`text-xl font-semibold ${
              resume.dif === 0
                ? ""
                : resume.dif < 0
                ? "text-red-600"
                : "text-emerald-700"
            }`}
          >
            {resume.dif}
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-wrap">
          {/* Sem scroll horizontal */}
          <div className="scroll overflow-x-hidden overflow-y-visible">
            <table className="data table-fixed w-full">
              {/* Larguras somam 100% */}
              <colgroup>
                <col style={{ width: "28%" }} /> {/* Item */}
                <col style={{ width: "16%" }} /> {/* Lote */}
                <col style={{ width: "10%" }} /> {/* Esperado */}
                <col style={{ width: "14%" }} /> {/* Contado */}
                <col style={{ width: "10%" }} /> {/* Delta */}
                <col style={{ width: "14%" }} /> {/* Notas */}
                <col style={{ width: "8%" }} /> {/* Ação */}
              </colgroup>

              <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
                <tr>
                  <th className="th">Item</th>
                  <th className="th">Lote</th>
                  <th className="th">Esperado</th>
                  <th className="th">Contado</th>
                  <th className="th">Delta</th>
                  <th className="th">Notas</th>
                  <th className="th text-right">Ação</th>
                </tr>
              </thead>

              <tbody>
                {linesQ.isLoading ? (
                  <tr>
                    <td className="td py-10 text-center" colSpan={7}>
                      A carregar…
                    </td>
                  </tr>
                ) : lines.length === 0 ? (
                  <tr>
                    <td
                      className="td py-10 text-center text-slate-500"
                      colSpan={7}
                    >
                      Sem linhas
                    </td>
                  </tr>
                ) : (
                  lines.map((l) => {
                    const im = itemMap.get(String(l.itemId));
                    const lm = lotMap.get(String(l.lotId));
                    const itemLabel = im
                      ? `${im.sku} — ${im.name}`
                      : String(l.itemId);
                    const lotLabel = lm
                      ? lm.lot === "NOLOT"
                        ? "Sem lote"
                        : lm.lot
                      : String(l.lotId);
                    return (
                      <Row
                        key={String(l.id)}
                        line={l}
                        itemLabel={itemLabel}
                        lotLabel={lotLabel}
                        isSaving={saving}
                        onSave={(qty, note) => writeLine(l, qty, note)}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <span className="text-sm text-slate-500">Total: {total}</span>
            <div className="flex items-center gap-2">
              <button
                className="btn disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <button
                className="btn disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Seguinte
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <AddLineModal countId={id} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
