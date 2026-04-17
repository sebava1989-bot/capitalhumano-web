'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WorkerInfo {
  id: number;
  fullName: string;
  rut: string;
  position: string;
}

export default function WorkerHome() {
  const router = useRouter();
  const [worker, setWorker] = useState<WorkerInfo | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('ch_worker_info');
    if (!raw) { router.replace('/worker'); return; }
    setWorker(JSON.parse(raw));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('ch_worker_token');
    localStorage.removeItem('ch_worker_info');
    router.replace('/worker');
  }

  if (!worker) return null;

  const initials = worker.fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #0071e3 0%, #004aad 100%)',
        padding: 'calc(env(safe-area-inset-top) + 20px) 24px 28px',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: '0 0 4px' }}>{greeting()},</p>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{worker.fullName}</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '4px 0 0' }}>{worker.position || 'Trabajador'}</p>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 700,
          }}>{initials}</div>
        </div>
        <div style={{
          marginTop: 20, background: 'rgba(255,255,255,0.15)',
          borderRadius: 12, padding: '10px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>RUT:</span>
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>{worker.rut}</span>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <button onClick={() => router.push('/worker/documents')}
          style={cardStyle('#fff')}>
          <div style={{ ...iconBox('#e8f0fe'), fontSize: 24 }}>📄</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1e', margin: 0 }}>Mis documentos</p>
            <p style={{ fontSize: 13, color: '#8e8e93', margin: '2px 0 0' }}>Liquidaciones, contratos y más</p>
          </div>
          <span style={{ color: '#c7c7cc', fontSize: 20 }}>›</span>
        </button>

        <button onClick={() => router.push('/worker/requests')}
          style={cardStyle('#fff')}>
          <div style={{ ...iconBox('#fef3e2'), fontSize: 24 }}>📋</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1e', margin: 0 }}>Mis solicitudes</p>
            <p style={{ fontSize: 13, color: '#8e8e93', margin: '2px 0 0' }}>Vacaciones, permisos y más</p>
          </div>
          <span style={{ color: '#c7c7cc', fontSize: 20 }}>›</span>
        </button>

        <button onClick={() => router.push('/worker/requests?new=1')}
          style={cardStyle('#0071e3')}>
          <div style={{ fontSize: 24 }}>✉️</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 }}>Nueva solicitud</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>Pide vacaciones o permiso</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }}>›</span>
        </button>

      </div>

      {/* Logout */}
      <div style={{ padding: '8px 16px' }}>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '14px', background: 'transparent',
          color: '#ff3b30', border: '1.5px solid #ff3b30', borderRadius: 14,
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const cardStyle = (bg: string): React.CSSProperties => ({
  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
  background: bg, borderRadius: 16, padding: '16px',
  border: 'none', cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
});

const iconBox = (bg: string): React.CSSProperties => ({
  width: 48, height: 48, borderRadius: 12, background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
});
