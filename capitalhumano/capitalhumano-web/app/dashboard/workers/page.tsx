'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, User } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rut: '', fullName: '', email: '', phone: '', position: '', startDate: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadWorkers(); }, []);

  async function loadWorkers() {
    try {
      const { data } = await api.get('/workers');
      setWorkers(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/workers', form);
      setShowForm(false);
      setForm({ rut: '', fullName: '', email: '', phone: '', position: '', startDate: '', password: '' });
      loadWorkers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear trabajador');
    } finally {
      setSaving(false);
    }
  }

  const filtered = workers.filter(w =>
    w.full_name.toLowerCase().includes(search.toLowerCase()) ||
    w.rut.includes(search)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trabajadores</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus size={18} /> Agregar trabajador
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo Trabajador</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
                  <input value={form.rut} onChange={e => setForm({...form, rut: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="12.345.678-9" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Juan Pérez" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="juan@correo.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="+56 9 1234 5678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input value={form.position} onChange={e => setForm({...form, position: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Guardia de seguridad" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña inicial *</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Mínimo 6 caracteres" required />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-sky-600 text-white rounded-lg py-2 hover:bg-sky-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">No hay trabajadores registrados</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((w: any) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-sky-600" />
                      </div>
                      <span className="font-medium text-gray-900">{w.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{w.rut}</td>
                  <td className="px-6 py-4 text-gray-600">{w.position || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {w.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/workers/${w.id}`} className="text-sky-600 hover:underline text-sm">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
