const before = [
  'Reservas por WhatsApp que se pierden o se olvidan',
  'Sin idea de qué servicio vende más ni quién es tu mejor cliente',
  'Clientes que no vuelven porque nadie los llama',
]

const after = [
  'Reservas online 24/7 desde el celular del cliente',
  'Panel con estadísticas reales de tu negocio',
  'Sistema de referidos y descuentos automáticos que fideliza',
]

export function BeforeAfter() {
  return (
    <section style={{ backgroundColor: '#0f0f0f' }} className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <p
          className="mb-16 text-center text-xs font-bold uppercase tracking-widest text-zinc-600"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          La diferencia
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span
                className="text-xs font-bold uppercase tracking-widest text-zinc-600"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Sin barberDesk
              </span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <ul className="space-y-5">
              {before.map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-700">
                    ✕
                  </span>
                  <span
                    className="text-zinc-500 leading-snug"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.3)' }} />
              <span
                className="text-xs font-bold uppercase tracking-widest text-amber-400"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Con barberDesk
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.3)' }} />
            </div>
            <ul className="space-y-5">
              {after.map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245,158,11,0.35)',
                    }}
                  >
                    ✓
                  </span>
                  <span
                    className="leading-snug text-white"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
