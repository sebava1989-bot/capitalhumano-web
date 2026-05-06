const features = [
  {
    icon: '📅',
    title: 'Reserva en 3 pasos',
    desc: 'El cliente elige barbero, servicio y hora desde su celular. Sin llamadas, sin WhatsApp.',
  },
  {
    icon: '📲',
    title: 'App admin en tu bolsillo',
    desc: 'Ve la agenda del día, gestiona clientes y servicios desde la app móvil.',
  },
  {
    icon: '🔔',
    title: 'Recordatorios automáticos',
    desc: 'Emails automáticos 24h antes de cada reserva. Cero no-shows.',
  },
  {
    icon: '🎯',
    title: 'Campañas con IA',
    desc: 'Manda descuentos personalizados a tus clientes con un clic. La IA escribe los mensajes.',
  },
]

export function Features() {
  return (
    <section className="bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900">
          Así funciona barberDesk
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <span className="mb-3 block text-4xl">{f.icon}</span>
              <h3 className="mb-2 font-bold text-zinc-900">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
