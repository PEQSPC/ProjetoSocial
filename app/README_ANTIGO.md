# Loja Social — Backoffice (React + TypeScript)

Backoffice da Loja Social (SAS). Frontend em **React 18 + TypeScript + Vite**, UI com **Tailwind CSS v4 + shadcn/ui**, dados via **Axios + React Query** e autenticação por **JWT**.

> **Nota:** Este repositório é só do **Backoffice**. A API será feita por outra equipa. Incluímos abaixo a **base de dados PostgreSQL** (DDL + seed) e um `docker-compose` para facilitar a vida da equipa da API.

---

## 1) Requisitos

- **Node.js** 18 ou 20 LTS (recomendado 20.x)  
- **pnpm** (recomendado) ou npm  
  - Ativar com Corepack:
    ```bash
    corepack enable
    corepack prepare pnpm@latest --activate
    ```
- **Git**
- (Opcional) **Docker Desktop** (para subir Postgres + pgAdmin)

---

## 2) Começar

```bash
# clonar
git clone <url-do-repo> loja-social-backoffice
cd loja-social-backoffice

# instalar dependências
pnpm install

# configurar variáveis de ambiente
cp .env.example .env.local
# editar .env.local e apontar VITE_API_URL para a API (ex: http://localhost:3000)

# correr em desenvolvimento
pnpm dev

# build de produção
pnpm build
pnpm preview  # serve do build
```

### `.env.example`

```env
# API
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT_MS=15000

# Auth
VITE_AUTH_TOKEN_STORAGE_KEY=ls_token
VITE_AUTH_REFRESH_ENDPOINT=/auth/refresh

# App
VITE_APP_NAME=Loja Social IPCA
VITE_DEFAULT_LOCALE=pt-PT
VITE_ENABLE_MOCKS=false
```

---

## 3) Stack & Principais libs

- **Vite + React + TS**
- **Tailwind CSS v4** (plugin PostCSS `@tailwindcss/postcss`)
- **shadcn/ui** (componentes base)
- **React Router v6**
- **@tanstack/react-query** (fetch cache & mutations)
- **Axios** (HTTP)
- **Zod** (validação forms)
- **lucide-react** (ícones)
- **dayjs** (datas)

---

## 4) Estrutura de Pastas (Backoffice)

```
loja-social-backoffice/
├─ .env.example
├─ .env.local                    # (gitignore)
├─ README.md
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ postcss.config.js
├─ tailwind.config.js
├─ public/
│  └─ favicon.svg
├─ db/                           # <— base de dados p/ equipa da API
│  ├─ docker-compose.yml
│  ├─ schema.sql
│  └─ seed.sql
└─ src/
   ├─ app/
   │  ├─ router.tsx
   │  ├─ providers.tsx
   │  └─ queryClient.ts
   ├─ assets/
   │  └─ images/
   ├─ components/
   │  ├─ ui/                     # shadcn/ui
   │  └─ layout/
   │     ├─ AppShell.tsx
   │     ├─ Sidebar.tsx
   │     └─ Topbar.tsx
   ├─ config/
   │  ├─ env.ts
   │  ├─ theme.ts
   │  └─ permissions.ts
   ├─ domain/
   │  ├─ enums.ts
   │  ├─ models.ts
   │  └─ schemas.ts
   ├─ hooks/
   │  ├─ useAuth.ts
   │  └─ useSession.ts
   ├─ lib/
   │  ├─ api.ts
   │  └─ queryKeys.ts
   ├─ pages/
   │  ├─ auth/           # Login, ForgotPassword
   │  ├─ dashboard/
   │  ├─ beneficiaries/
   │  ├─ families/
   │  ├─ donors/
   │  ├─ donations/
   │  ├─ items/
   │  ├─ inventory/
   │  ├─ deliveries/
   │  ├─ schedules/
   │  └─ reports/
   ├─ index.css          # Tailwind v4
   ├─ App.tsx
   └─ main.tsx
```

---

## 5) Tailwind CSS (v4) — Configuração

**Instalação** (já no `package.json`):
```bash
pnpm add -D tailwindcss @tailwindcss/postcss postcss
```

**`postcss.config.js`**
```js
export default { plugins: { "@tailwindcss/postcss": {} } }
```

**`index.css`**
```css
@import "tailwindcss";
:root { color-scheme: light dark; }
```

**`tailwind.config.js`**
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

> Se virem o erro do PostCSS a pedir `@tailwindcss/postcss`, confirmem o `postcss.config.js` acima.

