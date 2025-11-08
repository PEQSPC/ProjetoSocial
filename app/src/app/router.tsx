import React from "react"
import { createBrowserRouter } from "react-router-dom"
import AppShell from "@/components/layout/AppShell"
import Dashboard from "@/pages/dashboard/Dashboard"
import BeneficiariesList from "@/pages/beneficiaries/List"
import CreateBeneficiary from "@/pages/beneficiaries/Create"
import EditBeneficiary from "@/pages/beneficiaries/Edit"

const makePlaceholder = (title: string) => (
  <div className="p-6">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <p className="text-slate-400 mt-1">Página em construção…</p>
  </div>
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "beneficiaries", element: <BeneficiariesList /> },
      {path: "beneficiaries/create", element: <CreateBeneficiary />},
      { path: "beneficiaries/:id/edit", element: <EditBeneficiary /> },
      { path: "families", element: makePlaceholder("Famílias") },
      { path: "donors", element: makePlaceholder("Doadores") },
      { path: "items", element: makePlaceholder("Artigos") },
      { path: "inventory", element: makePlaceholder("Inventário") },
      { path: "donations", element: makePlaceholder("Doações") },
      { path: "schedules", element: makePlaceholder("Agendamentos") },
      { path: "deliveries", element: makePlaceholder("Entregas") },
      { path: "reports", element: makePlaceholder("Relatórios") },
    ],
  },
])
