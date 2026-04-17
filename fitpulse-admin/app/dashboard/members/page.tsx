'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet, apiPost, apiPatch } from '@/lib/api'
import { Search, UserPlus, CheckCircle, XCircle, CreditCard } from 'lucide-react'
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
  const [form, setForm] = useState({ full_name: '', rut: '', phone: '', password: '' })
  const [loading, setLoading] = useState(true)

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
