interface ServicioStat { nombre: string; count: number; total: number }

export function TopServicios({ items }: { items: ServicioStat[] }) {
  const max = items[0]?.count ?? 1
  return (
    <div className="bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/60
      rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-4">Servicios más vendidos</p>
      {items.length === 0 && <p className="text-zinc-600 text-sm">Sin datos este mes</p>}
      <div className="space-y-3">
        {items.map((s, i) => (
          <div key={s.nombre}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-white text-sm font-medium">
                <span className="text-zinc-600 text-xs mr-2">#{i + 1}</span>
                {s.nombre}
              </span>
              <div className="text-right">
                <span className="text-yellow-400 text-sm font-bold">{s.count} citas</span>
                <span className="text-zinc-500 text-xs ml-2">${Math.round(s.total / 1000)}k</span>
              </div>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full
                  shadow-[0_0_6px_rgba(250,204,21,0.4)] transition-all duration-700"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
