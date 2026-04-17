'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet } from '@/lib/api'

interface RankMember {
  rank: number
  full_name: string
  points: number
  streak: number
  level: number
}

const MEDALS = ['🥇', '🥈', '🥉']

function levelName(level: number) {
  if (level >= 7) return 'Avanzado'
  if (level >= 4) return 'Intermedio'
  return 'Principiante'
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<RankMember[]>('/ranking').then(data => { setRanking(data); setLoading(false) }).catch(console.error)
  }, [])

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando ranking...</div>

  const top3 = ranking.slice(0, 3)
  const rest  = ranking.slice(3)

  return (
    <>
      <Topbar title="Ranking" subtitle="Top miembros del gimnasio por puntos" />

      {/* Podio top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {top3.map((m, i) => (
            <div key={m.rank} className={`bg-white rounded-2xl border p-5 text-center ${i === 0 ? 'border-yellow-300 shadow-lg shadow-yellow-100' : 'border-[#e5e7eb]'}`}>
              <div className="text-3xl mb-2">{MEDALS[i]}</div>
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-xl font-extrabold text-[#FF4D00] mx-auto mb-3">
                {m.full_name[0]}
              </div>
              <p className="font-extrabold text-[#1a1a1a] text-sm">{m.full_name}</p>
              <p className="text-xs text-[#6b7280] mt-0.5">{levelName(m.level)}</p>
              <p className="text-2xl font-extrabold text-[#FF4D00] mt-2">{m.points.toLocaleString()}</p>
              <p className="text-xs text-[#6b7280]">puntos</p>
              <p className="text-xs text-[#6b7280] mt-2">🔥 {m.streak} días de racha</p>
            </div>
          ))}
        </div>
      )}

      {/* Resto del ranking */}
      {rest.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f5f5f7]">
                {['#', 'Nombre', 'Nivel', 'Racha', 'Puntos'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rest.map(m => (
                <tr key={m.rank} className="border-b border-[#f5f5f7] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3 text-sm font-bold text-[#6b7280]">#{m.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00]">{m.full_name[0]}</div>
                      <span className="text-sm font-semibold text-[#1a1a1a]">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-orange-50 text-[#FF4D00]">Nv.{m.level} {levelName(m.level)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">🔥 {m.streak}d</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#FF4D00]">{m.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
