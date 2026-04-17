'use client';
import { useEffect, useState } from 'react';
import { Users, FileText, ClipboardList, Clock, Building2, Download, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

const APK_WORKER_URL = 'https://github.com/sebava1989-bot/capitalhumano-backend-/releases/download/v1.0.0/capitalhumano-worker-v1.0.0.apk';
const APK_ADMIN_URL = 'https://github.com/sebava1989-bot/capitalhumano-backend-/releases/download/v1.0.0-admin/capitalhumano-admin-v1.0.0.apk';

interface Stats {
  workers: { active: number; total: number };
  documents: { total: number };
  requests: { pending: number; total: number };
  company: { name: string; plan: string; company_code: string; plan_expires_at: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 md:p-8 text-gray-500">Cargando...</div>;
  if (!stats) return <div className="p-4 md:p-8 text-red-500">Error al cargar datos</div>;

  const cards = [
    { label: 'Trabajadores activos', value: stats.workers.active, icon: Users, color: 'bg-sky-500', href: '/dashboard/workers' },
    { label: 'Total trabajadores', value: stats.workers.total, icon: Users, color: 'bg-blue-500', href: '/dashboard/workers' },
    { label: 'Documentos subidos', value: stats.documents.total, icon: FileText, color: 'bg-blue-600', href: '/dashboard/documents' },
    { label: 'Solicitudes pendientes', value: stats.requests.pending, icon: ClipboardList, color: 'bg-amber-500', href: '/dashboard/requests' },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Building2 size={14} />
            Código empresa trabajadores: <span className="font-mono font-bold text-sky-700 ml-1">{stats.company.company_code}</span>
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          stats.company.plan === 'freemium' ? 'bg-gray-100 text-gray-600' :
          stats.company.plan === 'pyme' ? 'bg-sky-100 text-sky-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          Plan {stats.company.plan}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className={`${color} p-3 rounded-lg shrink-0`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {stats.requests.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <Clock size={18} />
            Tienes {stats.requests.pending} solicitud{stats.requests.pending > 1 ? 'es' : ''} pendiente{stats.requests.pending > 1 ? 's' : ''} de revisión
          </p>
          <Link href="/dashboard/requests" className="text-sm text-amber-700 underline mt-1 inline-block">
            Ver solicitudes →
          </Link>
        </div>
      )}

      {/* APK Download Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Worker APK */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="bg-sky-500 p-3 rounded-lg shrink-0">
              <Smartphone size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">App Trabajadores</h3>
              <p className="text-sm text-gray-600 mb-3">
                Para instalar en los celulares de tus trabajadores. Ingresan con código <span className="font-mono font-bold text-sky-700">{stats.company.company_code}</span> y su RUT.
              </p>
              <a
                href={APK_WORKER_URL}
                download="capitalhumano-worker.apk"
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={15} />
                Descargar APK
              </a>
              <p className="text-xs text-gray-400 mt-2">Android 6.0+ · v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Admin APK */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 p-3 rounded-lg shrink-0">
              <Smartphone size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">App Administrador</h3>
              <p className="text-sm text-gray-600 mb-3">
                Para gestionar tu empresa desde el celular. Accede al panel completo desde Android.
              </p>
              <a
                href={APK_ADMIN_URL}
                download="capitalhumano-admin.apk"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={15} />
                Descargar APK
              </a>
              <p className="text-xs text-gray-400 mt-2">Android 6.0+ · v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
