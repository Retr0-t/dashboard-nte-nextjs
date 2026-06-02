'use client'
import { useEffect, useState } from 'react'
import { getAvailableDates, getStok, getWHCoverage } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS } from '@/lib/masterData'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Package, Building2, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [dates, setDates]       = useState<string[]>([])
  const [selDate, setSelDate]   = useState('')
  const [stok, setStok]         = useState<any[]>([])
  const [coverage, setCoverage] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getAvailableDates().then(d => {
      setDates(d)
      if (d[0]) setSelDate(d[0])
    })
  }, [])

  useEffect(() => {
    if (!selDate) return
    setLoading(true)
    Promise.all([getStok({ tanggal: selDate }), getWHCoverage(selDate)])
      .then(([s, c]) => { setStok(s); setCoverage(c) })
      .finally(() => setLoading(false))
  }, [selDate])

  const totalStok   = stok.reduce((s, r) => s + r.closing_stock, 0)
  const totalTypes  = new Set(stok.map(r => r.type_nte)).size
  const totalWH     = Object.values(AREA_CONFIG).reduce((s, v) => s + v.warehouses.length, 0)
  const reportedWH  = new Set(coverage.map(r => `${r.operator}|${r.warehouse}`)).size

  const opStats = ALL_OPERATORS.map(op => {
    const opKeys   = Object.entries(AREA_CONFIG).filter(([,v]) => v.operator === op)
    const opWH     = opKeys.reduce((s, [,v]) => s + v.warehouses.length, 0)
    const reported = new Set(coverage.filter(r => r.operator === op).map(r => r.warehouse)).size
    const total    = stok.filter(r => r.operator === op).reduce((s, r) => s + r.closing_stock, 0)
    return { op, opWH, reported, total }
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Overview Stok NTE</h1>
          <p className="page-subtitle">Monitoring stok harian Network Terminal Environment</p>
        </div>
        <select
          className="input-base w-44 text-sm"
          value={selDate}
          onChange={e => setSelDate(e.target.value)}
        >
          {dates.map(d => (
            <option key={d} value={d}>
              {format(new Date(d), 'dd MMM yyyy', { locale: id })}
            </option>
          ))}
        </select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Stok', value: loading ? '—' : totalStok.toLocaleString('id'), sub: `${totalTypes} type NTE`, icon: Package, color: 'text-navy' },
          { label: 'WH Lapor', value: loading ? '—' : `${reportedWH}/${totalWH}`, sub: reportedWH === totalWH ? '✅ Semua lengkap' : `⚠️ ${totalWH-reportedWH} belum`, icon: Building2, color: reportedWH === totalWH ? 'text-emerald-600' : 'text-amber-600' },
          { label: 'Tanggal Data', value: dates.length, sub: 'hari tersedia', icon: TrendingUp, color: 'text-sky-600' },
          { label: 'Operator Aktif', value: opStats.filter(o => o.reported > 0).length, sub: `dari ${ALL_OPERATORS.length} operator`, icon: CheckCircle2, color: 'text-violet-600' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="stat-card card-hover">
            <div className="flex items-start justify-between">
              <div className={`stat-value ${color}`}>{value}</div>
              <Icon size={18} className="text-slate-300 mt-1" />
            </div>
            <div className="stat-label">{label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Per operator breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {opStats.map(({ op, opWH, reported, total }) => {
          const col = OP_COLORS[op]
          const pct = opWH > 0 ? Math.round(reported / opWH * 100) : 0
          return (
            <div key={op} className="card card-hover p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: col.bg }}>
                  {op}
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-display font-bold text-[#1A2332]">{total.toLocaleString('id')}</div>
                  <div className="text-[10px] text-slate-400">unit</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>WH lapor</span>
                  <span className="font-semibold">{reported}/{opWH}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: col.bg }}
                  />
                </div>
              </div>

              {/* Area breakdown */}
              {Object.entries(AREA_CONFIG)
                .filter(([,v]) => v.operator === op)
                .map(([ak, cfg]) => {
                  const rep = new Set(coverage.filter(r => r.area_key === ak).map(r => r.warehouse)).size
                  const tot = stok.filter(r => r.area_key === ak).reduce((s, r) => s + r.closing_stock, 0)
                  const done = rep === cfg.warehouses.length
                  return (
                    <div key={ak} className="flex items-center justify-between py-1.5 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-xs">
                        {done
                          ? <CheckCircle2 size={12} className="text-emerald-500" />
                          : <AlertCircle size={12} className="text-amber-500" />
                        }
                        <span className="text-slate-600">{cfg.area}</span>
                        <span className="text-slate-400">{rep}/{cfg.warehouses.length} WH</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{tot.toLocaleString('id')}</span>
                    </div>
                  )
                })
              }
            </div>
          )
        })}
      </div>

      {/* WH coverage detail */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-semibold text-[#1A2332] mb-4">Status Pelaporan Warehouse</h2>
        <div className="space-y-5">
          {ALL_OPERATORS.map(op => {
            const col = OP_COLORS[op]
            const opKeys = Object.entries(AREA_CONFIG).filter(([,v]) => v.operator === op)
            return (
              <div key={op}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.bg }} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{op}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {opKeys.map(([ak, cfg]) => (
                    <div key={ak} className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                        <span>📍 {cfg.area}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cfg.warehouses.map(wh => {
                          const reported = coverage.some(r => r.operator === op && r.warehouse === wh)
                          const shortName = wh.replace(/TA SO (INV|CCAN|TIF) /,'').replace(/ WH$/,'')
                          return (
                            <span key={wh} className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${reported ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                              {reported ? '✓' : '✗'} {shortName}
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
