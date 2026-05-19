'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  vacaciones: '🌴 Vacaciones',
  permiso: '🕐 Permiso',
  anticipo: '💰 Anticipo de sueldo',
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [acting, setActing] = useState('');

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
    setActing(id + status);
    try {
      await api.put(`/requests/${id}`, { status });
      await loadRequests();
    } catch {
    } finally {
      setActing('');
    }
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

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay solicitudes {filter}s</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{r.full_name}</p>
                  <p className="text-sm text-gray-500">{r.rut}</p>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                  r.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                  r.status === 'aprobada' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>{r.status}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{TYPE_LABELS[r.type] ?? r.type}</p>
                  {r.type === 'anticipo' && r.amount &&
                    <p className="text-sm font-bold text-emerald-700">${Number(r.amount).toLocaleString('es-CL')}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(r.created_at).toLocaleDateString('es-CL')}</p>
                </div>

                {filter === 'pendiente' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(r.id, 'aprobada')}
                      disabled={!!acting}
                      className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                      <CheckCircle size={15} /> Aprobar
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'rechazada')}
                      disabled={!!acting}
                      className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
                      <XCircle size={15} /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