---

## 6) shadcn/ui (UI library)

```bash
pnpm add class-variance-authority clsx tailwind-merge
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button card input label
```

Isto cria `src/components/ui/*`. Mais componentes podem ser adicionados conforme necessário.

---

## 7) Autenticação & Axios

- O token é guardado em `localStorage` com a key `VITE_AUTH_TOKEN_STORAGE_KEY`.
- Interceptor de **refresh** automático (usa `VITE_AUTH_REFRESH_ENDPOINT`).

> Em desenvolvimento, sem API pronta, dá para simular sessão no navegador:  
> `localStorage.setItem("ls_token","demo"); location.reload()`.

---

## 8) Base de Dados (PostgreSQL)

### 8.1 `db/docker-compose.yml`

```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    container_name: loja_social_db
    environment:
      POSTGRES_USER: sas
      POSTGRES_PASSWORD: sas123
      POSTGRES_DB: loja_social
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro
      - ./seed.sql:/docker-entrypoint-initdb.d/02_seed.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sas -d loja_social"]
      interval: 5s
      timeout: 5s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4:8
    container_name: loja_social_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "8081:80"
    depends_on:
      - db

volumes:
  pgdata:
```

**Subir o DB:**
```bash
cd db
docker compose up -d
# pgAdmin: http://localhost:8081  (login admin@local / admin)
# Postgres: host localhost | db loja_social | user sas | pass sas123 | port 5432
```

### 8.2 `db/schema.sql` (DDL)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles / Users / RefreshTokens
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,       -- ADMIN, STAFF, VIEWER
  name TEXT NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Families / Beneficiaries
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  course TEXT,
  curricular_year INT,
  gender CHAR(1),
  family_id UUID REFERENCES families(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  relation TEXT
);

-- Donors / Donations
CREATE TABLE donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,      -- PRIVATE, COMPANY, CAMPAIGN
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nif TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES donors(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT
);

-- Categories / Items / Stock lots
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL       -- FOOD, HYGIENE, CLEANING, OTHER
);

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  unit TEXT NOT NULL,      -- UNIT, KG, L, PACK
  min_stock NUMERIC(12,2)
);

CREATE TABLE stock_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id),
  quantity NUMERIC(12,2) NOT NULL,
  expiry_date DATE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  donation_id UUID REFERENCES donations(id)
);

CREATE VIEW stock_consolidated AS
SELECT i.id as item_id, i.name, i.unit, COALESCE(SUM(sl.quantity),0) as quantity
FROM items i
LEFT JOIN stock_lots sl ON sl.item_id = i.id
GROUP BY i.id, i.name, i.unit;

-- Deliveries
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_DELIVERED',   -- DELIVERED, NOT_DELIVERED
  delivered_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE delivery_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity NUMERIC(12,2) NOT NULL
);

-- Schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
  date DATE NOT NULL,
  notes TEXT
);

-- News / Campaigns (se o site público usar)
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_url TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  content TEXT NOT NULL
);
```

### 8.3 `db/seed.sql` (dados exemplo)

```sql
-- Roles
INSERT INTO roles (id, code, name) VALUES
  (uuid_generate_v4(), 'ADMIN', 'Administrador'),
  (uuid_generate_v4(), 'STAFF', 'Operador'),
  (uuid_generate_v4(), 'VIEWER', 'Consulta')
ON CONFLICT DO NOTHING;

-- Utilizador admin (password_hash: PLACEHOLDER -> trocar pelo hash real da API)
INSERT INTO users (id, name, email, password_hash, role_id)
SELECT uuid_generate_v4(), 'Admin Loja', 'admin@sas.local', 'HASH_AQUI', r.id
FROM roles r WHERE r.code='ADMIN'
ON CONFLICT DO NOTHING;

-- Categorias
INSERT INTO categories (id, name, type) VALUES
  (uuid_generate_v4(), 'Mercearia', 'FOOD'),
  (uuid_generate_v4(), 'Higiene Pessoal', 'HYGIENE'),
  (uuid_generate_v4(), 'Limpeza', 'CLEANING')
ON CONFLICT DO NOTHING;

