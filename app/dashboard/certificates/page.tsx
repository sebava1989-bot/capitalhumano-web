'use client';
import { useState, useEffect } from 'react';
import { Award, Download, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Worker {
  id: string;
  full_name: string;
  rut: string;
}

const CERT_TYPES = [
  { value: 'antiguedad', label: 'Antigüedad Laboral', desc: 'Años y meses trabajados en la empresa' },
  { value: 'vacaciones', label: 'Vacaciones Disponibles', desc: 'Certificado de derechos de vacaciones' },
  { value: 'renta', label: 'Renta Mensual', desc: 'Certificado de cargo y contrato vigente' },
];

export default function CertificatesPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [generating, setGenerating] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/workers').then(r => setWorkers(r.data)).catch(() => {});
  }, []);

  async function handleGenerate(type: string) {
    if (!selectedWorker) { setError('Selecciona un trabajador primero'); return; }
    setGenerating(type);
    setGeneratedUrl('');
    setError('');
    try {
      const { data } = await api.post('/certificates/generate', { workerId: selectedWorker, type });
      setGeneratedUrl(data.url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al generar certificado');
    } finally {
      setGenerating('');
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Award size={28} className="text-sky-600" />
        <h2 className="text-2xl font-bold text-gray-900">Certificados</h2>
      </div>
      <p className="text-gray-500 mb-8">Genera certificados laborales con tu firma digital embebida automáticamente.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2">Trabajador</label>
        <select
          value={selectedWorker}
          onChange={e => { setSelectedWorker(e.target.value); setGeneratedUrl(''); setError(''); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Seleccionar trabajador...</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.full_name} — {w.rut}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {CERT_TYPES.map(cert => (
          <div key={cert.value} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{cert.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{cert.desc}</p>
            </div>
            <button
              onClick={() => handleGenerate(cert.value)}
              disabled={!selectedWorker || generating === cert.value}
              className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors shrink-0 ml-4"
            >
              {generating === cert.value ? (
                <><Loader2 size={16} className="animate-spin" /> Generando...</>
              ) : (
                <><Award size={16} /> Generar</>
              )}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>
      )}

      {generatedUrl && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800">¡Certificado generado!</p>
            <p className="text-sm text-green-600 mt-0.5">Listo para descargar o compartir con el trabajador</p>
          </div>
          <a
            href={generatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shrink-0 ml-4"
          >
            <Download size={16} /> Descargar PDF
          </a>
        </div>
      )}
    </div>
  );
}
