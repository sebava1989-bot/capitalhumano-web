'use client'
import { useState, useEffect } from 'react'

type Mode = 'native' | 'android-manual' | 'ios' | 'hidden'

export function PWAInstallPrompt() {
  const [mode, setMode] = useState<Mode>('hidden')
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('pwa-dismissed')) return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true)
    if (isStandalone) return

    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isAndroid = /android/.test(ua)

    // Registrar service worker para habilitar beforeinstallprompt
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => null)
    }

    if (isIOS) {
      setMode('ios')
      return
    }

    if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as unknown as { prompt: () => Promise<void> })
        setMode('native')
      }
      window.addEventListener('beforeinstallprompt', handler)

      // Si el evento no llega en 3s, mostrar instrucciones manuales
      const timer = setTimeout(() => {
        setMode(prev => prev === 'hidden' ? 'android-manual' : prev)
      }, 3000)

      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(timer)
      }
    }
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setMode('hidden')
  }

  async function installNative() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    dismiss()
  }

  if (mode === 'hidden') return null

  if (mode === 'native') {
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

  if (mode === 'android-manual') {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-40">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold mb-1">Agregar a pantalla de inicio</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              En Chrome, toca el menú <strong className="text-white">⋮</strong> (tres puntos arriba a la derecha) y selecciona <strong className="text-white">"Agregar a pantalla de inicio"</strong>.
            </p>
          </div>
          <button onClick={dismiss} className="text-zinc-500 hover:text-white text-lg flex-shrink-0">✕</button>
        </div>
      </div>
    )
  }

  // iOS
  return (
    <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-40">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📲</span>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold mb-1">Agregar a pantalla de inicio</p>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Toca <strong className="text-white">Compartir</strong> <span className="text-base">⎙</span> y luego <strong className="text-white">"Agregar a inicio"</strong> para acceder sin abrir el navegador.
          </p>
        </div>
        <button onClick={dismiss} className="text-zinc-500 hover:text-white text-lg flex-shrink-0">✕</button>
      </div>
    </div>
  )
}
