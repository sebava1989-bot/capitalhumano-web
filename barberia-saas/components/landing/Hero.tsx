import { DemoButton } from './DemoButton'

interface HeroProps {
  phone: string
}

export function Hero({ phone }: HeroProps) {
  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
      style={{
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(rgba(245,158,11,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[140px]"
        style={{ width: '700px', height: '400px', background: '#F59E0B' }}
      />

      <div className="relative z-10 max-w-5xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span
            className="text-xs font-bold uppercase tracking-widest text-amber-400"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            barberDesk
          </span>
        </div>

        <h1
          className="mb-6 leading-none tracking-tight text-white"
          style={{
            fontFamily: 'var(--font-anton)',
            fontSize: 'clamp(3.5rem, 11vw, 10rem)',
          }}
        >
          TU BARBERÍA
          <br />
          <span style={{ color: '#F59E0B' }}>SE LLENA SOLA.</span>
        </h1>

        <p
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          Don Rodrigo perdía 2 horas al día coordinando WhatsApps. Hoy su agenda se llena
          online, sus clientes vuelven solos y sabe exactamente qué servicios le dejan más plata.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <DemoButton phone={phone} />
          <span className="text-sm text-zinc-600" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Sin contrato · $15.000/mes
          </span>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
        style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0a)' }}
      />
    </section>
  )
}
