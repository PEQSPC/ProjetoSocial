export function Card({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-2xl bg-white border border-slate-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="px-5 pt-5">
      <h3 className="font-semibold tracking-tight">{title}</h3>
      {desc && <p className="text-sm text-slate-500">{desc}</p>}
    </div>
  )
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-5">{children}</div>
}
