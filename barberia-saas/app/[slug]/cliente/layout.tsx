import { PushPermission } from '@/components/push/PushPermission'
import { PWAInstallPrompt } from '@/components/cliente/PWAInstallPrompt'

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <div className="max-w-lg mx-auto px-4 py-6 flex-1 w-full">{children}</div>
      <footer className="text-center py-4 text-zinc-700 text-xs">
        Desarrollado por <span className="text-zinc-500 font-medium">Tu Amigo Digital SpA</span>
      </footer>
      <PushPermission />
      <PWAInstallPrompt />
    </div>
  )
}
