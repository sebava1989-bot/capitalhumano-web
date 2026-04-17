'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet } from '@/lib/api'

interface DashboardData {
  at_risk_members: { id: number; full_name: string; last_workout: string }[]
  recent_activity: { full_name: string; date: string; routine_name: string }[]
}

export default function AlertsPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    apiGet<DashboardData>('/dashboard').then(setData).catch(console.error)
  }, [])

  const atRisk = data?.at_risk_members ?? []
  const recent = data?.recent_activity ?? []

  return (
    <>
      <Topbar title="Alertas" subtitle="Miembros en riesgo y actividad reciente" />
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="font-bold text-[#1a1a1a]">Sin entrenar +7 días ({atRisk.length})</h3>
          </div>
          {atRisk.length === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todos activos! 🎉</p>
          ) : (
            <div className="space-y-3">
              {atRisk.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center font-extrabold text-red-400">{m.full_name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a1a1a]">{m.full_name}</p>
                    <p className="text-xs text-[#6b7280]">Último entreno: {m.last_workout}</p>
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-lg">Contactar</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-bold text-[#1a1a1a]">Actividad reciente</h3>
          </div>
          <div className="space-y-3">
            {recent.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#f5f5f7] rounded-xl">
                <span className="text-xl">✅</span>
                <div className="flex-1">
                  <p className="text-sm text-[#1a1a1a]">{a.full_name} completó {a.routine_name}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{a.date}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-[#6b7280]">Sin actividad reciente</p>}
          </div>
        </div>
      </div>
    </>
  )
}
