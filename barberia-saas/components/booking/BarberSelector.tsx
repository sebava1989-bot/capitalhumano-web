'use client'
interface Barbero { id: string; nombre: string; foto_url: string | null; descripcion?: string | null }
interface Props { barberos: Barbero[]; selected: Barbero | null; onSelect: (b: Barbero) => void; onBack: () => void }

export function BarberSelector({ barberos, selected, onSelect, onBack }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">¿Con quién quieres atenderte?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {barberos.map(b => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
              backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-xl
              ${selected?.id === b.id
                ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_20px_rgba(250,204,21,0.15)]'
                : 'border-white/10 bg-white/5 hover:border-white/20'}`}
          >
            <div className="w-14 h-14 rounded-full bg-zinc-700 shrink-0 overflow-hidden">
              {b.foto_url
                ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-300">{b.nombre[0]}</div>
              }
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">{b.nombre}</p>
              {b.descripcion && (
                <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">{b.descripcion}</p>
              )}
            </div>
            {selected?.id === b.id && (
              <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                <span className="text-black text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-zinc-400 text-sm hover:text-white transition-colors">← Volver</button>
    </div>
  )
}
