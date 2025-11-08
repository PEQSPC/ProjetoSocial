// src/components/layout/AppShell.tsx
import { useState } from "react"
import Topbar from "./Topbar"
import { Sidebar } from "./Sidebar"   // <-- import nomeado
import { Outlet } from "react-router-dom"

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-dvh flex">
      {/* Sidebar com largura dinâmica */}
      <aside
        className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-[width] duration-200 ${
          collapsed ? "w-[64px]" : "w-[260px]"
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
