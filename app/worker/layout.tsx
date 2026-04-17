'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/worker/home', label: 'Inicio', icon: HomeIcon },
  { href: '/worker/documents', label: 'Documentos', icon: FileIcon },
  { href: '/worker/requests', label: 'Solicitudes', icon: ClipIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0071e3' : '#8e8e93'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
  );
}
function FileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0071e3' : '#8e8e93'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
function ClipIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0071e3' : '#8e8e93'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/>
    </svg>
  );
}

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ch_worker_token');
    if (!token && pathname !== '/worker') {
      router.replace('/worker');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  const isLogin = pathname === '/worker';

  if (!ready && !isLogin) return null;

  return (
    <div style={{
      height: '100dvh', background: '#f2f2f7', display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
    }}>
      {/* Scrollable content */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
        paddingBottom: isLogin ? 0 : 'calc(env(safe-area-inset-bottom) + 64px)',
      }}>
        {children}
      </div>

      {/* Bottom nav */}
      {!isLogin && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '0.5px solid rgba(0,0,0,0.15)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 100,
        }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '10px 0 6px', textDecoration: 'none',
              }}>
                <Icon active={active} />
                <span style={{ fontSize: 10, color: active ? '#0071e3' : '#8e8e93', fontWeight: active ? 600 : 400 }}>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
