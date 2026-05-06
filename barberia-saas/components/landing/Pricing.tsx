import { DemoButton } from './DemoButton'

interface PricingProps {
  phone: string
}

export function Pricing({ phone }: PricingProps) {
  return (
    <section className="bg-zinc-900 px-6 py-24 text-center text-white">
      <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl">
        Todo esto por{' '}
        <span className="text-amber-400">$15.000 al mes.</span>
      </h2>
      <p className="mb-10 text-lg text-zinc-400">
        Sin contrato. Sin letra chica. Si no te sirve, lo cancelas.
      </p>
      <p className="mb-8 text-2xl font-bold">
        ¿Le das una oportunidad a tu barbería?
      </p>
      <DemoButton phone={phone} />
    </section>
  )
}
