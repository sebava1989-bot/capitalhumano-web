const items = [
  {
    num: '→',
    tag: 'Más citas. Sin esfuerzo.',
    headline: 'Comparte tu barbería con un QR.\nLas citas llegan solas.',
    body: 'Imprime tu código QR, súbelo a tus redes, ponlo en la ventana. Cada escaneo es una reserva directa. Sin intermediarios, sin WhatsApp, sin "¿hay hora para el viernes?".',
    accent: 'Una foto en Instagram = citas en automático.',
  },
  {
    num: '→',
    tag: 'Clientes que traen clientes.',
    headline: 'Referidos que premian\na todos.',
    body: 'Tu cliente invita a un amigo y ambos ganan un descuento en su próximo corte. El nuevo cliente llega con un regalo de bienvenida y siente desde el primer día que entró a algo especial. No a una barbería más.',
    accent: 'Una comunidad que crece sola.',
  },
  {
    num: '→',
    tag: 'Tu barbería mejora cada semana.',
    headline: 'Un libro de sugerencias\nque sí se lee.',
    body: 'Felicitaciones, ideas, reclamos — todo llega directo desde la app de tu cliente. Sin papeles, sin vergüenza, sin que se vayan sin decirte nada. Tus clientes te llevan al siguiente nivel.',
    accent: 'Innova antes que tu competencia.',
  },
]

export function PowerFeatures() {
  return (
    <section style={{ backgroundColor: '#0f0f0f' }} className="px-6 py-24">
      <div className="mx-auto max-w-5xl space-y-1">
        {items.map((item, i) => (
          <div
            key={item.tag}
            className="group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:bg-zinc-900 md:p-12"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Hover glow */}
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-15"
              style={{ background: '#F59E0B' }}
            />

            <div className="relative grid gap-6 md:grid-cols-2 md:gap-12">
              {/* Left */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="text-2xl text-amber-400"
                    style={{ fontFamily: 'var(--font-anton)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {item.tag}
                  </span>
                </div>
                <h3
                  className="whitespace-pre-line leading-tight text-white"
                  style={{
                    fontFamily: 'var(--font-anton)',
                    fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                  }}
                >
                  {item.headline}
                </h3>
              </div>

              {/* Right */}
              <div className="flex flex-col justify-center">
                <p
                  className="mb-5 leading-relaxed text-zinc-400"
                  style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1rem' }}
                >
                  {item.body}
                </p>
                <span
                  className="inline-block text-sm font-bold text-amber-400"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {item.accent}
                </span>
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-0 h-px w-0 bg-amber-400 transition-all duration-500 group-hover:w-full"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
