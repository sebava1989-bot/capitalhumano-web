'use client'
import { useState, useEffect } from 'react'

export function PWAInstallPrompt() {
  const [androidPrompt, setAndroidPrompt] = useState<Event & { prompt?: () => Promise<void> } | null>(null)
  const [showIOS, setShowIOS] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('pwa-dismissed')) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true)

    if (isIOS && !isStandalone) {
      setShowIOS(true)
      setDismissed(false)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setAndroidPrompt(e as Event & { prompt?: () => Promise<void> })
      setDismissed(false)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (!androidPrompt || !('prompt' in androidPrompt)) return
    await androidPrompt.prompt?.()
    dismiss()
  }

  if (dismissed) return null

  if (showIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-40
        flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold mb-0.5">Agregar a pantalla de inicio</p>
          <p className="text-zinc-400 text-xs">
            Toca <strong className="text-white">Compartir</strong> <span className="text-base">⎙</span> y luego <strong className="text-white">&quot;Agregar a inicio&quot;</strong> para acceder rápido sin abrir el navegador.
          </p>
        </div>
        <button onClick={dismiss} className="text-zinc-500 hover:text-white text-lg flex-shrink-0">✕</button>
      </div>
    )
  }

  if (androidPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-40
        flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Instalar en tu celular</p>
          <p className="text-zinc-400 text-xs">Accede rápido desde tu pantalla de inicio</p>
        </div>
        <button onClick={install}
          className="bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-300 flex-shrink-0">
          Instalar
        </button>
        <button onClick={dismiss} className="text-zinc-500 hover:text-white text-lg flex-shrink-0">✕</button>
      </div>
    )
  }

  return null
}
