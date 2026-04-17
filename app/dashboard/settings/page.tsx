'use client';
import { useState, useEffect, useRef } from 'react';
import { Building2, Key, ImageIcon, Upload, CheckCircle, X, Pencil } from 'lucide-react';
import api from '@/lib/api';

function SignatureUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => {
      if (r.data.company?.admin_signature_url) setPreview(r.data.company.admin_signature_url);
    }).catch(() => {});
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!fileRef.current?.files?.[0]) return;
    setUploading(true);
    setOk(false);
    setError('');
    try {
      const formData = new FormData();
      formData.append('signature', fileRef.current.files[0]);
      await api.put('/dashboard/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOk(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir firma');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="w-40 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden relative">
        {preview ? (
          <>
            <img src={preview} alt="Firma" className="w-full h-full object-contain p-1" />
            <button onClick={() => { setPreview(null); setOk(false); if (fileRef.current) fileRef.current.value = ''; }}
              className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow text-gray-400 hover:text-red-500">
              <X size={12} />
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400 text-center px-2">Sin firma cargada</span>
        )}
      </div>
      <div className="flex-1">
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" id="sig-upload" onChange={handleFile} />
        <label htmlFor="sig-upload"
          className="inline-flex items-center gap-2 cursor-pointer border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <Upload size={16} /> Seleccionar firma
        </label>
        {preview && fileRef.current?.files?.[0] && (
          <button onClick={handleUpload} disabled={uploading}
            className="ml-2 inline-flex items-center gap-2 bg-sky-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors">
            {uploading ? 'Subiendo...' : 'Guardar firma'}
          </button>
        )}
        {ok && <p className="flex items-center gap-1 text-green-600 text-sm mt-2"><CheckCircle size={14} /> Firma guardada</p>}
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-2">Recomendado: PNG con fondo transparente, 400×150px</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadOk, setUploadOk] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeOk, setCodeOk] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('ch_company');
    if (data) setCompany(JSON.parse(data));
    api.get('/dashboard/stats').then(r => {
      if (r.data.company?.logo_url) setLogoPreview(r.data.company.logo_url);
    }).catch(() => {});
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { setUploadError('El archivo es demasiado grande. Máximo 500KB.'); return; }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSaveCode() {
    if (!newCode.trim()) return;
    setSavingCode(true); setCodeError(''); setCodeOk(false);
    try {
      const { data } = await api.put('/dashboard/company-code', { companyCode: newCode.trim() });
      const stored = localStorage.getItem('ch_company');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = { ...parsed, companyCode: data.companyCode };
        localStorage.setItem('ch_company', JSON.stringify(updated));
        setCompany(updated);
      }
      setCodeOk(true);
      setEditingCode(false);
      setNewCode('');
    } catch (err: any) {
      setCodeError(err.response?.data?.error || 'Error al actualizar código');
    } finally {
      setSavingCode(false);
    }
  }

  async function handleUploadLogo() {
    if (!logoPreview) return;
    setUploading(true); setUploadOk(false); setUploadError('');
    try {
      await api.put('/dashboard/logo', { logoBase64: logoPreview });
      setUploadOk(true);
      const stored = localStorage.getItem('ch_company');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('ch_company', JSON.stringify({ ...parsed, logoUrl: logoPreview }));
        setCompany({ ...parsed, logoUrl: logoPreview });
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Error al subir logo');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-sky-600" /> Datos de la empresa
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Nombre</span>
            <span className="font-medium text-gray-900">{company?.name || '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{company?.email || '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Plan</span>
            <span className="font-medium capitalize text-sky-700">{company?.plan || '—'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <ImageIcon size={18} className="text-sky-600" /> Logo de la empresa
        </h3>
        <p className="text-sm text-gray-500 mb-4">El logo aparecerá en el sidebar. PNG/JPG, máximo 500KB.</p>
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden relative">
            {logoPreview ? (
              <>
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                <button onClick={() => { setLogoPreview(null); setUploadOk(false); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow text-gray-400 hover:text-red-500"><X size={12} /></button>
              </>
            ) : <ImageIcon size={28} className="text-gray-300" />}
          </div>
          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleFileChange} className="hidden" id="logo-upload" />
            <label htmlFor="logo-upload" className="inline-flex items-center gap-2 cursor-pointer border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload size={16} /> Seleccionar imagen
            </label>
            {logoPreview && (
              <button onClick={handleUploadLogo} disabled={uploading}
                className="ml-2 inline-flex items-center gap-2 bg-sky-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors">
                {uploading ? 'Subiendo...' : 'Guardar logo'}
              </button>
            )}
            {uploadOk && <p className="flex items-center gap-1 text-green-600 text-sm mt-2"><CheckCircle size={14} /> Logo guardado</p>}
            {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Key size={18} className="text-sky-600" /> Código de acceso para trabajadores
          </h3>
          {!editingCode && (
            <button onClick={() => { setEditingCode(true); setNewCode(company?.companyCode || ''); setCodeOk(false); }}
              className="flex items-center gap-1.5 text-sm text-sky-600 hover:underline font-medium">
              <Pencil size={14} /> Cambiar
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Comparte este código con tus trabajadores para que puedan iniciar sesión en la app móvil.
          Usa las iniciales de tu empresa para que sea fácil de recordar.
        </p>

        {editingCode ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="Ej: VS, RRHH, CORP..."
                maxLength={8}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-lg font-bold text-sky-700 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <p className="text-xs text-gray-400">Entre 2 y 8 caracteres. Solo letras y números. Si ya existe, agrega un número (ej: VS2).</p>
            {codeError && <p className="text-red-600 text-sm">{codeError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setEditingCode(false); setCodeError(''); }}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveCode} disabled={savingCode || newCode.length < 2}
                className="flex-1 bg-sky-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors">
                {savingCode ? 'Guardando...' : 'Guardar código'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-mono font-bold text-sky-700 tracking-widest">{company?.companyCode || '——'}</p>
            {codeOk && <p className="flex items-center justify-center gap-1 text-green-600 text-sm mt-2"><CheckCircle size={14} /> Código actualizado</p>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <ImageIcon size={18} className="text-sky-600" /> Firma digital del administrador
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Esta firma se imprimirá automáticamente en los certificados generados para los trabajadores. Sube una imagen PNG con fondo transparente.
        </p>
        <SignatureUpload />
      </div>
    </div>
  );
}
