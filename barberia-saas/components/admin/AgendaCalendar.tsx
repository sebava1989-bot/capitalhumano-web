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
    return <p className="text-gray-400 text-sm">No hay citas para hoy</p>
  }

  return (
    <div className="space-y-2">
      {items.map(r => (
        <div key={r.id}
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-3
            shadow-sm hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.estado === 'completada' ? 'bg-green-500' : 'bg-yellow-400'}`} />
          <span className="text-gray-900 font-mono text-sm w-12">
            {new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-gray-900 flex-1">{r.cliente_nombre ?? 'Sin nombre'}</span>
          <span className="text-gray-500 text-sm">{(r.servicios as unknown as { nombre: string })?.nombre}</span>
          <span className="text-gray-400 text-sm">{(r.barberos as unknown as { nombre: string })?.nombre}</span>
        </div>
      ))}
    </div>
  )
}
