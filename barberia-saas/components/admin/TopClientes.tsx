interface ClienteStat { nombre: string; count: number; total: number }

export function TopClientes({ items }: { items: ClienteStat[] }) {
  return (
    <div className="bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/60
      rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-4">Clientes frecuentes</p>
      {items.length === 0 && <p className="text-zinc-600 text-sm">Sin datos este mes</p>}
      <div className="space-y-3">
        {items.map((c, i) => (
          <div key={c.nombre + i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600/60
              flex items-center justify-center text-white text-xs font-bold flex-shrink-0
              shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              {c.nombre[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{c.nombre}</p>
              <p className="text-zinc-500 text-xs">{c.count} {c.count === 1 ? 'visita' : 'visitas'}</p>
            </div>
            <span className="text-yellow-400 text-sm font-bold flex-shrink-0">
              ${Math.round(c.total / 1000)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
