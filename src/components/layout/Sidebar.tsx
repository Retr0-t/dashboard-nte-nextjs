'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TableProperties, RefreshCw,
  Download, Sheet, Database, BarChart3, ChevronRight
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Overview' },
  { href: '/laporan-harian', icon: TableProperties,  label: 'Laporan Harian' },
  { href: '/rekap',          icon: RefreshCw,        label: 'Rekap Otomatis' },
  { href: '/export',         icon: Download,         label: 'Export PDF / JPG' },
  { href: '/gsheet',         icon: Sheet,            label: 'G-Sheet Sync' },
  { href: '/master',         icon: Database,         label: 'Master Data' },
]

const OP_DOT: Record<string, string> = {
  TELKOMSEL: '#2E7D32',
  TELKOM:    '#1565C0',
  TIF:       '#F4511E',
}

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0D2137] flex flex-col z-50 shadow-2xl">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E6DA4] to-[#1E3A5F] flex items-center justify-center shadow-lg">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-tight">NTE Dashboard</div>
            <div className="text-[10px] text-slate-400 font-medium">Telkom Indonesia</div>
          </div>
        </div>
      </div>

      {/* Operator dots */}
      <div className="px-5 py-3 border-b border-white/10">
        <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-2">Operator</div>
        <div className="flex gap-3">
          {Object.entries(OP_DOT).map(([op, color]) => (
            <div key={op} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[11px] text-slate-400">{op}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest px-3 mb-2">Menu</div>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href}>
              <div className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={16} className={active ? 'text-white' : 'text-slate-400'} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={12} className="text-slate-400" />}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-[10px] text-slate-600 text-center">v2.0.0 · NTE Operations · Telkom Indonesia</div>
      </div>
    </aside>
  )
}
