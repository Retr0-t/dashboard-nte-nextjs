'use client'
import { useEffect, useState } from 'react'
import { getDashboardStats, getWHCoverage } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS, OP_TO_OWNER,  } from '@/lib/masterData'
import { Package, Building2, CheckCircle2, AlertCircle, Clock, RefreshCw, Database } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats,    setStats]    = useState<any>(null)
  const [coverage, setCoverage] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([getDashboardStats(), getWHCoverage()])
      setStats(s); setCoverage(c)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // reported = Set of "owner|wh_so"
  const reportedSet = new Set(coverage.map((r: any) => `${r.owner}|${r.wh_so}`))
  const totalWH     = Object.values(AREA_CONFIG).reduce((s, v) => s + v.warehouses.length, 0)

  const lastUpdated = stats?.lastUpdated
    ? formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: id })
    : null

  // Count per operator from ownerCount { INV: N, CCAN: N, TIF: N }
  const ownerCount = stats?.ownerCount || {}

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Overview Stok NTE</h1>
          <p className="page-subtitle">Data realtime dari Supabase · tabel master_stock_nte</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-xs">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      {/* DB status bar */}
      <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
        <Database size={12} className="text-emerald-600"/>
        <span className="text-emerald-700 font-semibold">
          {loading ? '…' : stats?.totalUnits?.toLocaleString('id')} unit NTE di Supabase
        </span>
        {lastUpdated && (
          <span className="text-emerald-600 flex items-center gap-1">
            <Clock size={11}/> Update {lastUpdated}
          </span>
        )}
        <Link href="/gsheet" className="ml-auto text-emerald-600 hover:underline font-medium">
          G-Sheet Sync →
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-[#1E3A5F]">
              {loading ? <div className="skeleton w-20 h-7"/> : stats?.totalUnits?.toLocaleString('id') || '0'}
            </div>
            <Package size={18} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Total Unit NTE</div>
          <div className="text-xs text-slate-400 mt-0.5">semua owner · semua WH</div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-emerald-600">
              {loading ? <div className="skeleton w-16 h-7"/> : `${reportedSet.size}/${totalWH}`}
            </div>
            <Building2 size={18} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">WH Ada Data</div>
          <div className="text-xs text-slate-400 mt-0.5">dari {totalWH} WH terdaftar</div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-sky-600">
              {loading ? <div className="skeleton w-12 h-7"/> : (stats?.owners?.length || '0')}
            </div>
            <CheckCircle2 size={18} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Owner Aktif</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats?.owners?.join(', ') || '-'}
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div className="stat-value text-violet-600 text-lg mt-1">
              {loading ? <div className="skeleton w-24 h-6"/> : (lastUpdated || 'Belum ada')}
            </div>
            <Clock size={18} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Terakhir Update</div>
          <div className="text-xs text-slate-400 mt-0.5">dari G-Sheet sync</div>
        </div>
      </div>

      {/* Per operator cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {ALL_OPERATORS.map(op => {
          const col      = OP_COLORS[op]
          const owner    = OP_TO_OWNER[op]
          const opKeys   = Object.entries(AREA_CONFIG).filter(([, v]) => v.operator === op)
          const totalOpWH = opKeys.reduce((s, [, v]) => s + v.warehouses.length, 0)
          const reported  = coverage.filter((r: any) => r.owner === owner).length
          const unitCount = ownerCount[owner] || 0
          const pct       = totalOpWH > 0 ? Math.round(reported / totalOpWH * 100) : 0

          return (
            <div key={op} className="card card-hover p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: col.bg }}>
                  {op}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">owner={owner}</div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-display font-bold text-[#1A2332]">
                    {loading ? '…' : unitCount.toLocaleString('id')}
                  </div>
                  <div className="text-[10px] text-slate-400">unit</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>WH ada data</span>
                  <span className="font-semibold">{reported}/{totalOpWH}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: col.bg }}/>
                </div>
              </div>

              {/* Area rows */}
              {opKeys.map(([ak, cfg]) => {
                const areaReported = coverage.filter(
                  (r: any) => r.owner === owner &&
                  cfg.warehouses.includes(r.wh_so)
                ).length
                const done = areaReported === cfg.warehouses.length
                return (
                  <div key={ak} className="flex items-center justify-between py-2 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs">
                      {done
                        ? <CheckCircle2 size={12} className="text-emerald-500"/>
                        : <AlertCircle  size={12} className="text-amber-500"/>}
                      <span className="text-slate-600 font-medium">{cfg.witel}</span>
                      <span className="text-slate-400">{areaReported}/{cfg.warehouses.length} WH</span>
                    </div>
                    <Link href={`/laporan-harian?op=${op}&witel=${cfg.witel}`}
                      className="text-[11px] text-[#2E6DA4] hover:underline font-medium">
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
        <h2 className="text-sm font-display font-semibold text-[#1A2332] mb-4">
          Detail Coverage Warehouse
        </h2>
        <div className="space-y-5">
          {ALL_OPERATORS.map(op => {
            const col   = OP_COLORS[op]
            const owner = OP_TO_OWNER[op]
            return (
              <div key={op}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.bg }}/>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{op}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({owner})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(AREA_CONFIG)
                    .filter(([, v]) => v.operator === op)
                    .map(([ak, cfg]) => (
                      <div key={ak} className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs font-semibold text-slate-600 mb-2">
                          📍 {cfg.witel}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cfg.warehouses.map(wh => {
                            const ok = reportedSet.has(`${owner}|${wh}`)
                            const sh = wh
                              .replace(/TA SO (INV|CCAN|TIF) /, '')
                              .replace(/ WH$/, '')
                            return (
                              <span key={wh}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium
                                  ${ok
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-50 text-red-400'}`}>
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
