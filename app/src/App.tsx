import "./App.css";

export default function App() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/60 bg-slate-900/60 backdrop-blur">
        <div className="h-14 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold tracking-wide">
            Backoffice — Loja Social
          </h1>
          <span className="text-sm text-slate-400">v0.1</span>
        </div>
      </header>

      <main className="grid place-items-center p-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-emerald-400">Tailwind ON</h2>
          <p className="mt-2 text-slate-300">
            Setup pronto para começares o layout do backoffice.
          </p>
          <button className="mt-6 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-soft transition">
            Continuar
          </button>
        </div>
      </main>
    </div>
  );
}
