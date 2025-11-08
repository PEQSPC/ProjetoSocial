# Loja Social — Backoffice (React + TS)

Backoffice em **React 18 + TypeScript + Vite**, UI com **Tailwind CSS v4**, gestão de dados com **Axios + React Query v5**.  
Para desenvolvimento rápido usamos uma **Mock API** com `json-server` (ficheiro `server/mock/db.json`). Quando a API real estiver pronta, basta mudar o `VITE_API_URL`.

---

## 1) Requisitos

- **Node.js** 18 ou 20 LTS
- **pnpm** (recomendado)
  ```bash
  corepack enable
  corepack prepare pnpm@latest --activate
  ```
- VS Code (ou editor à escolha)

---

## 2) Setup rápido

```bash
# instalar dependências
pnpm install

# copiar variáveis de ambiente
# (ou cria manualmente .env.local conforme secção 4)
```

Cria/edita o **`.env.local`** (na raiz do projeto):

```env
# API (mock com json-server)
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT_MS=15000

# Auth
VITE_AUTH_TOKEN_STORAGE_KEY=ls_token
VITE_AUTH_REFRESH_ENDPOINT=/auth/refresh

# App
VITE_APP_NAME=Loja Social IPCA
VITE_DEFAULT_LOCALE=pt-PT
VITE_ENABLE_MOCKS=true
```

---

## 3) Scripts úteis

No `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "mock": "json-server --watch server/mock/db.json --port 3001",
    "dev:mock": "concurrently \"pnpm mock\" \"pnpm dev\""
  }
}
```

Instalar as dev-deps dos scripts:
```bash
pnpm add -D json-server concurrently
```

Correr **front + mock** ao mesmo tempo:
```bash
pnpm dev:mock
```
- Frontend: http://localhost:5173  
- Mock API: http://localhost:3001

> Se preferires, corre em dois terminais: `pnpm mock` e `pnpm dev`.

---

## 4) Tailwind CSS v4 (config)

**postcss.config.js**
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

**src/index.css**
```css
@import "tailwindcss";
:root { color-scheme: light dark; }
```

**tailwind.config.js**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: { xl: "0.75rem", "2xl": "1rem" },
      boxShadow: { soft: "0 10px 30px -10px rgba(0,0,0,0.25)" },
    },
  },
  plugins: [],
}
```

---

## 5) Alias `@` → `src`

**tsconfig.app.json**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "strict": true
  },
  "include": ["src"]
}
```

**vite.config.ts**
```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  }
})
```

> Após editar estes ficheiros, **reinicia** `pnpm dev`.

---

## 6) Estrutura de pastas

```
loja-social-backoffice/
├─ .env.local
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.app.json
├─ postcss.config.js
├─ tailwind.config.js
├─ server/
│  └─ mock/
│     └─ db.json            # ← Mock API
└─ src/
   ├─ app/
   │  ├─ providers.tsx
   │  └─ router.tsx
   ├─ components/
   │  └─ tables/
   │     └─ DataTable.tsx
   ├─ config/
   │  └─ env.ts
   ├─ hooks/
   │  └─ useBeneficiaries.ts
   ├─ lib/
   │  ├─ api.ts
   │  └─ queryKeys.ts
   ├─ pages/
   │  ├─ dashboard/
   │  │  └─ Dashboard.tsx
   │  └─ beneficiaries/
   │     └─ List.tsx
   ├─ index.css
   ├─ main.tsx
   └─ App.tsx
```

---

## 7) Mock API (`json-server`)

O ficheiro `server/mock/db.json` contém coleções como `beneficiaries`, `donors`, `categories`, etc.

- Endpoints base:  
  `GET/POST/PUT/PATCH/DELETE /beneficiaries`
- Paginação:  
  `GET /beneficiaries?_page=1&_limit=10`
- Pesquisa (exemplo por nome):  
  `GET /beneficiaries?name_like=maria`
- Total: header `X-Total-Count`.

**Hook já preparado (React Query v5):**  
`src/hooks/useBeneficiaries.ts` usa `placeholderData: keepPreviousData` (v5) e lê `x-total-count`.

---

## 8) Páginas mínimas

**Dashboard** → `src/pages/dashboard/Dashboard.tsx`
```tsx
export default function Dashboard() {
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <a href="/beneficiaries" className="underline">Ir para Beneficiários →</a>
    </div>
  )
}
```

**Beneficiários (listagem)** → `src/pages/beneficiaries/List.tsx`
```tsx
import { useState } from "react"
import { useBeneficiaries } from "@/hooks/useBeneficiaries"
import type { Beneficiary } from "@/hooks/useBeneficiaries"
import { DataTable } from "@/components/tables/DataTable"
import type { Column } from "@/components/tables/DataTable"

export default function BeneficiariesList() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useBeneficiaries({ search, page, limit: 10 })

  const rows: Beneficiary[] = data?.data ?? []
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const cols: Column<Beneficiary>[] = [
    { header: "Nº Aluno", accessor: (r) => r.studentNumber },
    { header: "Nome", accessor: (r) => r.name },
    { header: "Email", accessor: (r) => r.email },
    { header: "Curso", accessor: (r) => r.course ?? "—" },
    { header: "Contacto", accessor: (r) => r.phone ?? "—" },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Pesquisar por nome…"
          className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 outline-none w-80"
        />
      </div>

      {isLoading ? (
        <div className="text-slate-400">A carregar…</div>
      ) : (
        <DataTable rows={rows} cols={cols} />
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">Total: {total}</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-800 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-300">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-800 disabled:opacity-50"
          >
            Seguinte
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 9) Ligar à API real (quando existir)

Atualiza o `.env.local`:
```env
VITE_API_URL=http://localhost:3000
VITE_ENABLE_MOCKS=false
```
Se a API tiver formato diferente (ex.: `GET /beneficiaries` a devolver `{data, page, total}`), adapta o `queryFn` no hook.

---

## 10) Troubleshooting

- **Alias `@`**: confirma `tsconfig.app.json` e `vite.config.ts`; reinicia `pnpm dev`.
- **Tailwind v4**: usa `@tailwindcss/postcss` no `postcss.config.js` + `@import "tailwindcss";` em `index.css`.
- **Mock path**: script `"mock"` aponta para `server/mock/db.json`.
- **React Query v5**: usar `placeholderData: keepPreviousData` (não `keepPreviousData: true`).

---

Tudo pronto para iterar nas próximas páginas (Famílias, Doadores, Itens, Doações, Entregas, Relatórios). Quando quiseres, adiciono o **AppShell (Sidebar + Topbar)** para um UI moderno e consistente.
