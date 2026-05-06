const before = [
  { icon: '📱', text: 'Reservas por WhatsApp que se pierden o se olvidan' },
  { icon: '📊', text: 'Sin idea de qué servicio vende más ni quién es tu mejor cliente' },
  { icon: '😶', text: 'Clientes que no vuelven porque nadie los llama' },
]

const after = [
  { icon: '✅', text: 'Reservas online 24/7 desde el celular del cliente' },
  { icon: '✅', text: 'Panel con estadísticas reales de tu negocio' },
  { icon: '✅', text: 'Sistema de referidos y descuentos automáticos que fideliza' },
]

export function BeforeAfter() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-2xl font-bold text-zinc-800">Sin barberDesk</h2>
          <ul className="space-y-4">
            {before.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-zinc-600">
                <span className="text-2xl">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-6 text-2xl font-bold text-zinc-800">Con barberDesk</h2>
          <ul className="space-y-4">
            {after.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-zinc-700">
                <span className="text-2xl">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
