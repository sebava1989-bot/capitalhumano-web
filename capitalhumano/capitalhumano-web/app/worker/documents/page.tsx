'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Doc {
  id: number;
  name: string;
  type: string;
  period: string | null;
  file_url: string;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://brilliant-love-production.up.railway.app/api';

const TYPE_LABELS: Record<string, string> = {
  liquidacion: 'Liquidación',
  contrato: 'Contrato',
  anexo: 'Anexo',
  certificado: 'Certificado',
  otro: 'Otro',
};

const TYPE_EMOJI: Record<string, string> = {
  liquidacion: '💰',
  contrato: '📝',
  anexo: '📎',
  certificado: '🏅',
  otro: '📄',
};

export default function WorkerDocuments() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('ch_worker_token');
    if (!token) { router.replace('/worker'); return; }

    fetch(`${API}/documents/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDocs(data);
        else setError('Error al cargar documentos');
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#fff', padding: '56px 20px 16px', borderBottom: '0.5px solid #e5e5ea' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1c1c1e', margin: 0 }}>Documentos</h1>
        <p style={{ fontSize: 14, color: '#8e8e93', margin: '4px 0 0' }}>Tus liquidaciones, contratos y más</p>
      </div>

      <div style={{ padding: '16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>Cargando...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: 40, color: '#ff3b30' }}>{error}</div>
        )}
        {!loading && !error && docs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <p style={{ color: '#8e8e93', fontSize: 16 }}>Aún no tienes documentos</p>
          </div>
        )}
        {!loading && docs.map(doc => (
          <div key={doc.id} style={{
            background: '#fff', borderRadius: 16, padding: '14px 16px',
            marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: '#f2f2f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>
              {TYPE_EMOJI[doc.type] || '📄'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1c1c1e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
              <p style={{ fontSize: 12, color: '#8e8e93', margin: '2px 0 0' }}>
                {TYPE_LABELS[doc.type] || doc.type}
                {doc.period ? ` · ${doc.period}` : ''}
                {' · '}{new Date(doc.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '8px 14px', background: '#0071e3', color: '#fff',
                borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
              }}
            >
              Ver PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
