interface AgendaItem {
  id: string
  fecha_hora: string
  estado: string
  cliente_nombre: string | null
  servicios: unknown
  barberos: unknown
}

export function AgendaCalendar({ items }: { items: AgendaItem[] }) {
  if (!items.length) {
    return <p className="text-zinc-500 text-sm">No hay citas para hoy</p>
  }

  return (
    <div className="space-y-2">
      {items.map(r => (
        <div key={r.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.estado === 'completada' ? 'bg-green-500' : 'bg-yellow-400'}`} />
          <span className="text-white font-mono text-sm w-12">
            {new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-white flex-1">{r.cliente_nombre ?? 'Sin nombre'}</span>
          <span className="text-zinc-400 text-sm">{(r.servicios as unknown as { nombre: string })?.nombre}</span>
          <span className="text-zinc-500 text-sm">{(r.barberos as unknown as { nombre: string })?.nombre}</span>
        </div>
      ))}
    </div>
  )
}
