// src/app/router.tsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

/* Guards */
import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequirePerm } from "@/components/guards/RequirePerm";

/* Layouts */
import AppShell from "@/components/layout/AppShell";
import AuthLayout from "@/pages/auth/AuthLayout";

/* Auth */
import Login from "@/pages/auth/Login";

/* Dashboard */
import Dashboard from "@/pages/dashboard/Dashboard";

/* ----------------- Beneficiários ----------------- */
import BeneficiariesList from "@/pages/beneficiaries/List";
import CreateBeneficiary from "@/pages/beneficiaries/Create";
import EditBeneficiary from "@/pages/beneficiaries/Edit";

/* --------------------- Famílias ------------------- */
import FamiliesList from "@/pages/families/List";
import FamilyCreate from "@/pages/families/Create";
import FamilyEdit from "@/pages/families/Edit";

/* --------------------- Doadores ------------------- */
import DonorsList from "@/pages/donors/List";
import DonorCreate from "@/pages/donors/Create";
import DonorEdit from "@/pages/donors/Edit";

/* ---------------------- Artigos ------------------- */
import ItemsList from "@/pages/items/List";
import ItemCreate from "@/pages/items/Create";
import ItemEdit from "@/pages/items/Edit";

/* --------------------- Doações -------------------- */
import DonationsList from "@/pages/donations/List";
import DonationCreate from "@/pages/donations/Create";
import DonationDetail from "@/pages/donations/Detail";

/* -------------------- Inventário ------------------ */
import InventoryDashboard from "@/pages/inventory/InventoryDashboard";
import StockMovesList from "@/pages/inventory/StockMoves/List";
import StockCountsList from "@/pages/inventory/StockCounts/List";
import StockCountCreate from "@/pages/inventory/StockCounts/Create";
import StockCountDetail from "@/pages/inventory/StockCounts/Detail";
import InventoryLots from "@/pages/inventory/Lots";

/* ------------------- Agendamentos ----------------- */
import SchedulesListPage from "@/pages/schedules/List";
import ScheduleCreatePage from "@/pages/schedules/Create";
import ScheduleDetailPage from "@/pages/schedules/Detail";

/* --------------------- Entregas ------------------- */
import DeliveriesListPage from "@/pages/deliveries/List";
import DeliveriesCreatePage from "@/pages/deliveries/Create";
import DeliveryDetailPage from "@/pages/deliveries/Detail";

/* ---------------------- Relatórios ---------------- */
import ReportsIndex from "@/pages/reports/Index";
import StockOverview from "@/pages/reports/StockOverview";
import SchedulesCompliance from "@/pages/reports/SchedulesCompliance";

/* ---------------------- Utilizadores -------------- */
import UsersList from "@/pages/users/List";
import UserForm from "@/pages/users/Form";

const makePlaceholder = (title: string) => (
  <div className="p-6">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <p className="text-slate-400 mt-1">Página em construção…</p>
  </div>
);

export const router = createBrowserRouter([
  // Rota pública de login com layout próprio
  {
    path: "/login",
    element: <AuthLayout />,
    children: [{ index: true, element: <Login /> }],
  },

  // App protegida por autenticação
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },

      /* Beneficiários */
      { path: "beneficiaries", element: <BeneficiariesList /> },
      { path: "beneficiaries/create", element: <CreateBeneficiary /> },
      { path: "beneficiaries/:id/edit", element: <EditBeneficiary /> },

      /* Famílias */
      { path: "families", element: <FamiliesList /> },
      { path: "families/create", element: <FamilyCreate /> },
      { path: "families/:id/edit", element: <FamilyEdit /> },

      /* Doadores */
      { path: "donors", element: <DonorsList /> },
      { path: "donors/create", element: <DonorCreate /> },
      { path: "donors/:id/edit", element: <DonorEdit /> },

      /* Artigos */
      { path: "items", element: <ItemsList /> },
      { path: "items/create", element: <ItemCreate /> },
      { path: "items/:id/edit", element: <ItemEdit /> },

      /* Doações */
      { path: "donations", element: <DonationsList /> },
      { path: "donations/create", element: <DonationCreate /> },
      { path: "donations/:id", element: <DonationDetail /> },

      /* Inventário */
      { path: "inventory", element: <InventoryDashboard /> },
      { path: "inventory/lots", element: <InventoryLots /> },
      { path: "inventory/moves", element: <StockMovesList /> },
      { path: "inventory/counts", element: <StockCountsList /> },
      { path: "inventory/counts/create", element: <StockCountCreate /> },
      { path: "inventory/counts/:id", element: <StockCountDetail /> },

      /* Agendamentos */
      { path: "schedules", element: <SchedulesListPage /> },
      { path: "schedules/create", element: <ScheduleCreatePage /> },
      { path: "schedules/:id", element: <ScheduleDetailPage /> },

      /* Entregas */
      { path: "deliveries", element: <DeliveriesListPage /> },
      { path: "deliveries/create", element: <DeliveriesCreatePage /> },
      { path: "deliveries/:id", element: <DeliveryDetailPage /> },

      /* Relatórios */
      { path: "reports", element: <ReportsIndex /> },
      { path: "reports/stock", element: <StockOverview /> },
      { path: "reports/schedules", element: <SchedulesCompliance /> },

      /* Utilizadores (protegido por permissões) */
      {
        path: "users",
        element: (
          <RequirePerm perm="users:read">
            <UsersList />
          </RequirePerm>
        ),
      },
      {
        path: "users/new",
        element: (
          <RequirePerm perm="users:write">
            <UserForm />
          </RequirePerm>
        ),
      },
      {
        path: "users/:id",
        element: (
          <RequirePerm perm="users:write">
            <UserForm />
          </RequirePerm>
        ),
      },

      /* 404 dentro do AppShell */
      { path: "*", element: makePlaceholder("404 — Página não encontrada") },
    ],
  },
]);

export default router;
