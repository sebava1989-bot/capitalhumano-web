'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, Phone, Mail, Briefcase, UserX } from 'lucide-react';
import api from '@/lib/api';

interface Worker {
  id: string;
  rut: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  start_date: string;
  end_date?: string;
  active: boolean;
  created_at: string;
}

export default function WorkerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', position: '', startDate: '', active: true });
  const [saving, setSaving] = useState(false);
  const [showFiniquito, setShowFiniquito] = useState(false);
  const [finiquitoForm, setFiniquitoForm] = useState({ endDate: '', terminationReason: '' });
  const [finiquitando, setFiniquitando] = useState(false);

  useEffect(() => {
    api.get(`/workers/${id}`)
      .then(r => {
        setWorker(r.data);
        setForm({
          fullName: r.data.full_name,
          email: r.data.email || '',
          phone: r.data.phone || '',
          position: r.data.position || '',
          startDate: r.data.start_date ? r.data.start_date.split('T')[0] : '',
          active: r.data.active,
        });
      })
      .catch(() => router.push('/dashboard/workers'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(`/workers/${id}`, form);
      setWorker({ ...worker!, ...data, full_name: data.full_name });
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleFiniquito(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`¿Confirmas el finiquito de ${worker?.full_name}? Esta acción desactivará su acceso a la app.`)) return;
    setFiniquitando(true);
    try {
      await api.post(`/workers/${id}/finiquito`, finiquitoForm);
      router.push('/dashboard/finiquitados');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al finiquitar');
    } finally {
      setFiniquitando(false);
    }
  }

  function yearsWorked(startDate: string) {
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000));
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>;
  if (!worker) return null;

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.push('/dashboard/workers')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm">
        <ArrowLeft size={16} /> Volver a trabajadores
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
              <User size={28} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{worker.full_name}</h2>
              <p className="text-gray-500">{worker.rut}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                worker.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>{worker.active ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {worker.active && (
              <button onClick={() => setShowFiniquito(true)}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                <UserX size={15} /> Finiquitar
              </button>
            )}
            <button onClick={() => setEditing(!editing)}
              className="text-sm text-sky-600 hover:underline font-medium">
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha ingreso</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-sky-600" />
                <label htmlFor="active" className="text-sm text-gray-700">Trabajador activo</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-sky-600 text-white rounded-lg py-2 text-sm hover:bg-sky-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {worker.position && (
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase size={16} className="text-sky-500" /> {worker.position}
              </div>
            )}
            {worker.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} className="text-sky-500" /> {worker.email}
              </div>
            )}
            {worker.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="text-sky-500" /> {worker.phone}
              </div>
            )}
            {worker.start_date && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} className="text-sky-500" />
                Ingresó {new Date(worker.start_date).toLocaleDateString('es-CL')}
                {yearsWorked(worker.start_date) > 0 && (
                  <span className="text-xs bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">
                    {yearsWorked(worker.start_date)} año{yearsWorked(worker.start_date) > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Modal finiquito */}
      {showFiniquito && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <UserX size={20} className="text-red-500" /> Finiquitar trabajador
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Se desactivará el acceso de <strong>{worker?.full_name}</strong>. Sus documentos quedarán en el historial.
            </p>
            <form onSubmit={handleFiniquito} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de término *</label>
                <input
                  type="date"
                  value={finiquitoForm.endDate}
                  onChange={e => setFiniquitoForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de término (opcional)</label>
                <textarea
                  value={finiquitoForm.terminationReason}
                  onChange={e => setFiniquitoForm(f => ({ ...f, terminationReason: e.target.value }))}
                  placeholder="Ej: Renuncia voluntaria, término de contrato, etc."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-sm"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowFiniquito(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={finiquitando}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-semibold">
                  {finiquitando ? 'Procesando...' : 'Confirmar finiquito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
