'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');

  useEffect(() => { loadRequests(); }, [filter]);

  async function loadRequests() {
    setLoading(true);
    try {
      const { data } = await api.get(`/requests?status=${filter}`);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, status: 'aprobada' | 'rechazada') {
    try {
      await api.put(`/requests/${id}`, { status });
      loadRequests();
    } catch {}
  }

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitudes</h2>

      <div className="flex gap-2 mb-6">
        {['pendiente', 'aprobada', 'rechazada'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-sky-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Cargando...</p>
        ) : requests.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">No hay solicitudes {filter}s</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                {filter === 'pendiente' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{r.full_name}</p>
                    <p className="text-sm text-gray-500">{r.rut}</p>
                  </td>
                  <td className="px-6 py-4 capitalize text-gray-600">{r.type}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(r.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'aprobada' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>{r.status}</span>
                  </td>
                  {filter === 'pendiente' && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(r.id, 'aprobada')}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium">
                          <CheckCircle size={16} /> Aprobar
                        </button>
                        <button onClick={() => handleAction(r.id, 'rechazada')}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium">
                          <XCircle size={16} /> Rechazar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
