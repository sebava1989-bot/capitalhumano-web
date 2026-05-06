export const metadata = {
  title: 'Guión de ventas — barberDesk',
}

const sections = [
  {
    time: '0:00 – 0:30',
    title: 'Apertura',
    text: `Cuéntame una cosa — ¿cuántos mensajes de WhatsApp recibiste esta semana solo para coordinar horas? ¿10? ¿20? ¿Más?

Eso es tiempo que no estás cortando pelo. Tiempo que no estás ganando plata.`,
  },
  {
    time: '0:30 – 1:30',
    title: 'La Historia',
    text: `Don Rodrigo tiene una barbería en Maipú. Buena clientela, buenos barberos. Pero vivía pegado al celular respondiendo mensajes, y aun así la agenda tenía huecos.

No sabía cuál de sus servicios dejaba más plata. No sabía quiénes eran sus clientes más fieles. Y cuando un cliente dejaba de venir... simplemente desaparecía.

Hoy Don Rodrigo abre el panel en el celular, ve la agenda del día, sabe qué servicios están volando y manda descuentos a sus clientes con un clic. Todo desde la app.`,
  },
  {
    time: '1:30 – 2:30',
    title: 'La Solución',
    text: `Esto es barberDesk. Un sistema completo para tu barbería:
— Tus clientes reservan online, solos, a cualquier hora.
— Tú ves todo en un panel: agenda, estadísticas, clientes.
— El sistema manda recordatorios automáticos para que nadie se olvide.
— Y cuando quieres llenar la semana, mandas una campaña de descuentos en dos clics.`,
  },
  {
    time: '2:30 – 2:50',
    title: 'El Precio',
    text: `¿Cuánto cuesta todo esto? Quince mil pesos al mes. Sin contrato, sin letra chica. Si no te sirve, lo cancelas. Pero te apuesto que no vas a querer.`,
  },
  {
    time: '2:50 – 3:00',
    title: 'Cierre',
    text: `¿Le damos una oportunidad a tu barbería? Te armo una demo gratis esta semana y lo ves funcionando con tu nombre.`,
  },
]

export default function GuionPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 print:py-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900">barberDesk</h1>
        <p className="mt-1 text-zinc-500">Guión de presentación de ventas (~3 min)</p>
      </div>
      <div className="space-y-8">
        {sections.map((s) => (
          <div key={s.title} className="border-l-4 border-amber-400 pl-5">
            <div className="mb-1 flex items-baseline gap-3">
              <span className="text-lg font-bold text-zinc-900">{s.title}</span>
              <span className="text-sm text-zinc-400">{s.time}</span>
            </div>
            <p className="whitespace-pre-line text-zinc-700">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 rounded-xl bg-zinc-100 p-6 text-center print:hidden">
        <p className="text-zinc-500 text-sm">Para imprimir: Ctrl+P / Cmd+P</p>
      </div>
    </main>
  )
}
