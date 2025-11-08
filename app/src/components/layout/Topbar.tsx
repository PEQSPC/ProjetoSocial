// src/components/layout/Topbar.tsx
import { Search, Bell, ChevronDown, Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

type Props = { showLogo?: boolean }

export default function Topbar({ showLogo = true }: Props) {
  const [theme, setTheme] = useState<"light"|"dark">(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") return saved
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:bg-slate-900/70 dark:border-slate-800">
      {/* h-20 + items-end => tudo alinhado em baixo com os KPIs */}
      <div className="mx-auto max-w-7xl h-20 px-4 md:px-6 flex items-end justify-between">
        {/* ESQUERDA: logótipo */}
        <div className="flex items-end">
          {showLogo && (
            <img
              src="/sas-logo.png"
              alt="SAS"
              className="h-8 w-auto select-none mb-[2px]" /* mb fino p/ casar com cards */
              draggable={false}
            />
          )}
        </div>

        {/* DIREITA: ações */}
        <div className="flex items-end gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input placeholder="Pesquisar…" className="input pl-9 w-80" />
          </div>

          <button className="btn relative" aria-label="Notificações">
            <Bell className="size-4" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[hsl(var(--brand))]" />
          </button>

          <button
            className="btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="hidden sm:inline text-sm">{theme === "dark" ? "Claro" : "Escuro"}</span>
          </button>

          <button className="btn" aria-haspopup="menu" aria-expanded="false">
            <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="text-sm">Admin</span>
            <ChevronDown className="size-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  )
}
