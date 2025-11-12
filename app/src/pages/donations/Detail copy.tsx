import { useParams } from "react-router-dom";
import { useDonationDetail, useDonationLines } from "@/hooks/useDonations";
import { useItems } from "@/hooks/useItems";
import { useDonors } from "@/hooks/useDonors";
import { mapById, pickById } from "@/utils/mappers";
import type { Item, Donor } from "@/domain/schemas";
import type { Donation, DonationLine } from "@/adapters/donations";

/* ---------- helpers sem any ---------- */
type Page<T> = { items: T[] } & Record<string, unknown>;

function isPage<T>(v: unknown): v is Page<T> {
  return (
    typeof v === "object" &&
    v !== null &&
    "items" in (v as Record<string, unknown>)
  );
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (isPage<T>(data)) return (data.items ?? []) as T[];
  return [];
}

const fmt = (d: string) => {
  const dt = new Date(d);
  return Number.isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
};

export default function DonationDetail() {
  const { id = "" } = useParams();

  const headQ = useDonationDetail(id);
  const linesQ = useDonationLines(id);

  const itemsQ = useItems({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const donorsQ = useDonors({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });

  const d = headQ.data as Donation | undefined;

  const lines: DonationLine[] = toArray<DonationLine>(linesQ.data);
  const items: Item[] = toArray<Item>(itemsQ.data);
  const donors: Donor[] = toArray<Donor>(donorsQ.data);

  const itemsMap = mapById<Item>(items);
  const donorsMap = mapById<Donor>(donors);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Doação #{id}</h1>

      {d && (
        <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="text-sm text-gray-500">Data</span>
            <div>{fmt(d.date)}</div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Doador</span>
            <div>
              {d.donorName ??
                pickById(donorsMap, d.donorId)?.name ??
                String(d.donorId)}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Referência</span>
            <div>{d.reference ?? "—"}</div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Notas</span>
            <div>{d.note ?? "—"}</div>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="w-full table-fixed text-sm text-center">
          <colgroup>
            <col className="w-[200px]" />
            <col className="w-[260px]" />
            <col className="w-[160px]" />
            <col className="w-[80px]" />
            <col className="w-[140px]" />
            <col className="w-[120px]" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Artigo</th>
              <th>Lote</th>
              <th>Qtd</th>
              <th>Validade</th>
              <th>Local</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const it = pickById(itemsMap, l.itemId);
              return (
                <tr key={l.id}>
                  {/* SKU = ID da doação (como pediste) */}
                  <td>{id}</td>
                  <td>{l.itemName ?? it?.name ?? String(l.itemId)}</td>
                  <td>{l.lot ?? "—"}</td>
                  <td>{l.quantity}</td>
                  <td>{l.expiryDate ? fmt(l.expiryDate) : "—"}</td>
                  <td>{l.locationCode ?? "—"}</td>
                  <td>{l.note ?? "—"}</td>
                </tr>
              );
            })}
            {!lines.length && (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-sm text-gray-500"
                >
                  Sem linhas para esta doação.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
