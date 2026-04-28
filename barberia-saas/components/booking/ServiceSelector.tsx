'use client'
interface Servicio { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number }
interface Props { servicios: Servicio[]; selected: Servicio | null; onSelect: (s: Servicio) => void }

export function ServiceSelector({ servicios, selected, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold mb-4">¿Qué servicio necesitas?</h2>
      {servicios.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className={`w-full text-left p-4 rounded-xl border transition-all
            ${selected?.id === s.id
              ? 'border-yellow-400 bg-yellow-400/10'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-white">{s.nombre}</p>
              {s.descripcion && <p className="text-zinc-400 text-sm mt-0.5">{s.descripcion}</p>}
              <p className="text-zinc-500 text-xs mt-1">{s.duracion_min} min</p>
            </div>
            <p className="text-yellow-400 font-bold text-lg">
              ${s.precio.toLocaleString('es-CL')}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
