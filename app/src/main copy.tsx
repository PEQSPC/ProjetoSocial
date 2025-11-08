// src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { router } from "@/app/router"        
import Providers from "@/app/providers"      
import "@/index.css"

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  try { return JSON.stringify(err) } catch { return String(err) }
}

function ErrorFallback({ error }: { error: unknown }) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Ocorreu um erro 😢</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{getErrorMessage(error)}</pre>
      <p>Abre a consola (F12) para detalhes.</p>
    </div>
  )
}

type EBState = { error: unknown | null }
type EBProps = { children: React.ReactNode }

class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: unknown): EBState {
    return { error }
  }
  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // útil para debug
    console.error("Uncaught error:", error, errorInfo)
  }
  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} />
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers>
        <React.Suspense fallback={<div style={{ padding: 24 }}>A carregar…</div>}>
          <RouterProvider router={router} />
        </React.Suspense>
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>
)
