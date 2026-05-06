import { DemoButton } from './DemoButton'

interface PricingProps {
  phone: string
}

export function Pricing({ phone }: PricingProps) {
  return (
    <section
      className="relative overflow-hidden px-6 py-32 text-center"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[120px]"
        style={{ width: '600px', height: '350px', background: '#F59E0B' }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(245,158,11,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <p
          className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-600"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          Precio
        </p>

        <div
          className="leading-none text-amber-400"
          style={{
            fontFamily: 'var(--font-anton)',
            fontSize: 'clamp(5rem, 20vw, 14rem)',
          }}
        >
          $15.000
        </div>

        <p
          className="mb-2 text-2xl text-zinc-300"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          al mes por barbería
        </p>

        <div className="my-8 flex items-center justify-center gap-4">
          <div className="h-px flex-1 max-w-[120px]" style={{ background: 'rgba(245,158,11,0.3)' }} />
          <p
            className="text-center text-base text-zinc-400 max-w-xs"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            La mitad de lo que cuesta una membresía al gym —<br />
            <span className="text-white font-semibold">y tu barbería trabaja sola.</span>
          </p>
          <div className="h-px flex-1 max-w-[120px]" style={{ background: 'rgba(245,158,11,0.3)' }} />
        </div>

        <p
          className="mb-12 text-sm text-zinc-600"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          Sin contrato · Sin letra chica · Cancela cuando quieras
        </p>

        <DemoButton phone={phone} />

        <p
          className="mt-6 text-sm text-zinc-600"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          Demo gratuita — lo ves funcionando con el nombre de tu barbería
        </p>
      </div>
    </section>
  )
}
