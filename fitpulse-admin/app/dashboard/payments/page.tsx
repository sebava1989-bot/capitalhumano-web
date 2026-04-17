'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet, apiPatch } from '@/lib/api'
import { MessageCircle, CheckCircle } from 'lucide-react'

interface Subscription {
  id: number
  member_id: number
  full_name: string
  rut: string
  phone: string
  price: number
  due_day: number
  last_payment_date: string
  status: 'paid' | 'overdue' | 'due_soon' | 'pending'
  days_overdue: number
}

const STATUS_CFG = {
  paid:     { label: 'Al día',     cls: 'bg-green-50 text-green-600',  dot: 'bg-green-400' },
  due_soon: { label: 'Próx. pago', cls: 'bg-amber-50 text-amber-600',  dot: 'bg-amber-400' },
  overdue:  { label: 'Vencido',    cls: 'bg-red-50 text-red-500',      dot: 'bg-red-500'   },
  pending:  { label: 'Pendiente',  cls: 'bg-gray-50 text-[#6b7280]',   dot: 'bg-gray-300'  },
}

type FilterTab = 'all' | 'overdue' | 'due_soon' | 'paid' | 'pending'

export default function PaymentsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [confirming, setConfirming] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<Subscription[]>('/subscriptions')
      .then(data => { setSubs(data); setLoading(false) })
      .catch(console.error)
  }, [])

  async function markPaid(memberId: number) {
    const today = new Date().toISOString().split('T')[0]
    await apiPatch(`/subscriptions/${memberId}`, { last_payment_date: today })
    setSubs(prev => prev.map(s =>
      s.member_id === memberId ? { ...s, status: 'paid', last_payment_date: today, days_overdue: 0 } : s
    ))
    setConfirming(null)
  }

  function waMsg(s: Subscription) {
    const msg = s.status === 'overdue'
      ? `Hola ${s.full_name}, tu mensualidad de $${s.price.toLocaleString()} lleva ${s.days_overdue} días vencida. Por favor regulariza tu situación. ¡Gracias! 💪`
      : `Hola ${s.full_name}, tu mensualidad de $${s.price.toLocaleString()} vence el día ${s.due_day} de este mes. ¡No te olvides! 💪`
    return `https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  const overdue  = subs.filter(s => s.status === 'overdue').length
  const dueSoon  = subs.filter(s => s.status === 'due_soon').length
  const paid     = subs.filter(s => s.status === 'paid').length
  const pending  = subs.filter(s => s.status === 'pending').length
  const cobradoMes = subs.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.price, 0)
  const porCobrar  = subs.filter(s => s.status !== 'paid').reduce((acc, s) => acc + s.price, 0)

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',      label: `Todos (${subs.length})` },
    { key: 'overdue',  label: `Vencidos (${overdue})` },
    { key: 'due_soon', label: `Próximos (${dueSoon})` },
    { key: 'paid',     label: `Al día (${paid})` },
    { key: 'pending',  label: `Pendientes (${pending})` },
  ]

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando cobros...</div>

  return (
    <>
      <Topbar title="Cobros" subtitle="Estado de pagos mensuales" />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cobrado este mes', value: `$${cobradoMes.toLocaleString()}`, color: '#22c55e' },
          { label: 'Por cobrar',        value: `$${porCobrar.toLocaleString()}`,  color: '#f59e0b' },
          { label: 'Vencidos',          value: overdue,                           color: '#ef4444' },
          { label: 'Próximos',          value: dueSoon,                           color: '#8b5cf6' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
            <p className="text-xs text-[#6b7280] font-medium mb-1">{c.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === t.key ? 'bg-[#FF4D00] text-white' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['Miembro', 'RUT', 'Mensualidad', 'Día vencimiento', 'Último pago', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const cfg = STATUS_CFG[s.status]
              return (
                <tr key={s.id} className="border-b border-[#f5f5f7] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-sm font-semibold text-[#1a1a1a]">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{s.rut}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#1a1a1a]">${s.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">Día {s.due_day}</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{s.last_payment_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${cfg.cls}`}>
                      {cfg.label}{s.status === 'overdue' && s.days_overdue > 0 ? ` (${s.days_overdue}d)` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {confirming === s.member_id ? (
                        <>
                          <button onClick={() => markPaid(s.member_id)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">
                            <CheckCircle size={11} /> Confirmar
                          </button>
                          <button onClick={() => setConfirming(null)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {s.status !== 'paid' && (
                            <button onClick={() => setConfirming(s.member_id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FF4D00] text-white hover:bg-[#CC3D00]">
                              Cobrar
                            </button>
                          )}
                          {s.phone && (
                            <a href={waMsg(s)} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50">
                              <MessageCircle size={11} /> WA
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
