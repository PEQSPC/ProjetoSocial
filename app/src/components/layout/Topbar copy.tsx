import { Search, Bell, ChevronDown } from "lucide-react"

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.15)]">
      <div className="mx-auto max-w-7xl h-16 px-4 md:px-6 flex items-center justify-between">
        {/* Marca */}
        <div className="flex items-center gap-3">
          {/* Imagem do logo a partir de /public */}
          <img
            src="/sas-logo.png"
            alt="SAS"
            className="h-8 w-auto rounded-md"
            loading="eager"
            decoding="async"
          />
          <span className="font-semibold tracking-tight"></span>
        </div>

        {/* Ações */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input placeholder="Pesquisar…" className="input pl-9 w-80" />
          </div>

          <button className="btn relative">
            <Bell className="size-4" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-500" />
          </button>

          <button className="btn">
            <div className="size-6 rounded-full bg-slate-200" />
            <span className="text-sm">Admin</span>
            <ChevronDown className="size-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  )
}