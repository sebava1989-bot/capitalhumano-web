'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWAButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed || !prompt) return null

  return (
    <button
      onClick={async () => {
        await prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === 'accepted') setInstalled(true)
        setPrompt(null)
      }}
      className="w-full flex items-center justify-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-xl py-3 text-sm font-medium hover:bg-yellow-400/20 transition-colors"
    >
      📲 Instalar app en tu celular
    </button>
  )
}
