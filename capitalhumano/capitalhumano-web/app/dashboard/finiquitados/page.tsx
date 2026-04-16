'use client';
import { useEffect, useState } from 'react';
import { Search, User, Calendar, Briefcase, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';

interface FiniquitadoWorker {
  id: string;
  rut: string;
  full_name: string;
  email: string;
  position: string;
  start_date: string;
  end_date: string;
  termination_reason: string | null;
}

interface Doc {
  id: string;
  name: string;
  type: string;
  period: string | null;
  file_url: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  liquidacion: 'Liquidación',
  contrato: 'Contrato',
  anexo: 'Anexo',
  certificado: 'Certificado',
  otro: 'Otro',
};

function WorkerCard({ worker }: { worker: FiniquitadoWorker }) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  async function toggleDocs() {
    if (!open && docs.length === 0) {
      setLoadingDocs(true);
      try {
        const { data } = await api.get(`/documents/worker/${worker.id}`);
        setDocs(data);
      } catch { /* silencioso */ }
      finally { setLoadingDocs(false); }
    }
    setOpen(o => !o);
  }

  function calcAntigüedad() {
    if (!worker.start_date || !worker.end_date) return null;
    const start = new Date(worker.start_date);
    const end = new Date(worker.end_date);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 12) return `${months} mes${months !== 1 ? 'es' : ''}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return `${years} año${years !== 1 ? 's' : ''}${rem > 0 ? ` ${rem} mes${rem !== 1 ? 'es' : ''}` : ''}`;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <User size={22} className="text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{worker.full_name}</h3>
              <p className="text-sm text-gray-500">{worker.rut}</p>
              {worker.position && (
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Briefcase size={11} /> {worker.position}
                </span>
              )}
            </div>
          </div>
          <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">Finiquitado</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {worker.start_date && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar size={13} className="text-gray-400" />
              <span>Ingreso: {new Date(worker.start_date).toLocaleDateString('es-CL')}</span>
            </div>
          )}
          {worker.end_date && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar size={13} className="text-red-400" />
              <span>Término: {new Date(worker.end_date).toLocaleDateString('es-CL')}</span>
            </div>
          )}
          {calcAntigüedad() && (
            <div className="col-span-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
              Antigüedad: <span className="font-semibold text-gray-700">{calcAntigüedad()}</span>
            </div>
          )}
          {worker.termination_reason && (
            <div className="col-span-2 text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
              Motivo: <span className="text-amber-800">{worker.termination_reason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Documentos toggle */}
      <button
        onClick={toggleDocs}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-sky-600 hover:bg-sky-50 transition-colors font-medium"
      >
        <span className="flex items-center gap-2"><FileText size={15} /> Ver historial de documentos</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          {loadingDocs && <p className="text-sm text-gray-400 text-center py-2">Cargando documentos...</p>}
          {!loadingDocs && docs.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">Sin documentos registrados</p>
          )}
          {!loadingDocs && docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                <p className="text-xs text-gray-400">
                  {TYPE_LABELS[doc.type] || doc.type}
                  {doc.period ? ` · ${doc.period}` : ''}
                  {' · '}{new Date(doc.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
              <a href={doc.file_url} target="_blank" rel="noreferrer"
                className="text-xs px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors ml-3 shrink-0">
                Ver PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FiniquitadosPage() {
  const [workers, setWorkers] = useState<FiniquitadoWorker[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/workers/finiquitados/list')
      .then(r => setWorkers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = workers.filter(w =>
    w.full_name.toLowerCase().includes(search.toLowerCase()) || w.rut.includes(search)
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trabajadores Finiquitados</h2>
        <p className="text-sm text-gray-500 mt-1">Historial completo con liquidaciones, contratos y documentos</p>
      </div>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
        />
      </div>

      {loading && <p className="text-gray-400 text-center py-12">Cargando...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <User size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">{search ? 'Sin resultados' : 'No hay trabajadores finiquitados'}</p>
        </div>
      )}

      {!loading && filtered.map(w => <WorkerCard key={w.id} worker={w} />)}
    </div>
  );
}
