import { Hero } from '@/components/landing/Hero'
import { BeforeAfter } from '@/components/landing/BeforeAfter'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'

const DEMO_PHONE = '56912345678' // TODO: reemplazar con número real de contacto

export default function RootPage() {
  return (
    <main>
      <Hero phone={DEMO_PHONE} />
      <BeforeAfter />
      <Features />
      <Pricing phone={DEMO_PHONE} />
    </main>
  )
}
