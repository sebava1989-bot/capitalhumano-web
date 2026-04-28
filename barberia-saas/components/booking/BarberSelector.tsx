'use client'
interface Barbero { id: string; nombre: string; foto_url: string | null }
interface Props { barberos: Barbero[]; selected: Barbero | null; onSelect: (b: Barbero) => void; onBack: () => void }

export function BarberSelector({ barberos, selected, onSelect, onBack }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">¿Con quién quieres atenderte?</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {barberos.map(b => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className={`flex flex-col items-center p-3 rounded-xl border transition-all
              ${selected?.id === b.id ? 'border-yellow-400 bg-yellow-400/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
          >
            <div className="w-14 h-14 rounded-full bg-zinc-700 mb-2 overflow-hidden">
              {b.foto_url
                ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-400">{b.nombre[0]}</div>
              }
            </div>
            <span className="text-sm text-white">{b.nombre}</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-zinc-400 text-sm hover:text-white transition-colors">← Volver</button>
    </div>
  )
}
