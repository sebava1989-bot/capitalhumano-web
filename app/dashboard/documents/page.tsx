'use client';
import { useState, useEffect, useRef } from 'react';
import { Upload, Camera, FileText, Trash2, Download, X, Plus } from 'lucide-react';
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

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ workerId: '', type: 'liquidacion', name: '', period: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState<'file' | 'camera'>('file');
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [filterWorker, filterType]);

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

  async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { jsPDF } = await import('jspdf');
    const reader = new FileReader();
    reader.onload = async () => {
      const imgData = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const pdf = new jsPDF({
          orientation: img.width > img.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [img.width, img.height],
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, img.width, img.height);
        const pdfBlob = pdf.output('blob');
        const pdfFile = new File([pdfBlob], file.name.replace(/\.[^.]+$/, '.pdf'), { type: 'application/pdf' });
        setSelectedFile(pdfFile);
        setPreviewMode('camera');
      };
      img.src = imgData;
    };
    reader.readAsDataURL(file);
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
      setShowUpload(false);
      setSelectedFile(null);
      setForm({ workerId: '', type: 'liquidacion', name: '', period: '' });
      loadData();
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos</h2>
          <p className="text-sm text-gray-500 mt-1">Liquidaciones, contratos y anexos de tus trabajadores</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm font-semibold"
        >
          <Plus size={16} /> Subir documento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterWorker}
          onChange={e => setFilterWorker(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los trabajadores</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.full_name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los tipos</option>
          {DOC_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Modal de subida */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Subir documento</h3>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setUploadError(''); }}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition-colors"
              >
                <Upload size={24} className="text-sky-600" />
                <span className="text-sm font-medium text-gray-700">Desde computador</span>
                <span className="text-xs text-gray-400">PDF hasta 15MB</span>
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition-colors"
              >
                <Camera size={24} className="text-sky-600" />
                <span className="text-sm font-medium text-gray-700">Escanear con celular</span>
                <span className="text-xs text-gray-400">Foto → PDF automático</span>
              </button>
            </div>

            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); setPreviewMode('file'); } }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={handleCameraCapture} />

            {selectedFile && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm">
                <FileText size={16} className="text-sky-600" />
                <span className="text-gray-700 flex-1 truncate">{selectedFile.name}</span>
                {previewMode === 'camera' && <span className="text-xs text-sky-600 font-medium">Convertido a PDF</span>}
                <button onClick={() => setSelectedFile(null)}><X size={14} className="text-gray-400" /></button>
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
                  placeholder="Ej: Liquidación Abril 2026" required />
              </div>
              {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowUpload(false); setSelectedFile(null); setUploadError(''); }}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={uploading || !selectedFile}
                  className="flex-1 bg-sky-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
                  {uploading ? 'Subiendo...' : 'Subir documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Cargando...</p>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay documentos subidos aún</p>
            <button onClick={() => setShowUpload(true)} className="mt-3 text-sky-600 text-sm hover:underline">
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
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-sky-600 hover:text-sky-700">
                        <Download size={16} />
                      </a>
                      <button onClick={() => handleDelete(doc.id)}
                        className="text-red-400 hover:text-red-600">
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
