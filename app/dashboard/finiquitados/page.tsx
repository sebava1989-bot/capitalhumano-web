'use client';
import { useEffect, useState, useRef } from 'react';
import { Search, User, Calendar, Briefcase, FileText, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
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
  finiquito:   'Finiquito',
  liquidacion: 'Liquidación',
  contrato:    'Contrato',
  anexo:       'Anexo',
  certificado: 'Certificado',
  otro:        'Otro',
};

const TYPE_EMOJI: Record<string, string> = {
  finiquito:   '📋',
  liquidacion: '💰',
  contrato:    '📝',
  anexo:       '📎',
  certificado: '🏅',
  otro:        '📄',
};

function WorkerCard({ worker }: { worker: FiniquitadoWorker }) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ type: 'finiquito', name: '', period: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadDocs() {
    setLoadingDocs(true);
    try {
      const { data } = await api.get(`/documents/worker/${worker.id}`);
      setDocs(data);
    } catch { /* silencioso */ }
    finally { setLoadingDocs(false); }
  }

  async function toggleDocs() {
    if (!open && docs.length === 0) await loadDocs();
    setOpen(o => !o);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadError('Selecciona un archivo PDF'); return; }
    if (file.size > 15 * 1024 * 1024) { setUploadError('El archivo no puede superar 15 MB'); return; }

    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('workerId', worker.id);
      fd.append('type', uploadForm.type);
      fd.append('name', uploadForm.name || `${TYPE_LABELS[uploadForm.type]} - ${worker.full_name}`);
      if (uploadForm.period) fd.append('period', uploadForm.period);

      await api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowUpload(false);
      setUploadForm({ type: 'finiquito', name: '', period: '' });
      if (fileRef.current) fileRef.current.value = '';
      await loadDocs();
      if (!open) setOpen(true);
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
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
      {/* Cabecera del trabajador */}
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
          <div className="flex flex-col items-end gap-2">
            <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">Finiquitado</span>
            <button
              onClick={() => { setShowUpload(u => !u); if (!open) { setOpen(true); loadDocs(); } }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
            >
              <Upload size={12} /> Subir documento
            </button>
          </div>
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

      {/* Formulario de subida */}
      {showUpload && (
        <div className="border-t border-sky-100 bg-sky-50 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-sky-800 flex items-center gap-2">
              <Upload size={14} /> Subir documento para {worker.full_name.split(' ')[0]}
            </h4>
            <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de documento</label>
                <select
                  value={uploadForm.type}
                  onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Período (opcional)</label>
                <input
                  value={uploadForm.period}
                  onChange={e => setUploadForm(f => ({ ...f, period: e.target.value }))}
                  placeholder="Ej: Abril 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del documento (opcional)</label>
              <input
                value={uploadForm.name}
                onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                placeholder={`${TYPE_LABELS[uploadForm.type]} - ${worker.full_name}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Archivo PDF *</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                required
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-sky-100 file:text-sky-700 file:font-medium hover:file:bg-sky-200 cursor-pointer"
              />
            </div>
            {uploadError && <p className="text-red-600 text-xs">{uploadError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowUpload(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors bg-white">
                Cancelar
              </button>
              <button type="submit" disabled={uploading}
                className="flex-1 bg-sky-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors">
                {uploading ? 'Subiendo...' : 'Subir documento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle documentos */}
      <button
        onClick={toggleDocs}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-sky-600 hover:bg-sky-50 transition-colors font-medium"
      >
        <span className="flex items-center gap-2">
          <FileText size={15} />
          Historial de documentos
          {docs.length > 0 && <span className="bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full">{docs.length}</span>}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          {loadingDocs && <p className="text-sm text-gray-400 text-center py-2">Cargando documentos...</p>}
          {!loadingDocs && docs.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-2">Sin documentos aún</p>
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs text-sky-600 hover:underline"
              >
                Subir el finiquito →
              </button>
            </div>
          )}
          {!loadingDocs && docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{TYPE_EMOJI[doc.type] || '📄'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABELS[doc.type] || doc.type}
                    {doc.period ? ` · ${doc.period}` : ''}
                    {' · '}{new Date(doc.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
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
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trabajadores Finiquitados</h2>
        <p className="text-sm text-gray-500 mt-1">Sube el finiquito y documentos de cada ex trabajador</p>
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
