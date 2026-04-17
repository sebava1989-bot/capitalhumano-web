'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import { MEMBERS, getPaymentStatus } from '@/lib/mock-data'
import { LayoutDashboard, Users, Dumbbell, Trophy, AlertTriangle, LogOut, Zap, CreditCard } from 'lucide-react'

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Miembros',   href: '/dashboard/members',   icon: Users },
  { label: 'Cobros',     href: '/dashboard/payments',  icon: CreditCard },
  { label: 'Rutinas',    href: '/dashboard/routines',  icon: Dumbbell },
  { label: 'Ranking',    href: '/dashboard/ranking',   icon: Trophy },
  { label: 'Alertas',    href: '/dashboard/alerts',    icon: AlertTriangle },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const paymentAlerts = MEMBERS.filter(m => {
    const s = getPaymentStatus(m)
    return s === 'overdue' || s === 'due_soon'
  }).length

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col py-5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pb-5 mb-3 border-b border-[#f0f0f2]">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#FF4D00] to-[#CC3D00] flex items-center justify-center shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-extrabold text-[#1a1a1a] leading-none">FitPulse</div>
          <div className="text-[10px] text-[#6b7280] font-medium mt-0.5">Panel Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const isCobros = href === '/dashboard/payments'
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-orange-50 text-[#FF4D00] font-semibold'
                  : 'text-[#6b7280] hover:bg-[#f5f5f7] hover:text-[#1a1a1a]'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {isCobros && paymentAlerts > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {paymentAlerts}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Gym badge + logout */}
      <div className="px-3 mt-4 space-y-2">
        <div className="bg-[#f5f5f7] rounded-[10px] p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#CC3D00] flex items-center justify-center text-white font-extrabold text-sm shrink-0">P</div>
            <div>
              <div className="text-xs font-bold text-[#1a1a1a] leading-none">PowerGym</div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">Plan PRO · activo</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] text-[13px] text-[#6b7280] hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
