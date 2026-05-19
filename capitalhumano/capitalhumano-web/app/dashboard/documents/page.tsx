'use client';
import { useState, useEffect } from 'react';
import { Upload, Camera, FileText, Trash2, Eye, X, Plus, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';

interface Document {
  id: string;
  worker_id: string;
  type: string;
  name: string;
  file_url: string;
  period: string;
  created_at: string;
  full_name?: string;
  rut?: string;
}

interface Worker {
  id: string;
  full_name: string;
  rut: string;
}

const DOC_TYPES = [
  { value: 'liquidacion', label: 'Liquidación de sueldo' },
  { value: 'liquidacion_firmada', label: 'Liquidación firmada' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'anexo', label: 'Anexo de contrato' },
  { value: 'otro', label: 'Otro documento' },
];

type UploadStep = 'idle' | 'scanning' | 'form';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterType, setFilterType] = useState('');

  // Upload flow
  const [step, setStep] = useState<UploadStep>('idle');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [form, setForm] = useState({ workerId: '', type: 'liquidacion', name: '', period: '' });

  // Viewer
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  useEffect(() => { loadData(); }, [filterWorker, filterType]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterWorker) params.set('workerId', filterWorker);
      if (filterType) params.set('type', filterType);
      const [docsRes, workersRes] = await Promise.all([
        api.get(`/documents?${params}`),
        api.get('/workers'),
      ]);
      setDocs(docsRes.data);
      setWorkers(workersRes.data);
    } catch {}
    setLoading(false);
  }

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCapturedImages(prev => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function buildPdfFromImages(): Promise<File> {
    const { jsPDF } = await import('jspdf');
    let pdf: InstanceType<typeof jsPDF> | null = null;

    for (const imgData of capturedImages) {
      await new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => {
          const w = img.width;
          const h = img.height;
          const orient = w > h ? 'landscape' : 'portrait';
          if (!pdf) {
            pdf = new jsPDF({ orientation: orient, unit: 'px', format: [w, h] });
          } else {
            (pdf as InstanceType<typeof jsPDF>).addPage([w, h], orient);
          }
          (pdf as InstanceType<typeof jsPDF>).addImage(imgData, 'JPEG', 0, 0, w, h);
          resolve();
        };
        img.src = imgData;
      });
    }

    const blob = pdf!.output('blob');
    return new File([blob], `scan_${Date.now()}.pdf`, { type: 'application/pdf' });
  }

  async function handleConfirmScan() {
    const file = await buildPdfFromImages();
    setSelectedFile(file);
    setStep('form');
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !form.workerId || !form.type || !form.name) {
      setUploadError('Completa todos los campos requeridos');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('workerId', form.workerId);
      formData.append('type', form.type);
      formData.append('name', form.name);
      if (form.period) formData.append('period', form.period);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      resetFlow();
      loadData();
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  }

  function resetFlow() {
    setStep('idle');
    setCapturedImages([]);
    setSelectedFile(null);
    setUploadError('');
    setForm({ workerId: '', type: 'liquidacion', name: '', period: '' });
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocs(docs.filter(d => d.id !== id));
    } catch {}
  }

  const typeLabel = (t: string) => DOC_TYPES.find(d => d.value === t)?.label || t;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos</h2>
          <p className="text-sm text-gray-500 mt-1">Liquidaciones, contratos y anexos de tus trabajadores</p>
        </div>
        <button
          onClick={() => setStep('scanning')}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm font-semibold"
        >
          <Plus size={16} /> Subir documento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select value={filterWorker} onChange={e => setFilterWorker(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los trabajadores</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los tipos</option>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* ── MODAL ESCÁNER MULTIPÁGINA ── */}
      {step === 'scanning' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Escanear documento</h3>
              <button onClick={resetFlow}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Miniaturas de páginas capturadas */}
            {capturedImages.length > 0 && (
              <div className="px-5 mb-3">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  {capturedImages.length} {capturedImages.length === 1 ? 'página capturada' : 'páginas capturadas'}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {capturedImages.map((src, i) => (
                    <div key={i} className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Página ${i + 1}`}
                        className="w-20 h-28 object-cover rounded-lg border border-gray-200" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] rounded px-1">
                        {i + 1}
                      </span>
                      <button
                        onClick={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="px-5 pb-5 space-y-3">
              {/* Tomar foto */}
              <label htmlFor="scan-camera-input"
                className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-sky-300 bg-sky-50 rounded-xl py-4 cursor-pointer hover:bg-sky-100 transition-colors">
                <Camera size={22} className="text-sky-600" />
                <span className="text-sm font-semibold text-sky-700">
                  {capturedImages.length === 0 ? 'Tomar primera foto' : 'Agregar otra página'}
                </span>
              </label>
              <input id="scan-camera-input" type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handleCameraCapture} />

              {/* Separador */}
              {capturedImages.length === 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">o</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <label htmlFor="scan-file-input"
                    className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-gray-300 rounded-xl py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload size={22} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600">Subir PDF desde el dispositivo</span>
                  </label>
                  <input id="scan-file-input" type="file" accept=".pdf" className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                        setStep('form');
                      }
                    }} />
                </>
              )}

              {capturedImages.length > 0 && (
                <button
                  onClick={handleConfirmScan}
                  className="w-full bg-sky-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-sky-700 transition-colors"
                >
                  Crear PDF · {capturedImages.length} {capturedImages.length === 1 ? 'página' : 'páginas'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FORMULARIO ── */}
      {step === 'form' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setStep('scanning'); setSelectedFile(null); }}
                className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-bold text-gray-900 flex-1">Datos del documento</h3>
              <button onClick={resetFlow}><X size={20} className="text-gray-400" /></button>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm">
                <FileText size={16} className="text-sky-600 shrink-0" />
                <span className="text-gray-700 flex-1 truncate">{selectedFile.name}</span>
                <span className="text-xs text-sky-600 font-medium">
                  {capturedImages.length > 0 ? `${capturedImages.length} págs.` : 'PDF'}
                </span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trabajador *</label>
                <select value={form.workerId} onChange={e => setForm({ ...form, workerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                  <option value="">Seleccionar trabajador</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.full_name} — {w.rut}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Período (opcional)</label>
                  <input type="month" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del documento *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej: Contrato Indefinido Mayo 2026" required />
              </div>
              {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetFlow}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={uploading}
                  className="flex-1 bg-sky-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
                  {uploading ? 'Subiendo...' : 'Subir documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VISOR PDF ── */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col" style={{ height: '88vh' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-sky-500 shrink-0" />
                <span className="font-semibold text-gray-900 truncate text-sm">{viewingDoc.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <a href={viewingDoc.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-sky-600 font-medium hover:underline">
                  Abrir en nueva pestaña
                </a>
                <button onClick={() => setViewingDoc(null)}>
                  <X size={20} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>
            <iframe
              src={viewingDoc.file_url}
              className="flex-1 w-full rounded-b-2xl"
              title={viewingDoc.name}
            />
          </div>
        </div>
      )}

      {/* ── LISTA DE DOCUMENTOS ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Cargando...</p>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay documentos subidos aún</p>
            <button onClick={() => setStep('scanning')} className="mt-3 text-sky-600 text-sm hover:underline">
              Subir el primer documento
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-sky-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.full_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                      {typeLabel(doc.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.period || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewingDoc(doc)}
                        className="text-sky-600 hover:text-sky-700" title="Ver documento">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDelete(doc.id)}
                        className="text-red-400 hover:text-red-600" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
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
