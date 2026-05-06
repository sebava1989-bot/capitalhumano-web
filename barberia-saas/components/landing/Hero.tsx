import { DemoButton } from './DemoButton'

interface HeroProps {
  phone: string
}

export function Hero({ phone }: HeroProps) {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center bg-zinc-900 px-6 py-24 text-center text-white">
      <span className="mb-4 rounded-full bg-zinc-700 px-4 py-1 text-sm font-medium text-zinc-300">
        barberDesk
      </span>
      <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
        Don Rodrigo perdía 2 horas al día en WhatsApp.{' '}
        <span className="text-amber-400">Ahora su barbería se llena sola.</span>
      </h1>
      <p className="mb-10 max-w-xl text-xl text-zinc-300">
        Sistema de reservas, clientes y marketing para tu barbería —{' '}
        <span className="font-bold text-white">$15.000/mes.</span>
      </p>
      <DemoButton phone={phone} />
    </section>
  )
}
