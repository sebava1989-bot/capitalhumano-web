import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'
import { BeforeAfter } from '@/components/landing/BeforeAfter'
import { Features } from '@/components/landing/Features'
import { PowerFeatures } from '@/components/landing/PowerFeatures'
import { Pricing } from '@/components/landing/Pricing'

const DEMO_PHONE = '56912345678' // TODO: reemplazar con número real de contacto

export default function RootPage() {
  return (
    <main style={{ backgroundColor: '#0a0a0a' }}>
      <Hero phone={DEMO_PHONE} />
      <Stats />
      <BeforeAfter />
      <Features />
      <PowerFeatures />
      <Pricing phone={DEMO_PHONE} />
    </main>
  )
}
