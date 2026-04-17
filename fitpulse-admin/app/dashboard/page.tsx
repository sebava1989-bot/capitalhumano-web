import StatCard from '@/components/stat-card'
import BarChart from '@/components/bar-chart'
import Topbar from '@/components/topbar'
import { DASHBOARD_STATS, WORKOUTS_PER_DAY, MEMBERS, RECENT_ACTIVITY, AT_RISK, getPaymentStatus, getDaysOverdue, getDaysUntilDue } from '@/lib/mock-data'

export default function DashboardPage() {
  const top5 = [...MEMBERS].sort((a, b) => b.points - a.points).slice(0, 5)
  const overdueMembers = MEMBERS.filter(m => getPaymentStatus(m) === 'overdue')
  const dueSoonMembers = MEMBERS.filter(m => getPaymentStatus(m) === 'due_soon')

  return (
    <>
      <Topbar title="Bienvenido, Pedro 👋" subtitle="Resumen de PowerGym Santiago — hoy" />

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Miembros activos" value={DASHBOARD_STATS.activeMembers} sub="socios registrados" />
        <StatCard label="Entrenamientos hoy" value={DASHBOARD_STATS.workoutsToday} sub="sesiones completadas" color="#FF4D00" />
        <StatCard label="Racha promedio" value={DASHBOARD_STATS.avgStreak} sub="días seguidos" color="#f59e0b" />
        <StatCard label="En riesgo" value={DASHBOARD_STATS.atRisk} sub="sin entrenar +7 días" color="#ef4444" />
        <StatCard label="Cobros pendientes" value={DASHBOARD_STATS.overduePayments + DASHBOARD_STATS.dueSoonPayments} sub="vencidos o próximos" color="#8b5cf6" />
      </div>

      {/* Payment alert banner */}
      {(overdueMembers.length > 0 || dueSoonMembers.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl mt-0.5">💳</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 mb-1">Recordatorio de cobros</p>
            <p className="text-sm text-amber-700">
              {overdueMembers.length > 0 && (
                <span className="text-red-600 font-semibold">{overdueMembers.length} miembro{overdueMembers.length > 1 ? 's' : ''} con pago vencido. </span>
              )}
              {dueSoonMembers.length > 0 && (
                <span>{dueSoonMembers.length} miembro{dueSoonMembers.length > 1 ? 's' : ''} con pago próximo a vencer. </span>
              )}
              <a href="/dashboard/payments" className="underline font-semibold text-amber-800 hover:text-amber-900">Ver cobros →</a>
            </p>
          </div>
        </div>
      )}

      {/* Chart + Top members */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#1a1a1a]">Entrenamientos por día</h3>
            <span className="text-xs text-[#6b7280]">últimos 7 días</span>
          </div>
          <BarChart data={WORKOUTS_PER_DAY} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">Top miembros del mes</h3>
          <div className="space-y-3">
            {top5.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs text-[#6b7280] w-4">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00] shrink-0">
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{m.name}</p>
                  <p className="text-xs text-[#6b7280]">🔥 {m.streak} días</p>
                </div>
                <span className="text-xs font-bold text-[#FF4D00]">{m.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Cobros vencidos */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Cobros vencidos ({overdueMembers.length})</h3>
          </div>
          {overdueMembers.length === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todo al día! 🎉</p>
          ) : (
            <div className="space-y-2">
              {overdueMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-400">{m.name[0]}</div>
                  <span className="flex-1 text-xs font-medium text-[#1a1a1a] truncate">{m.name}</span>
                  <span className="text-[10px] font-bold text-red-500">{getDaysOverdue(m)}d atraso</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cobros próximos */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Vencen pronto ({dueSoonMembers.length})</h3>
          </div>
          {dueSoonMembers.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Ninguno por ahora</p>
          ) : (
            <div className="space-y-2">
              {dueSoonMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                  <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-500">{m.name[0]}</div>
                  <span className="flex-1 text-xs font-medium text-[#1a1a1a] truncate">{m.name}</span>
                  <span className="text-[10px] font-bold text-amber-500">en {getDaysUntilDue(m)}d</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Actividad reciente</h3>
          </div>
          <div className="space-y-2">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                <span className="text-sm">{a.emoji}</span>
                <span className="flex-1 text-xs text-[#1a1a1a]">{a.text}</span>
                <span className="text-[10px] text-[#6b7280] shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
