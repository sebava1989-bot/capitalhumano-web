'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Exercise {
  id?: number
  name: string
  sets: number
  reps: number
  rest_seconds: number
}

interface Routine {
  id: number
  name: string
  day_of_week: string
  exercises: Exercise[]
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [form, setForm] = useState({ name: '', day_of_week: '' })
  const [exercises, setExercises] = useState<Exercise[]>([{ name: '', sets: 3, reps: 12, rest_seconds: 60 }])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<Routine[]>('/routines').then(data => { setRoutines(data); setLoading(false) }).catch(console.error)
  }, [])

  function openCreate() {
    setEditingRoutine(null)
    setForm({ name: '', day_of_week: '' })
    setExercises([{ name: '', sets: 3, reps: 12, rest_seconds: 60 }])
    setShowModal(true)
  }

  function openEdit(r: Routine) {
    setEditingRoutine(r)
    setForm({ name: r.name, day_of_week: r.day_of_week })
    setExercises(r.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, rest_seconds: e.rest_seconds })))
    setShowModal(true)
  }

  async function save() {
    if (!form.name) return
    const body = { name: form.name, day_of_week: form.day_of_week, exercises }
    if (editingRoutine) {
      await apiPut(`/routines/${editingRoutine.id}`, body)
      setRoutines(prev => prev.map(r => r.id === editingRoutine.id ? { ...r, ...body, exercises } : r))
    } else {
      const created = await apiPost<Routine>('/routines', body)
      setRoutines(prev => [...prev, created])
    }
    setShowModal(false)
  }

  async function deleteRoutine(id: number) {
    if (!confirm('¿Eliminar esta rutina?')) return
    await apiDelete(`/routines/${id}`)
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  function addExercise() {
    setExercises(prev => [...prev, { name: '', sets: 3, reps: 12, rest_seconds: 60 }])
  }

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando rutinas...</div>

  return (
    <>
      <Topbar title="Rutinas" subtitle={`${routines.length} rutinas configuradas`} />

      <div className="flex justify-end mb-5">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00] transition-colors">
          <Plus size={15} /> Nueva rutina
        </button>
      </div>

      <div className="space-y-3">
        {routines.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-bold text-[#1a1a1a]">{r.name}</p>
                <p className="text-xs text-[#6b7280] mt-0.5">{r.day_of_week} · {r.exercises.length} ejercicios</p>
              </div>
              <button onClick={() => openEdit(r)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">Editar</button>
              <button onClick={() => deleteRoutine(r.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50">
                <Trash2 size={13} />
              </button>
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-[#6b7280]">
                {expanded === r.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            {expanded === r.id && (
              <div className="border-t border-[#f5f5f7] px-4 pb-4">
                <table className="w-full mt-3">
                  <thead>
                    <tr>
                      {['Ejercicio', 'Series', 'Reps', 'Descanso'].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase pb-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.exercises.map((e, i) => (
                      <tr key={i} className="border-t border-[#f5f5f7]">
                        <td className="py-2 text-sm text-[#1a1a1a]">{e.name}</td>
                        <td className="py-2 text-sm text-[#6b7280]">{e.sets}</td>
                        <td className="py-2 text-sm text-[#6b7280]">{e.reps}</td>
                        <td className="py-2 text-sm text-[#6b7280]">{e.rest_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
            <h2 className="text-lg font-extrabold text-[#1a1a1a] mb-5">{editingRoutine ? 'Editar rutina' : 'Nueva rutina'}</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Nombre</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
                  placeholder="Pecho y Tríceps" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Días</label>
                <input value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
                  placeholder="Lunes / Jueves" />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#1a1a1a]">Ejercicios</p>
                <button onClick={addExercise} className="flex items-center gap-1 text-xs font-semibold text-[#FF4D00] hover:underline">
                  <Plus size={13} /> Agregar
                </button>
              </div>
              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_60px_70px_32px] gap-2 items-center">
                    <input value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)}
                      placeholder="Nombre del ejercicio"
                      className="px-3 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value))}
                      className="px-2 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', parseInt(e.target.value))}
                      className="px-2 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <input type="number" value={ex.rest_seconds} onChange={e => updateExercise(i, 'rest_seconds', parseInt(e.target.value))}
                      className="px-2 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <button onClick={() => removeExercise(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_60px_60px_70px_32px] gap-2 text-[10px] text-[#6b7280] px-1">
                  <span>Ejercicio</span><span className="text-center">Series</span><span className="text-center">Reps</span><span className="text-center">Desc(s)</span><span />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">Cancelar</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
