'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { ROUTINES } from '@/lib/mock-data'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Exercise = { name: string; sets: number; reps: number; rest: number }
type Routine = { id: number; name: string; day: string; exercises: Exercise[] }

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>(ROUTINES)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', day: '', exercises: [{ name: '', sets: 3, reps: 12, rest: 60 }] })

  function deleteRoutine(id: number) {
    setRoutines(r => r.filter(x => x.id !== id))
  }

  function addExercise() {
    setForm(f => ({ ...f, exercises: [...f.exercises, { name: '', sets: 3, reps: 12, rest: 60 }] }))
  }

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setForm(f => {
      const exs = [...f.exercises]
      exs[i] = { ...exs[i], [field]: value }
      return { ...f, exercises: exs }
    })
  }

  function saveRoutine() {
    if (!form.name) return
    setRoutines(r => [...r, { id: Date.now(), ...form }])
    setForm({ name: '', day: '', exercises: [{ name: '', sets: 3, reps: 12, rest: 60 }] })
    setShowForm(false)
  }

  return (
    <>
      <Topbar title="Rutinas" subtitle={`${routines.length} rutinas en tu gimnasio`} />

      <div className="flex justify-end mb-5">
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">
          <Plus size={15} /> Nueva rutina
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-5">
          <h3 className="text-base font-extrabold text-[#1a1a1a] mb-4">Nueva rutina</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="Ej: Hombros y Core" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Día(s)</label>
              <input value={form.day} onChange={e => setForm(f => ({...f, day: e.target.value}))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="Ej: Lunes / Jueves" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-[#1a1a1a] mb-3">Ejercicios</h4>
          <div className="space-y-2 mb-3">
            {form.exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px_80px] gap-2">
                <input value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="Nombre del ejercicio" />
                <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', +e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="Series" />
                <input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', +e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="Reps" />
                <input type="number" value={ex.rest} onChange={e => updateExercise(i, 'rest', +e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="Desc(s)" />
              </div>
            ))}
          </div>
          <button onClick={addExercise} className="text-xs font-semibold text-[#FF4D00] hover:underline mb-4">+ Agregar ejercicio</button>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">Cancelar</button>
            <button onClick={saveRoutine} className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">Guardar rutina</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {routines.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🏋️</div>
              <div className="flex-1">
                <p className="font-bold text-[#1a1a1a]">{r.name}</p>
                <p className="text-xs text-[#6b7280]">{r.day} · {r.exercises.length} ejercicios</p>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteRoutine(r.id) }}
                className="p-2 rounded-lg text-[#6b7280] hover:bg-red-50 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
              {expanded === r.id ? <ChevronUp size={16} className="text-[#6b7280]" /> : <ChevronDown size={16} className="text-[#6b7280]" />}
            </div>
            {expanded === r.id && (
              <div className="border-t border-[#f5f5f7] px-5 py-4">
                <div className="grid grid-cols-[1fr_70px_70px_70px] gap-2 mb-2">
                  {['Ejercicio', 'Series', 'Reps', 'Desc.(s)'].map(h => (
                    <span key={h} className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">{h}</span>
                  ))}
                </div>
                {r.exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-[1fr_70px_70px_70px] gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                    <span className="text-sm text-[#1a1a1a]">{ex.name}</span>
                    <span className="text-sm text-center text-[#6b7280]">{ex.sets}</span>
                    <span className="text-sm text-center text-[#6b7280]">{ex.reps}</span>
                    <span className="text-sm text-center text-[#6b7280]">{ex.rest}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
