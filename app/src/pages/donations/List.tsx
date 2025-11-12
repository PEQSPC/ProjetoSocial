import { Link } from "react-router-dom";
import { useState } from "react";
import { useDonations } from "@/hooks/useDonations";
import { useDonors } from "@/hooks/useDonors";
import { useDebouncedValue } from "@/utils/useDebouncedValue";
import { mapById, pickById } from "@/utils/mappers";
import type { Donor } from "@/domain/schemas";
import type { Donation } from "@/adapters/donations";

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

export default function DonationsList() {
  const [search, setSearch] = useState("");
  const deb = useDebouncedValue(search, 300);

  // ordenar por ID ascendente (“id mais pequeno” primeiro)
  const donationsQ = useDonations({
    q: deb,
    page: 1,
    pageSize: 50,
    sortBy: "id",
    sortDir: "asc",
  });
  const donorsQ = useDonors({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });

  const donations: Donation[] = toArray<Donation>(donationsQ.data);
  const donors: Donor[] = toArray<Donor>(donorsQ.data);

  const donorsMap = mapById<Donor>(donors);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Doações</h1>
        <Link to="/donations/create" className="btn">
          + Nova doação
        </Link>
      </div>

      <input
        className="input w-full"
        placeholder="Pesquisar por referência/notas..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-wrap">
        <table className="w-full table-fixed text-sm text-center">
          <colgroup>
            <col className="w-[130px]" />
            <col />
            <col className="w-[160px]" />
            <col className="w-[320px]" />
          </colgroup>

          <thead>
            <tr className="text-gray-600">
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Doador</th>
              <th className="px-3 py-2">Referência</th>
              <th className="px-3 py-2">Notas</th>
            </tr>
          </thead>

          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-emerald-50">
                <td className="px-3 py-2">
                  <Link
                    to={`/donations/${d.id}`}
                    className="underline underline-offset-2"
                  >
                    {fmt(d.date)}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {d.donorName ??
                    pickById(donorsMap, d.donorId)?.name ??
                    String(d.donorId)}
                </td>
                <td className="px-3 py-2">{d.reference ?? "—"}</td>
                <td className="px-3 py-2">{d.note ?? "—"}</td>
              </tr>
            ))}

            {!donations.length && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  Sem resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
