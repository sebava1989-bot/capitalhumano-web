'use client'

import { useEffect, useState } from 'react'

const APK_URL = 'https://github.com/sebava1989-bot/capitalhumano-web/releases/download/v1.0.0-cliente/app-release.apk'

export function AppDownloadBanner({ slug }: { slug: string }) {
  const [isAndroid, setIsAndroid] = useState<boolean | null>(null)

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent))
  }, [])

  if (isAndroid === null) return null

  if (isAndroid) {
    return (
      <div className="mx-4 mb-4 mt-2 rounded-2xl bg-zinc-900 border border-yellow-400/30 p-4 flex items-center gap-3">
        <span className="text-3xl">📱</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Descarga la app</p>
          <p className="text-zinc-400 text-xs">Reserva más rápido desde tu celular</p>
        </div>
        <a
          href={APK_URL}
          className="bg-yellow-400 text-black font-bold text-xs px-4 py-2 rounded-xl whitespace-nowrap shrink-0"
        >
          Descargar APK
        </a>
      </div>
    )
  }

  return (
    <div className="mx-4 mb-4 mt-2 rounded-2xl bg-zinc-900 border border-zinc-700 p-4 flex items-center gap-3">
      <span className="text-3xl">🍎</span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm">iPhone: guarda esta página</p>
        <p className="text-zinc-400 text-xs">Toca Compartir → &quot;Añadir a pantalla de inicio&quot; para acceder como app</p>
      </div>
    </div>
  )
}
