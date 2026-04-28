interface ClienteStat {
  nombre: string
  count: number
  total: number
}

export function TopClientes({ items }: { items: ClienteStat[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-4">Clientes frecuentes</p>
      {items.length === 0 && <p className="text-zinc-600 text-sm">Sin datos este mes</p>}
      <div className="space-y-3">
        {items.map((c, i) => (
          <div key={c.nombre + i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
