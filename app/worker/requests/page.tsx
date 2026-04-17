'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Request {
  id: number;
  type: string;
  details: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://brilliant-love-production.up.railway.app/api';

const TYPE_OPTIONS = [
  { value: 'vacaciones', label: '🏖️ Vacaciones' },
  { value: 'permiso', label: '🕐 Permiso' },
  { value: 'certificado', label: '🏅 Certificado de trabajo' },
  { value: 'otro', label: '📋 Otro' },
];

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#fff3cd', text: '#664d03', label: 'Pendiente' },
  aprobada:  { bg: '#d1f2d1', text: '#0a5c0a', label: 'Aprobada' },
  rechazada: { bg: '#fde8e8', text: '#8b0000', label: 'Rechazada' },
};

function RequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [form, setForm] = useState({ type: 'vacaciones', details: '' });
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  function getToken() {
    return localStorage.getItem('ch_worker_token') || '';
  }

  function fetchRequests() {
    const token = getToken();
    if (!token) { router.replace('/worker'); return; }
    fetch(`${API}/requests/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRequests(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchRequests(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSending(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: form.type, details: form.details }),
      });
      if (!res.ok) throw new Error('Error al enviar');
      setForm({ type: 'vacaciones', details: '' });
      setShowForm(false);
      setLoading(true);
      fetchRequests();
    } catch {
      setFormError('No se pudo enviar la solicitud');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#fff', padding: 'calc(env(safe-area-inset-top) + 16px) 20px 16px', borderBottom: '0.5px solid #e5e5ea' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1c1c1e', margin: 0 }}>Solicitudes</h1>
            <p style={{ fontSize: 14, color: '#8e8e93', margin: '4px 0 0' }}>Tus pedidos al administrador</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '8px 16px', background: '#0071e3', color: '#fff',
              border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Nueva
          </button>
        </div>
      </div>

      {/* Nueva solicitud form */}
      {showForm && (
        <div style={{ margin: 16, background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#1c1c1e' }}>Nueva solicitud</h2>
          <form onSubmit={handleSend}>
            <label style={labelStyle}>Tipo de solicitud</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={inputStyle}
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <label style={{ ...labelStyle, marginTop: 12 }}>Detalle (opcional)</label>
            <textarea
              value={form.details}
              onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
              placeholder="Ej: Solicito vacaciones del 10 al 20 de mayo..."
              rows={4}
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
            />

            {formError && <p style={{ color: '#ff3b30', fontSize: 13, margin: '8px 0' }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: 14, background: '#f2f2f7', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#1c1c1e' }}>
                Cancelar
              </button>
              <button type="submit" disabled={sending}
                style={{ flex: 1, padding: 14, background: '#0071e3', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#fff', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div style={{ padding: '8px 16px 16px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>Cargando...</div>}

        {!loading && requests.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ color: '#8e8e93', fontSize: 16 }}>Aún no tienes solicitudes</p>
            <button onClick={() => setShowForm(true)}
              style={{ marginTop: 16, padding: '12px 24px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Crear primera solicitud
            </button>
          </div>
        )}

        {!loading && requests.map(req => {
          const st = STATUS_COLOR[req.status] || STATUS_COLOR.pendiente;
          const typeLabel = TYPE_OPTIONS.find(t => t.value === req.type)?.label || req.type;
          return (
            <div key={req.id} style={{
              background: '#fff', borderRadius: 16, padding: '14px 16px',
              marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1c1c1e', margin: 0 }}>{typeLabel}</p>
                <span style={{
                  padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: st.bg, color: st.text,
                }}>{st.label}</span>
              </div>
              {req.details && <p style={{ fontSize: 13, color: '#636366', margin: '0 0 6px', lineHeight: 1.4 }}>{req.details}</p>}
              <p style={{ fontSize: 12, color: '#aeaeb2', margin: 0 }}>{new Date(req.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {req.admin_note && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#f2f2f7', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#636366', margin: 0 }}>
                    <strong>Respuesta:</strong> {req.admin_note}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#8e8e93',
  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '12px 14px',
  background: '#f2f2f7', border: 'none', borderRadius: 12,
  fontSize: 16, color: '#1c1c1e', boxSizing: 'border-box', outline: 'none',
};

export default function WorkerRequests() {
  return (
    <Suspense>
      <RequestsContent />
    </Suspense>
  );
}
