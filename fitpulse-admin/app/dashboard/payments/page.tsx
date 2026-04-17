'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { MEMBERS, getPaymentStatus, getDaysOverdue, getDaysUntilDue, type Member, type PaymentStatus } from '@/lib/mock-data'
import { CheckCircle, Clock, AlertCircle, CreditCard, MessageCircle, RefreshCw } from 'lucide-react'

const TODAY = '2026-04-16'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  paid:      { label: 'Al día',       color: '#16a34a', bg: 'bg-green-50',  border: 'border-green-200', icon: <CheckCircle size={13} /> },
  due_soon:  { label: 'Vence pronto', color: '#d97706', bg: 'bg-amber-50',  border: 'border-amber-200', icon: <Clock size={13} /> },
  overdue:   { label: 'Vencido',      color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',   icon: <AlertCircle size={13} /> },
  pending:   { label: 'Pendiente',    color: '#6b7280', bg: 'bg-gray-50',   border: 'border-gray-200',  icon: <CreditCard size={13} /> },
}

type FilterType = 'all' | PaymentStatus

function buildWhatsAppLink(member: Member, status: PaymentStatus): string {
  const phone = member.phone.replace(/\D/g, '')
  let msg = ''
  if (status === 'overdue') {
    const days = getDaysOverdue(member)
    msg = `Hola ${member.name.split(' ')[0]}! 👋 Te contactamos de PowerGym. Tu mensualidad lleva ${days} día${days > 1 ? 's' : ''} de retraso. El monto es $${member.subscriptionPrice.toLocaleString('es-CL')}. Por favor regulariza tu pago para seguir disfrutando de todos los beneficios. ¡Gracias!`
  } else if (status === 'due_soon') {
    const days = getDaysUntilDue(member)
    msg = `Hola ${member.name.split(' ')[0]}! 👋 Te recordamos de PowerGym que tu mensualidad vence en ${days} día${days !== 1 ? 's' : ''} (día ${member.paymentDueDay}). El monto es $${member.subscriptionPrice.toLocaleString('es-CL')}. ¡Gracias por mantenerte al día!`
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

export default function PaymentsPage() {
  const [members, setMembers] = useState(MEMBERS)
  const [filter, setFilter] = useState<FilterType>('all')
  const [confirming, setConfirming] = useState<number | null>(null)

  function markAsPaid(id: number) {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, lastPaymentDate: TODAY } : m
    ))
    setConfirming(null)
  }

  const statuses = members.map(m => ({ member: m, status: getPaymentStatus(m) }))
  const filtered = filter === 'all'
    ? statuses
    : statuses.filter(({ status }) => status === filter)

  const counts = {
    all:      members.length,
    overdue:  statuses.filter(s => s.status === 'overdue').length,
    due_soon: statuses.filter(s => s.status === 'due_soon').length,
    paid:     statuses.filter(s => s.status === 'paid').length,
    pending:  statuses.filter(s => s.status === 'pending').length,
  }

  const totalPending = statuses
    .filter(s => s.status !== 'paid')
    .reduce((sum, { member }) => sum + member.subscriptionPrice, 0)

  const totalCollected = statuses
    .filter(s => s.status === 'paid')
    .reduce((sum, { member }) => sum + member.subscriptionPrice, 0)

  return (
    <>
      <Topbar title="Cobros y Suscripciones" subtitle="Control de pagos mensuales de los miembros" />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Cobrado este mes</p>
          <p className="text-2xl font-black text-green-600">${totalCollected.toLocaleString('es-CL')}</p>
          <p className="text-[11px] text-[#6b7280] mt-1">{counts.paid} miembro{counts.paid !== 1 ? 's' : ''} al día</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Por cobrar</p>
          <p className="text-2xl font-black text-[#1a1a1a]">${totalPending.toLocaleString('es-CL')}</p>
          <p className="text-[11px] text-[#6b7280] mt-1">{members.length - counts.paid} miembros pendientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Pagos vencidos</p>
          <p className="text-2xl font-black text-red-500">{counts.overdue}</p>
          <p className="text-[11px] text-[#6b7280] mt-1">miembros en mora</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Vencen pronto</p>
          <p className="text-2xl font-black text-amber-500">{counts.due_soon}</p>
          <p className="text-[11px] text-[#6b7280] mt-1">en los próximos 3 días</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'all',      label: `Todos (${counts.all})` },
          { key: 'overdue',  label: `Vencidos (${counts.overdue})` },
          { key: 'due_soon', label: `Próximos (${counts.due_soon})` },
          { key: 'paid',     label: `Al día (${counts.paid})` },
          { key: 'pending',  label: `Pendientes (${counts.pending})` },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === key
                ? 'bg-[#FF4D00] text-white'
                : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Members payment table */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['Miembro', 'Teléfono', 'Día de pago', 'Monto', 'Último pago', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ member: m, status }) => {
              const cfg = STATUS_CONFIG[status]
              const isConfirming = confirming === m.id
              const needsAlert = status === 'overdue' || status === 'due_soon'

              return (
                <tr
                  key={m.id}
                  className={`border-b border-[#f5f5f7] last:border-0 ${
                    status === 'overdue' ? 'bg-red-50/30' : status === 'due_soon' ? 'bg-amber-50/30' : 'hover:bg-[#fafafa]'
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${cfg.bg}`} style={{ color: cfg.color }}>
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{m.name}</p>
                        <p className="text-[11px] text-[#6b7280]">{m.rut}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#6b7280]">{m.phone}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold text-[#1a1a1a]">Día {m.paymentDueDay}</span>
                    {status === 'overdue' && (
                      <p className="text-[11px] text-red-500 font-semibold">{getDaysOverdue(m)} días de atraso</p>
                    )}
                    {status === 'due_soon' && (
                      <p className="text-[11px] text-amber-500 font-semibold">Vence en {getDaysUntilDue(m)} día{getDaysUntilDue(m) !== 1 ? 's' : ''}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-[#1a1a1a]">
                    ${m.subscriptionPrice.toLocaleString('es-CL')}
                  </td>
                  <td className="px-5 py-3 text-sm text-[#6b7280]">{m.lastPaymentDate}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border}`} style={{ color: cfg.color }}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {/* Cobrar button */}
                      {!isConfirming ? (
                        <button
                          onClick={() => setConfirming(m.id)}
                          disabled={status === 'paid'}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            status === 'paid'
                              ? 'border-[#e5e7eb] text-[#d1d5db] cursor-not-allowed'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <CreditCard size={11} />
                          Cobrar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => markAsPaid(m.id)}
                            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600"
                          >
                            <CheckCircle size={11} />
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirming(null)}
                            className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]"
                          >
                            <RefreshCw size={11} />
                          </button>
                        </div>
                      )}

                      {/* WhatsApp reminder */}
                      {needsAlert && (
                        <a
                          href={buildWhatsAppLink(m, status)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <MessageCircle size={11} />
                          WA
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#6b7280] mt-4 text-center">
        Los pagos marcados como cobrados actualizan el estado en tiempo real. El botón WA abre WhatsApp con un mensaje automático de recordatorio.
      </p>
    </>
  )
}
