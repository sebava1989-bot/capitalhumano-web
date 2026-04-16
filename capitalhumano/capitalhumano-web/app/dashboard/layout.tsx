'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, ClipboardList, LogOut, LayoutDashboard, Settings, HeadphonesIcon, CreditCard, Award, UserX } from 'lucide-react';

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

  useEffect(() => {
    const token = localStorage.getItem('ch_token');
    const companyData = localStorage.getItem('ch_company');
    if (!token) { router.replace('/login'); return; }
    if (companyData) setCompany(JSON.parse(companyData));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('ch_token');
    localStorage.removeItem('ch_company');
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-10 max-w-[160px] object-contain mb-3"
            />
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
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
