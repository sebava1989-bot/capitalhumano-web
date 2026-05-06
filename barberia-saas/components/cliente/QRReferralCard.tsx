'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

interface Props {
  referralCode: string
  slug: string
  descuentoPct: number
}

export function QRReferralCard({ referralCode, slug, descuentoPct }: Props) {
  const [show, setShow] = useState(false)
  const apkUrl = 'https://github.com/sebava1989-bot/capitalhumano-web/releases/download/v1.0.0-cliente/app-release.apk'

  return (
    <div>
      <button
        onClick={() => setShow(v => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 text-white font-bold text-sm
          rounded-xl hover:bg-zinc-600 transition-colors w-full justify-center"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
          <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-3 0h1v1h-1v-1zm1 1h1v1h-1v-1zm1 1h1v1h-1v-1zm-2 0h1v1h-1v-1zm0 2h1v1h-1v-1zm2 0h1v1h-1v-1zm1 1h1v1h-1v-1zm-2 0h1v1h-1v-1z"/>
        </svg>
        {show ? 'Ocultar QR' : 'Mostrar QR para compartir en persona'}
      </button>

      {show && (
        <div className="mt-3 p-4 bg-white rounded-2xl flex flex-col items-center gap-3">
          <QRCodeSVG
            value={apkUrl}
            size={180}
            bgColor="#ffffff"
            fgColor="#09090b"
            level="M"
          />
          <p className="text-zinc-800 text-xs text-center font-medium">
            Escanea para descargar la app (Android)
          </p>
          <div className="bg-zinc-100 rounded-lg px-3 py-1">
            <span className="text-zinc-500 text-xs">Código de referido: </span>
            <span className="text-zinc-900 font-bold text-sm tracking-widest">{referralCode}</span>
          </div>
          <p className="text-zinc-400 text-xs text-center">
            Tu amigo ingresa este código al registrarse y obtiene {descuentoPct}% de descuento
          </p>
        </div>
      )}
    </div>
  )
}
