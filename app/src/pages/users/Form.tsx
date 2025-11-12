// src/pages/users/Form.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";

import type { AppUser, Role } from "@/contexts/auth-context";
import * as bcrypt from "bcryptjs"; // compatível com qualquer tsconfig

const ROLES: Role[] = ["ADMIN", "STAFF", "VIEWER"];

type PatchUser = Partial<
  Pick<AppUser, "name" | "email" | "role" | "isActive" | "passwordHash">
>;
type PostUser = Pick<AppUser, "name" | "email" | "role" | "isActive"> & {
  passwordHash?: string;
  createdAt: string;
};

export default function UserForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = !!id;

  const [data, setData] = useState<Partial<AppUser>>({
    name: "",
    email: "",
    role: "STAFF",
    isActive: true,
  });
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        const res = await api.get<AppUser>(`/users/${id}`);
        setData(res.data);
      })();
    }
  }, [id, isEdit]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      // calcular hash só se a password foi fornecida
      const passwordHash = password
        ? await bcrypt.hash(password, 10)
        : undefined;

      if (isEdit) {
        const payload: PatchUser = {
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          ...(passwordHash ? { passwordHash } : {}),
        };
        await api.patch(`/users/${id}`, payload);
      } else {
        // validações mínimas (podes reforçar se quiseres)
        const name = data.name?.trim() ?? "";
        const email = data.email?.trim() ?? "";
        const role: Role = (data.role ?? "STAFF") as Role;
        const isActive = data.isActive ?? true;

        const payload: PostUser = {
          name,
          email,
          role,
          isActive,
          createdAt: new Date().toISOString(),
          ...(passwordHash ? { passwordHash } : {}),
        };
        await api.post("/users", payload);
      }
      nav("/users");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        {isEdit ? "Editar utilizador" : "Novo utilizador"}
      </h1>

      <form onSubmit={onSubmit} className="grid gap-4 max-w-lg">
        <label className="grid gap-1">
          <span className="text-sm">Nome</span>
          <input
            className="input"
            value={data.name ?? ""}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Email</span>
          <input
            className="input"
            type="email"
            value={data.email ?? ""}
            onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Papel</span>
          <select
            className="input"
            value={data.role ?? "STAFF"}
            onChange={(e) =>
              setData((d) => ({ ...d, role: e.target.value as Role }))
            }
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!data.isActive}
            onChange={(e) =>
              setData((d) => ({ ...d, isActive: e.target.checked }))
            }
          />
          <span className="text-sm">Ativo</span>
        </label>

        <div className="pt-2">
          <div className="text-sm">
            Palavra-passe {isEdit ? "(deixa vazio para manter)" : ""}
          </div>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "A guardar..." : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
