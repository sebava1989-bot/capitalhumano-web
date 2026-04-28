interface ServicioStat {
  nombre: string
  count: number
  total: number
}

export function TopServicios({ items }: { items: ServicioStat[] }) {
  const max = items[0]?.count ?? 1
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-4">Servicios más vendidos</p>
      {items.length === 0 && <p className="text-zinc-600 text-sm">Sin datos este mes</p>}
      <div className="space-y-3">
        {items.map((s, i) => (
          <div key={s.nombre}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-white text-sm font-medium">
                <span className="text-zinc-600 text-xs mr-2">#{i + 1}</span>
                {s.nombre}
              </span>
              <div className="text-right">
                <span className="text-yellow-400 text-sm font-bold">{s.count} citas</span>
                <span className="text-zinc-500 text-xs ml-2">${Math.round(s.total / 1000)}k</span>
              </div>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
