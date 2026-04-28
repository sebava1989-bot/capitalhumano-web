import { PushPermission } from '@/components/push/PushPermission'

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6">{children}</div>
      <PushPermission />
    </div>
  )
}
