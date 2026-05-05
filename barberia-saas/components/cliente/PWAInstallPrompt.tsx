'use client'
import { useState, useEffect } from 'react'

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [useNative, setUseNative] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('pwa-dismissed')) return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true)
    if (isStandalone) return

    const ua = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    const android = /android/.test(ua)

    if (!ios && !android) return

    // Registrar SW para habilitar beforeinstallprompt en futuras visitas
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => null)
    }

    setIsIOS(ios)
    setVisible(true) // mostrar instrucciones manuales de inmediato

    // Si Chrome ofrece el prompt nativo, usarlo en lugar de instrucciones
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> })
      setUseNative(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setVisible(false)
  }

  async function installNative() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    dismiss()
  }

  if (!visible) return null

  // Prompt nativo disponible (Android Chrome tras varias visitas)
  if (useNative) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-yellow-400/30 rounded-2xl p-4 shadow-2xl z-40 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Instalar en tu celular</p>
          <p className="text-zinc-400 text-xs">Accede rápido desde tu pantalla de inicio</p>
        </div>
        <button onClick={installNative}
          className="bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-300 flex-shrink-0">
          Instalar
        </button>
        <button onClick={dismiss} className="text-zinc-500 hover:text-white text-lg flex-shrink-0">✕</button>
      </div>
    )
  }

  // Instrucciones manuales iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-40">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold mb-1">Agregar a pantalla de inicio</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Toca <strong className="text-white">Compartir ⎙</strong> abajo y luego{' '}
              <strong className="text-white">"Agregar a inicio"</strong> para acceder como app.
            </p>
          </div>
          <button onClick={dismiss} className="text-zinc-500 hover:text-white text-xl flex-shrink-0 leading-none">✕</button>
        </div>
      </div>
    )
  }

  // Instrucciones manuales Android Chrome
  return (
    <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-40">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📲</span>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold mb-1">Agregar a pantalla de inicio</p>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Toca el menú <strong className="text-white">⋮</strong> (tres puntos) arriba a la derecha
            en Chrome y selecciona <strong className="text-white">"Agregar a pantalla de inicio"</strong>.
          </p>
        </div>
        <button onClick={dismiss} className="text-zinc-500 hover:text-white text-xl flex-shrink-0 leading-none">✕</button>
      </div>
    </div>
  )
}
