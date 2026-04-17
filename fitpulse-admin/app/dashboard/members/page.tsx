'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet, apiPost, apiPatch } from '@/lib/api'
import { Search, UserPlus, CheckCircle, XCircle, CreditCard, Megaphone, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: number
  full_name: string
  rut: string
  level: number
  points: number
  streak: number
  last_workout: string
  active: boolean
  phone: string
  subscription_status: 'paid' | 'overdue' | 'due_soon' | 'pending'
}

const STATUS_COLORS = {
  paid:     { label: 'Al día',     cls: 'bg-green-50 text-green-600' },
  due_soon: { label: 'Próx. pago', cls: 'bg-amber-50 text-amber-600' },
  overdue:  { label: 'Mora',       cls: 'bg-red-50 text-red-500' },
  pending:  { label: 'Pendiente',  cls: 'bg-gray-50 text-[#6b7280]' },
}

function levelName(level: number) {
  if (level >= 7) return 'Avanzado'
  if (level >= 4) return 'Intermedio'
  return 'Principiante'
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoMsg, setPromoMsg] = useState('')
  const [promoTarget, setPromoTarget] = useState<'all' | 'active'>('active')
  const [sendingIndex, setSendingIndex] = useState<number | null>(null)
  const [form, setForm] = useState({ full_name: '', rut: '', phone: '', password: '' })
  const [loading, setLoading] = useState(true)

  const TEMPLATES = [
    { label: '🎉 Descuento mensualidad', text: '¡Hola {nombre}! Este mes tenemos un 20% de descuento en tu mensualidad si pagas antes del día 10. ¡No te lo pierdas! 💪 — PowerGym' },
    { label: '🏋️ Clase gratis', text: '¡Hola {nombre}! Te invitamos a una clase grupal GRATIS este sábado a las 10:00. ¡Trae a un amigo! 🔥 — PowerGym' },
    { label: '🌟 Promoción referido', text: '¡Hola {nombre}! Si traes a un amigo al gym este mes, ambos obtienen 1 semana gratis. ¡Aprovecha! 💪 — PowerGym' },
    { label: '✍️ Mensaje personalizado', text: '' },
  ]

  useEffect(() => {
    apiGet<Member[]>('/members').then(data => { setMembers(data); setLoading(false) }).catch(console.error)
  }, [])

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.rut.includes(search)
  )

  async function toggleActive(id: number, currentActive: boolean) {
    await apiPatch(`/members/${id}`, { active: !currentActive })
    setMembers(prev => prev.map(m => m.id === id ? { ...m, active: !currentActive } : m))
  }

  async function addMember() {
    if (!form.full_name || !form.rut || !form.password) return
    const created = await apiPost<Member>('/members', {
      full_name: form.full_name,
      rut: form.rut,
      phone: form.phone,
      password: form.password,
    })
    setMembers(prev => [{ ...created, level: 1, points: 0, streak: 0, last_workout: '', subscription_status: 'pending' }, ...prev])
    setForm({ full_name: '', rut: '', phone: '', password: '' })
    setShowModal(false)
  }

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando miembros...</div>

  return (
    <>
      <Topbar title="Miembros" subtitle={`${members.filter(m => m.active).length} activos · ${members.length} total`} />

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o RUT..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowPromoModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
        >
          <Megaphone size={15} /> Enviar promoción
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00] transition-colors"
        >
          <UserPlus size={15} /> Agregar miembro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['Nombre', 'RUT', 'Nivel', 'Puntos', 'Racha', 'Último entreno', 'Pago', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const payCfg = STATUS_COLORS[m.subscription_status]
              return (
                <tr key={m.id} className="border-b border-[#f5f5f7] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00]">{m.full_name[0]}</div>
                      <span className="text-sm font-semibold text-[#1a1a1a]">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{m.rut}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-orange-50 text-[#FF4D00]">
                      Nv.{m.level} {levelName(m.level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-[#FF4D00]">{m.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">🔥 {m.streak}d</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{m.last_workout || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${payCfg.cls}`}>{payCfg.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {m.active
                      ? <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle size={13} /> Activo</span>
                      : <span className="flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle size={13} /> Inactivo</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(m.id, m.active)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                          m.active ? 'border-red-200 text-red-400 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {m.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <Link href="/dashboard/payments" className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">
                        <CreditCard size={11} />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showPromoModal && (() => {
        const targets = members.filter(m => m.phone && (promoTarget === 'all' || m.active))
        const isSending = sendingIndex !== null
        const isDone = sendingIndex !== null && sendingIndex >= targets.length

        function startSendAll() {
          if (!promoMsg.trim() || targets.length === 0) return
          setSendingIndex(0)
          const first = targets[0]
          const msg = promoMsg.replace(/\{nombre\}/gi, first.full_name.split(' ')[0])
          window.open(`https://wa.me/${first.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
        }

        function sendNext() {
          if (sendingIndex === null) return
          const next = sendingIndex + 1
          if (next >= targets.length) { setSendingIndex(next); return }
          setSendingIndex(next)
          const m = targets[next]
          const msg = promoMsg.replace(/\{nombre\}/gi, m.full_name.split(' ')[0])
          window.open(`https://wa.me/${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
        }

        function closePromo() {
          setShowPromoModal(false)
          setSendingIndex(null)
        }

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
              <h2 className="text-lg font-extrabold text-[#1a1a1a] mb-1">Enviar promoción por WhatsApp</h2>
              <p className="text-xs text-[#6b7280] mb-5">Elige una plantilla o escribe tu mensaje. Cada envío abre WhatsApp en una nueva pestaña.</p>

              {/* Plantillas */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#1a1a1a] mb-2">Plantilla</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.label}
                      onClick={() => { setPromoMsg(t.text); setSendingIndex(null) }}
                      className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                        promoMsg === t.text && t.text !== ''
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensaje */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#1a1a1a] mb-1.5">Mensaje <span className="text-[#6b7280] font-normal">(usa {'{nombre}'} para personalizar)</span></p>
                <textarea
                  value={promoMsg}
                  onChange={e => { setPromoMsg(e.target.value); setSendingIndex(null) }}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              {/* Destinatarios */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-[#1a1a1a] mb-2">Enviar a</p>
                <div className="flex gap-2">
                  {[
                    { key: 'active' as const, label: `Activos (${members.filter(m => m.active && m.phone).length})` },
                    { key: 'all'    as const, label: `Todos con teléfono (${members.filter(m => m.phone).length})` },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setPromoTarget(opt.key); setSendingIndex(null) }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        promoTarget === opt.key ? 'bg-green-500 text-white' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo envío masivo */}
              {promoMsg.trim() && !isSending && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-green-800">Enviar a todos ({targets.length} contactos)</p>
                    <p className="text-xs text-green-600 mt-0.5">Se abrirá WhatsApp uno por uno. Tú confirmas cada envío.</p>
                  </div>
                  <button
                    onClick={startSendAll}
                    disabled={targets.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Megaphone size={14} /> Enviar a todos
                  </button>
                </div>
              )}

              {/* Progreso de envío masivo */}
              {isSending && (
                <div className="mb-4 p-4 border border-green-300 rounded-xl">
                  {isDone ? (
                    <div className="text-center">
                      <p className="text-2xl mb-1">🎉</p>
                      <p className="text-sm font-bold text-green-700">¡Listo! Enviaste a los {targets.length} contactos.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-[#1a1a1a]">
                          Enviando {(sendingIndex ?? 0) + 1} de {targets.length}
                        </p>
                        <span className="text-xs text-[#6b7280]">{targets.length - (sendingIndex ?? 0) - 1} restantes</span>
                      </div>
                      {/* Barra de progreso */}
                      <div className="w-full bg-[#f5f5f7] rounded-full h-2 mb-3">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(((sendingIndex ?? 0) + 1) / targets.length) * 100}%` }}
                        />
                      </div>
                      {/* Miembro actual */}
                      <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-extrabold text-green-600">
                          {targets[sendingIndex ?? 0]?.full_name[0]}
                        </div>
                        <span className="text-sm font-semibold text-[#1a1a1a]">{targets[sendingIndex ?? 0]?.full_name}</span>
                        <span className="text-xs text-green-600 ml-auto">WhatsApp abierto ✓</span>
                      </div>
                      <button
                        onClick={sendNext}
                        className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors"
                      >
                        Siguiente → {targets[(sendingIndex ?? 0) + 1]?.full_name.split(' ')[0]}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Lista individual */}
              {promoMsg.trim() && !isSending && (
                <div className="mb-5 max-h-36 overflow-y-auto space-y-2 border border-[#e5e7eb] rounded-xl p-3">
                  {targets.map(m => {
                    const msg = promoMsg.replace(/\{nombre\}/gi, m.full_name.split(' ')[0])
                    const url = `https://wa.me/${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00] shrink-0">{m.full_name[0]}</div>
                        <span className="flex-1 text-sm text-[#1a1a1a] truncate">{m.full_name}</span>
                        <a href={url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">
                          <MessageCircle size={11} /> Enviar
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={closePromo} className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">Cerrar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-extrabold text-[#1a1a1a] mb-5">Agregar miembro</h2>
            <div className="space-y-4">
              {[
                { label: 'Nombre completo', key: 'full_name', placeholder: 'Ana González' },
                { label: 'RUT', key: 'rut', placeholder: '12345678-9' },
                { label: 'Teléfono', key: 'phone', placeholder: '+56912345678' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Contraseña inicial</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">Cancelar</button>
              <button onClick={addMember} className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
