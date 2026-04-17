'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, ClipboardList, LogOut, LayoutDashboard, Settings, HeadphonesIcon, CreditCard, Award, UserX, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/workers', label: 'Trabajadores', icon: Users },
  { href: '/dashboard/finiquitados', label: 'Finiquitados', icon: UserX },
  { href: '/dashboard/documents', label: 'Documentos', icon: FileText },
  { href: '/dashboard/certificates', label: 'Certificados', icon: Award },
  { href: '/dashboard/requests', label: 'Solicitudes', icon: ClipboardList },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  { href: '/dashboard/plans', label: 'Mi Plan', icon: CreditCard },
  { href: '/dashboard/soporte', label: 'Soporte', icon: HeadphonesIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [company, setCompany] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ch_token');
    const companyData = localStorage.getItem('ch_company');
    if (!token) { router.replace('/login'); return; }
    if (companyData) setCompany(JSON.parse(companyData));
  }, [router]);

  // Cierra el menú al cambiar de página
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleLogout() {
    localStorage.removeItem('ch_token');
    localStorage.removeItem('ch_company');
    router.push('/login');
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200">
        {company?.logoUrl ? (
          <img src={company.logoUrl} alt={company.name} className="h-10 max-w-[160px] object-contain mb-3" />
        ) : (
          <h1 className="text-xl font-bold text-sky-600 mb-1">CapitalHumano</h1>
        )}
        {company && (
          <>
            <p className="text-sm text-gray-700 font-medium truncate">{company.name}</p>
            {company.companyCode && (
              <p className="text-xs text-gray-400 mt-0.5">Código: <span className="font-mono font-bold">{company.companyCode}</span></p>
            )}
          </>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-sky-50 text-sky-700 border-l-2 border-sky-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Desarrollado por</p>
          <p className="text-xs font-semibold text-sky-600">Tu Amigo Digital SpA</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Overlay móvil */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar móvil (drawer) */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-bold text-sky-600">Menú</span>
          <button onClick={() => setMenuOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          {sidebarContent}
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 bg-white border-b border-gray-200 shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)', paddingBottom: 10 }}>
          <button onClick={() => setMenuOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu size={22} className="text-gray-700" />
          </button>
          <span className="font-bold text-sky-600 text-lg">CapitalHumano</span>
          {company?.companyCode && (
            <span className="ml-auto text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded">
              {company.companyCode}
            </span>
          )}
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
