'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://brilliant-love-production.up.railway.app/api';

export default function WorkerLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ companyCode: '', rut: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('ch_worker_token')) {
      router.replace('/worker/home');
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/worker/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyCode: form.companyCode.trim().toUpperCase(),
          rut: form.rut.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      localStorage.setItem('ch_worker_token', data.token);
      localStorage.setItem('ch_worker_info', JSON.stringify(data.worker));
      router.push('/worker/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 72, height: 72, background: '#0071e3', borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 32,
        }}>👥</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Capital Humano</h1>
        <p style={{ color: '#8e8e93', fontSize: 14, margin: '4px 0 0' }}>App Trabajadores</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
            <label style={{ display: 'block', padding: '12px 16px 0', fontSize: 11, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Código empresa</label>
            <input
              type="text"
              placeholder="Ej: AB1234"
              value={form.companyCode}
              onChange={e => setForm(f => ({ ...f, companyCode: e.target.value }))}
              style={{
                display: 'block', width: '100%', background: 'transparent', border: 'none',
                color: '#fff', fontSize: 17, padding: '4px 16px 12px', outline: 'none',
              }}
              autoCapitalize="characters"
              required
            />
          </div>
          <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
            <label style={{ display: 'block', padding: '12px 16px 0', fontSize: 11, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>RUT</label>
            <input
              type="text"
              placeholder="12345678-9"
              value={form.rut}
              onChange={e => setForm(f => ({ ...f, rut: e.target.value }))}
              style={{
                display: 'block', width: '100%', background: 'transparent', border: 'none',
                color: '#fff', fontSize: 17, padding: '4px 16px 12px', outline: 'none',
              }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', padding: '12px 16px 0', fontSize: 11, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{
                display: 'block', width: '100%', background: 'transparent', border: 'none',
                color: '#fff', fontSize: 17, padding: '4px 16px 12px', outline: 'none',
              }}
              required
            />
          </div>
        </div>

        {error && (
          <p style={{ color: '#ff453a', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '16px', background: '#0071e3',
            color: '#fff', border: 'none', borderRadius: 14,
            fontSize: 17, fontWeight: 600, cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p style={{ color: '#48484a', fontSize: 12, marginTop: 32, textAlign: 'center' }}>
        ¿No tienes acceso? Contacta al administrador de tu empresa
      </p>
    </div>
  );
}
