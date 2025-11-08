# Projeto Social

A full-stack social project application with a React frontend (backoffice) and Express backend.

## Project Structure

```text
ProjetoSocial/
├── app/                  # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   ├── layout/  # Layout components (AppShell, Sidebar, Topbar)
│   │   │   ├── tables/  # Table components
│   │   │   └── ui/      # UI primitives (Card, etc.)
│   │   ├── pages/       # Page components
│   │   │   ├── beneficiaries/  # Beneficiaries CRUD pages
│   │   │   └── dashboard/      # Dashboard page
│   │   ├── hooks/       # React Query custom hooks
│   │   ├── domain/      # Domain models, schemas, enums
│   │   ├── lib/         # API client, utilities
│   │   ├── config/      # App configuration (env, theme, permissions)
│   │   └── app/         # App setup (QueryClient)
│   └── server/mock/     # Mock JSON server data
│
└── backend/             # Backend (Express + TypeScript)
    └── src/
        ├── controllers/ # Request handlers
        ├── services/    # Business logic
        ├── routes/      # API routes
        ├── middleware/  # Express middleware
        ├── models/      # Data models
        ├── config/      # Configuration
        ├── types/       # TypeScript types
        └── utils/       # Utility functions

```

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Validation**: Zod
- **UI**: Custom components with class-variance-authority

### Backend
- **Framework**: Express 5
- **Language**: TypeScript
- **Process Manager**: Nodemon (dev)

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm

### Installation

#### Frontend
```bash
cd app
pnpm install
```

#### Backend
```bash
cd backend
npm install
```

### Development

#### Frontend
```bash
cd app

# Run with mock server
pnpm dev:mock

# Run frontend only
pnpm dev

# Run mock server only
pnpm mock
```

#### Backend
```bash
cd backend

# Development mode (watch + auto-reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Available Scripts

#### Frontend (`app/`)
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript compiler check
- `pnpm mock` - Start JSON mock server on port 3001
- `pnpm dev:mock` - Run frontend + mock server concurrently

#### Backend (`backend/`)
- `npm run dev` - Start dev server with watch mode
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build

## Port Configuration

- Frontend: `http://localhost:5173` (Vite default)
- Backend: `http://localhost:3000`
- Mock Server: `http://localhost:3001`

## API Documentation

Coming soon...

## Contributing

Coming soon...

## License

ISC
