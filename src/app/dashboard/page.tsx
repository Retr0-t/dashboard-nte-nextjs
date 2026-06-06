'use client'
import { useEffect, useState } from 'react'
import { getDashboardStats, getWHCoverage } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS } from '@/lib/masterData'
import { Package, Building2, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

export default function DashboardPage() {
  const OWNER_MAP: Record<string, string> = {
  TELKOMSEL: 'INV',
  TELKOM: 'CCAN',
  TIF: 'TIF'
}
  const [stats,    setStats]    = useState<any>(null)
  const [coverage, setCoverage] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([getDashboardStats(), getWHCoverage()])
      setStats(s); setCoverage(c)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

 const reportedSet = new Set(
  coverage.map((r: any) => `${r.owner}|${r.wh_so}`)
)
  const totalWH = Object.values(AREA_CONFIG).reduce((s, v) => s + v.warehouses.length, 0)

 const lastSync = stats?.lastUpdated
  ? formatDistanceToNow(new Date(stats.lastUpdated), {
      addSuffix: true,
      locale: id
    })
  : null

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Overview Stok NTE</h1>
          <p className="page-subtitle">Data realtime dari Google Sheets via Supabase</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-xs">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Sync status bar */}
      {stats && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 font-semibold">
            {stats.totalUnits?.toLocaleString('id')} unit NTE tersimpan di Supabase
          </span>
          {lastSync && (
            <span className="text-emerald-600 flex items-center gap-1 ml-1">
              <Clock size={11} /> Sync {lastSync}
            </span>
          )}
          <Link href="/gsheet" className="ml-auto text-emerald-600 hover:underline font-medium">
            Kelola G-Sheet Sync →
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-[#1E3A5F]">
              {loading ? <div className="skeleton w-20 h-7" /> : stats?.totalUnits?.toLocaleString('id') || '0'}
            </div>
            <Package size={18} className="text-slate-300 mt-1" />
          </div>
          <div className="stat-label">Total Unit NTE</div>
          <div className="text-xs text-slate-400 mt-0.5">dari G-Sheet master</div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-emerald-600">
              {loading ? <div className="skeleton w-16 h-7" /> : `${reportedSet.size}/${totalWH}`}
            </div>
            <Building2 size={18} className="text-slate-300 mt-1" />
          </div>
          <div className="stat-label">WH Ada Data</div>
          <div className="text-xs text-slate-400 mt-0.5">dari {totalWH} warehouse terdaftar</div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-sky-600">
              {loading ? <div className="skeleton w-12 h-7" /> : stats?.owners?.length || '0'}
            </div>
            <CheckCircle2 size={18} className="text-slate-300 mt-1" />
          </div>
          <div className="stat-label">Operator Aktif</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats?.operators?.join(', ') || '-'}
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-violet-600 text-lg leading-tight mt-1">
              {loading ? <div className="skeleton w-24 h-6" /> : (lastSync || 'Belum sync')}
            </div>
            <Clock size={18} className="text-slate-300 mt-1" />
          </div>
          <div className="stat-label">Terakhir Sync</div>
          <div className="text-xs text-slate-400 mt-0.5">dari G-Sheet</div>
        </div>
      </div>

      {/* Per operator coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {ALL_OPERATORS.map(op => {
          const col = OP_COLORS[op]
          const opKeys = Object.entries(AREA_CONFIG).filter(([, v]) => v.operator === op)
          const opWH = opKeys.reduce((s, [, v]) => s + v.warehouses.length, 0)
          const opReported = coverage.filter(   (r: any) => r.owner === OWNER_MAP[op] ).length
          const pct = opWH > 0 ? Math.round(opReported / opWH * 100) : 0
          const opTotal = stats?.totalUnits ? null : null // shown per operator below

          return (
            <div key={op} className="card card-hover p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: col.bg }}>
                  {op}
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm font-semibold text-slate-500">{opReported}/{opWH} WH</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: col.bg }} />
                </div>
                <div className="text-xs text-slate-400 mt-1">{pct}% warehouse ada data</div>
              </div>

              {/* Area rows */}
              {opKeys.map(([ak, cfg]) => {
                const repCount = coverage.filter((r: any) => r.owner === OWNER_MAP[op] && cfg.warehouses.includes(r.wh_so)).length
                const done = repCount === cfg.warehouses.length
                return (
                  <div key={ak} className="flex items-center justify-between py-2 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs">
                      {done
                        ? <CheckCircle2 size={12} className="text-emerald-500" />
                        : <AlertCircle  size={12} className="text-amber-500" />}
                      <span className="text-slate-600 font-medium">{cfg.area}</span>
                      <span className="text-slate-400">{repCount}/{cfg.warehouses.length} WH</span>
                    </div>
                    <Link href={`/laporan-harian?op=${op}&area=${cfg.area}`}
                      className="text-[11px] text-[#2E6DA4] hover:underline">
                      Lihat →
                    </Link>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* WH coverage detail */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-semibold text-[#1A2332] mb-4">Detail Coverage Warehouse</h2>
        <div className="space-y-5">
          {ALL_OPERATORS.map(op => {
            const col = OP_COLORS[op]
            return (
              <div key={op}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.bg }} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{op}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(AREA_CONFIG)
                    .filter(([, v]) => v.operator === op)
                    .map(([ak, cfg]) => (
                      <div key={ak} className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs font-semibold text-slate-600 mb-2">📍 {cfg.area}</div>
                        <div className="flex flex-wrap gap-1">
                          {cfg.warehouses.map(wh => {
                            const ok = reportedSet.has(`${OWNER_MAP}|${wh}`)
                            const sh = wh.replace(/TA SO (INV|CCAN|TIF) /,'').replace(/ WH$/,'')
                            return (
                              <span key={wh}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium
                                  ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-400'}`}>
                                {ok ? '✓' : '✗'} {sh}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
