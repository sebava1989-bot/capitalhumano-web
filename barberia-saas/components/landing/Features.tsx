const features = [
  {
    num: '01',
    title: 'Reserva en 3 pasos',
    desc: 'El cliente elige barbero, servicio y hora desde su celular. Sin llamadas, sin WhatsApp.',
  },
  {
    num: '02',
    title: 'App admin en tu bolsillo',
    desc: 'Ve la agenda del día, gestiona clientes y servicios desde la app móvil.',
  },
  {
    num: '03',
    title: 'Recordatorios automáticos',
    desc: 'Emails 24h antes de cada reserva. Cero no-shows, cero llamadas de confirmación.',
  },
  {
    num: '04',
    title: 'Campañas con IA',
    desc: 'Descuentos personalizados a tus clientes con un clic. La IA escribe los mensajes.',
  },
]

export function Features() {
  return (
    <section style={{ backgroundColor: '#0a0a0a' }} className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2
          className="mb-16 text-center leading-none text-white"
          style={{
            fontFamily: 'var(--font-anton)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          }}
        >
          ASÍ FUNCIONA
        </h2>

        <div className="grid gap-px bg-zinc-800 sm:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.num}
              className="group relative overflow-hidden bg-zinc-950 p-8 transition-colors duration-300 hover:bg-zinc-900"
            >
              <div
                className="mb-4 leading-none text-zinc-800 transition-colors duration-300 group-hover:text-amber-400/20"
                style={{ fontFamily: 'var(--font-anton)', fontSize: '4rem' }}
              >
                {f.num}
              </div>
              <h3
                className="mb-2 text-base font-bold text-white"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed text-zinc-500"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {f.desc}
              </p>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-amber-400 transition-all duration-500 group-hover:w-full" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
