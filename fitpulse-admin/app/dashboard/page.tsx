'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/stat-card'
import BarChart from '@/components/bar-chart'
import Topbar from '@/components/topbar'
import { apiGet, apiPatch } from '@/lib/api'
import { getGymInfo } from '@/lib/auth'

interface DashboardData {
  active_members: number
  workouts_today: number
  avg_streak: number
  at_risk_count: number
  overdue_payments: number
  due_soon_payments: number
  workouts_per_day: { date: string; count: string }[]
  top_members: { full_name: string; points: number; streak: number; level: number }[]
  at_risk_members: { id: number; full_name: string; last_workout: string }[]
  recent_activity: { full_name: string; date: string; routine_name: string }[]
}

interface ReferralStat {
  id: number
  full_name: string
  referral_code: string
  referral_count: number
  points_awarded: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [referrals, setReferrals] = useState<ReferralStat[]>([])
  const [referralPoints, setReferralPoints] = useState(300)
  const [editingPoints, setEditingPoints] = useState(false)
  const [pointsInput, setPointsInput] = useState('300')
  const gym = getGymInfo()

  useEffect(() => {
    apiGet<DashboardData>('/dashboard').then(setData).catch(console.error)
    apiGet<ReferralStat[]>('/admin/referrals').then(setReferrals).catch(console.error)
    apiGet<{ referral_points: number }>('/admin/referral-points')
      .then(d => { setReferralPoints(d.referral_points); setPointsInput(String(d.referral_points)) })
      .catch(console.error)
  }, [])

  async function saveReferralPoints() {
    const pts = parseInt(pointsInput)
    if (!pts || pts < 50 || pts > 2000) return
    await apiPatch<{ ok: boolean; referral_points: number }>('/admin/referral-points', { referral_points: pts })
    setReferralPoints(pts)
    setEditingPoints(false)
  }

  if (!data) return <div className="p-8 text-[#6b7280] text-sm">Cargando...</div>

  const chartData = data.workouts_per_day.map(d => ({
    day: new Date(d.date).toLocaleDateString('es-CL', { weekday: 'short' }),
    count: parseInt(d.count),
  }))

  return (
    <>
      <Topbar title={`Bienvenido 👋`} subtitle={`Resumen de ${gym?.name || 'tu gimnasio'} — hoy`} />

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Miembros activos" value={data.active_members} sub="socios registrados" />
        <StatCard label="Entrenamientos hoy" value={data.workouts_today} sub="sesiones completadas" color="#FF4D00" />
        <StatCard label="Racha promedio" value={data.avg_streak} sub="días seguidos" color="#f59e0b" />
        <StatCard label="En riesgo" value={data.at_risk_count} sub="sin entrenar +7 días" color="#ef4444" />
        <StatCard label="Cobros pendientes" value={data.overdue_payments + data.due_soon_payments} sub="vencidos o próximos" color="#8b5cf6" />
      </div>

      {(data.overdue_payments > 0 || data.due_soon_payments > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl mt-0.5">💳</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 mb-1">Recordatorio de cobros</p>
            <p className="text-sm text-amber-700">
              {data.overdue_payments > 0 && (
                <span className="text-red-600 font-semibold">{data.overdue_payments} miembro{data.overdue_payments > 1 ? 's' : ''} con pago vencido. </span>
              )}
              {data.due_soon_payments > 0 && (
                <span>{data.due_soon_payments} miembro{data.due_soon_payments > 1 ? 's' : ''} con pago próximo a vencer. </span>
              )}
              <a href="/dashboard/payments" className="underline font-semibold text-amber-800 hover:text-amber-900">Ver cobros →</a>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1.6fr_1fr] gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#1a1a1a]">Entrenamientos por día</h3>
            <span className="text-xs text-[#6b7280]">últimos 7 días</span>
          </div>
          <BarChart data={chartData} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">Top miembros del mes</h3>
          <div className="space-y-3">
            {data.top_members.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#6b7280] w-4">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00] shrink-0">
                  {m.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{m.full_name}</p>
                  <p className="text-xs text-[#6b7280]">🔥 {m.streak} días</p>
                </div>
                <span className="text-xs font-bold text-[#FF4D00]">{m.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Sin entrenar +7 días ({data.at_risk_members.length})</h3>
          </div>
          {data.at_risk_members.length === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todos activos! 🎉</p>
          ) : (
            <div className="space-y-2">
              {data.at_risk_members.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-400">{m.full_name[0]}</div>
                  <span className="flex-1 text-xs font-medium text-[#1a1a1a] truncate">{m.full_name}</span>
                  <span className="text-[10px] font-bold text-red-500">{m.last_workout}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Cobros vencidos ({data.overdue_payments})</h3>
          </div>
          {data.overdue_payments === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todo al día! 🎉</p>
          ) : (
            <p className="text-sm text-red-500 font-semibold">{data.overdue_payments} pago{data.overdue_payments > 1 ? 's' : ''} vencido{data.overdue_payments > 1 ? 's' : ''}</p>
          )}
          <a href="/dashboard/payments" className="text-xs text-[#FF4D00] font-semibold mt-3 block hover:underline">Ver cobros →</a>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Actividad reciente</h3>
          </div>
          <div className="space-y-2">
            {data.recent_activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                <span className="text-sm">✅</span>
                <span className="flex-1 text-xs text-[#1a1a1a]">{a.full_name} completó {a.routine_name}</span>
                <span className="text-[10px] text-[#6b7280] shrink-0">{a.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referidos */}
      <div className="mt-6 grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1a1a1a]">🔗 Top referidores</h3>
            <span className="text-xs text-[#6b7280]">{referrals.length} miembros con referidos</span>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Aún no hay referidos. ¡Comparte los códigos!</p>
          ) : (
            <div className="space-y-3">
              {referrals.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00] shrink-0">
                    {r.full_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">{r.full_name}</p>
                    <p className="text-xs text-[#6b7280]">Código: {r.referral_code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#FF4D00]">{r.referral_count} referido{r.referral_count !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-[#6b7280]">+{r.points_awarded} pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">⚙️ Puntos por referido</h3>
          <p className="text-xs text-[#6b7280] mb-3">Puntos que gana un miembro cuando trae a alguien nuevo al gym.</p>
          {editingPoints ? (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={pointsInput}
                onChange={e => setPointsInput(e.target.value)}
                min={50}
                max={2000}
                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
              />
              <button onClick={saveReferralPoints} className="px-3 py-2 rounded-xl bg-[#FF4D00] text-white text-sm font-bold hover:bg-[#CC3D00]">
                Guardar
              </button>
              <button onClick={() => setEditingPoints(false)} className="px-3 py-2 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-3xl font-extrabold text-[#FF4D00]">{referralPoints} <span className="text-base font-semibold text-[#6b7280]">pts</span></p>
              <button onClick={() => setEditingPoints(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">
                Editar
              </button>
            </div>
          )}
          <p className="text-xs text-[#6b7280] mt-3">Total entregado: <span className="font-bold text-[#1a1a1a]">{referrals.reduce((a,r)=>a+r.points_awarded,0).toLocaleString()} pts</span></p>
        </div>
      </div>
    </>
  )
}