-- Itens
WITH c AS (
  SELECT id, name FROM categories
)
INSERT INTO items (id, sku, name, category_id, unit, min_stock)
VALUES
  (uuid_generate_v4(), 'ARROZ-1KG', 'Arroz 1kg',      (SELECT id FROM c WHERE name='Mercearia'), 'KG', 10),
  (uuid_generate_v4(), 'MASSA-500G','Massa 500g',     (SELECT id FROM c WHERE name='Mercearia'), 'PACK', 20),
  (uuid_generate_v4(), 'SABONETE',  'Sabonete',       (SELECT id FROM c WHERE name='Higiene Pessoal'), 'UNIT', 30),
  (uuid_generate_v4(), 'DETERG',    'Detergente',     (SELECT id FROM c WHERE name='Limpeza'), 'L', 15)
ON CONFLICT DO NOTHING;

-- Doadores
INSERT INTO donors (id, type, name, email) VALUES
  (uuid_generate_v4(), 'PRIVATE', 'João Silva', 'joao@example.com'),
  (uuid_generate_v4(), 'COMPANY', 'Mercado X', 'contato@mercadox.pt')
ON CONFLICT DO NOTHING;

-- Doação + stock
WITH d AS (
  INSERT INTO donations (id, donor_id, date, notes)
  SELECT uuid_generate_v4(), (SELECT id FROM donors WHERE name='Mercado X' LIMIT 1), CURRENT_DATE, 'Doação inicial'
  RETURNING id
)
INSERT INTO stock_lots (id, item_id, quantity, expiry_date, entry_date, donation_id)
SELECT uuid_generate_v4(), i.id, q.qty, CURRENT_DATE + (q.days || ' days')::interval, CURRENT_DATE, (SELECT id FROM d)
FROM items i
JOIN (VALUES
  ('Arroz 1kg', 50, 120), ('Massa 500g', 80, 240), ('Sabonete', 60, 365), ('Detergente', 40, 365)
) AS q(name, qty, days) ON i.name = q.name;

-- Famílias / Beneficiários
INSERT INTO families (id, name) VALUES
  (uuid_generate_v4(), 'Família Alves')
ON CONFLICT DO NOTHING;

INSERT INTO beneficiaries (id, student_number, name, email, family_id)
SELECT uuid_generate_v4(), 'A12345', 'Maria Alves', 'maria.alves@aluno.pt', f.id
FROM families f WHERE f.name='Família Alves'
ON CONFLICT DO NOTHING;

-- Agendamento & Entrega demo
INSERT INTO schedules (id, beneficiary_id, date, notes)
SELECT uuid_generate_v4(), b.id, CURRENT_DATE + INTERVAL '3 days', 'Entrega mensal'
FROM beneficiaries b WHERE b.student_number='A12345';

INSERT INTO deliveries (id, beneficiary_id, scheduled_at, status, notes)
SELECT uuid_generate_v4(), b.id, CURRENT_DATE + INTERVAL '3 days', 'NOT_DELIVERED', 'Cabaz base'
FROM beneficiaries b WHERE b.student_number='A12345'
RETURNING id;

-- (Opcional) linhas de entrega serão adicionadas pela aplicação/API
```

---

## 9) Convenções & Qualidade

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`…)
- **Lint/Format**:
  ```bash
  pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  # (configura e adiciona script "lint")
  ```
- **Aliases de path**: `@/*` → `src/*` (config no `tsconfig.json` e `vite.config.ts`)

---

## 10) Endpoints esperados pela UI (para equipa da API)

- `POST /auth/login` → `{ email, password }` ⇒ `{ accessToken, refreshToken, user }`
- `POST /auth/refresh` → `{ refreshToken }` ⇒ `{ accessToken }`
- CRUDs:
  - `/beneficiaries`, `/families`, `/donors`, `/donations (+/lines)`, `/items`, `/categories`, `/stock/lots`, `/deliveries (+/lines)`, `/schedules`
- Relatórios:
  - `/reports/stock-rotation`, `/reports/deliveries-by-beneficiary`
- Público (se aplicável):
  - `/public/stock/summary`, `/public/news`, `/public/campaigns`

---

## 11) Troubleshooting

- **Overlay vermelho “@tailwindcss/postcss”**  
  Atualiza `postcss.config.js` para usar:
  ```js
  export default { plugins: { "@tailwindcss/postcss": {} } }
  ```
- **pnpm não reconhecido**  
  `corepack enable && corepack prepare pnpm@latest --activate` ou `npm i -g pnpm`
- **Porto ocupado**  
  `pnpm dev -- --port 5174`
- **Sem API**  
  Simula sessão: `localStorage.setItem('ls_token','demo'); location.reload()`
