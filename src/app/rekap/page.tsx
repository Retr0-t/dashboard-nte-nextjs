'use client'
import { useEffect, useState } from 'react'
import { getAvailableDates, getStok, buildPivot, getGrandTotal } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, shortWH, OP_COLORS } from '@/lib/masterData'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Zap, FileDown, ChevronDown, ChevronRight } from 'lucide-react'
import { generatePDF } from '@/lib/exportReport'
import toast from 'react-hot-toast'

export default function RekapPage() {
  const [dates, setDates]       = useState<string[]>([])
  const [selDate, setSelDate]   = useState('')
  const [scope, setScope]       = useState('Semua')
  const [results, setResults]   = useState<Record<string, any[]>>({})
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [grandAll, setGrandAll] = useState<any[]>([])

  useEffect(() => {
    getAvailableDates().then(d => { setDates(d); if (d[0]) setSelDate(d[0]) })
  }, [])

  const scopeOpts = ['Semua', ...ALL_OPERATORS, ...Object.keys(AREA_CONFIG)]

  const handleGenerate = async () => {
    setLoading(true)
    const res: Record<string, any[]> = {}
    const keys = scope === 'Semua'
      ? Object.keys(AREA_CONFIG)
      : ALL_OPERATORS.includes(scope as any)
        ? Object.keys(AREA_CONFIG).filter(k => AREA_CONFIG[k].operator === scope)
        : [scope]

    for (const ak of keys) {
      const cfg = AREA_CONFIG[ak]
      const raw = await getStok({ tanggal: selDate, area_key: ak })
      res[ak]   = buildPivot(raw, cfg.warehouses)
    }
    setGrandAll(await getGrandTotal(selDate))
    setResults(res)
    setExpanded(new Set(Object.keys(res)))
    setLoading(false)
    toast.success('Rekap berhasil di-generate!')
  }

  const toggle = (k: string) => setExpanded(p => {
    const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n
  })

  const opTotals = ALL_OPERATORS.map(op => ({
    op,
    total: grandAll.filter(r => r.operator === op).reduce((s, r) => s + r.closing_stock, 0),
  }))
  const allTotal = opTotals.reduce((s, o) => s + o.total, 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Rekap Otomatis</h1>
        <p className="page-subtitle">Generate pivot stok semua operator-area dengan 1 klik</p>
      </div>

      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <select className="input-base w-40" value={selDate} onChange={e => setSelDate(e.target.value)}>
          {dates.map(d => <option key={d} value={d}>{format(new Date(d), 'dd MMM yyyy', { locale: id })}</option>)}
        </select>
        <select className="input-base w-56" value={scope} onChange={e => setScope(e.target.value)}>
          {scopeOpts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleGenerate} disabled={loading} className="btn-primary">
          <Zap size={14} />{loading ? 'Memproses...' : 'Generate Rekap'}
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <>
          {scope === 'Semua' && (
            <div className="card p-5 mb-5">
              <div className="text-sm font-display font-semibold text-[#1A2332] mb-4">Grand Total Semua Operator</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {opTotals.map(({ op, total }) => (
                  <div key={op} className="rounded-xl p-4 border"
                    style={{ background: OP_COLORS[op].light, borderColor: OP_COLORS[op].bg + '44' }}>
                    <div className="text-xs font-bold mb-1" style={{ color: OP_COLORS[op].bg }}>{op}</div>
                    <div className="text-2xl font-display font-bold text-[#1A2332]">{total.toLocaleString('id')}</div>
                    <div className="text-xs text-slate-400">unit</div>
                  </div>
                ))}
                <div className="rounded-xl p-4 bg-[#1E3A5F] border border-[#0D2137]">
                  <div className="text-xs font-bold text-white/50 mb-1">SEMUA</div>
                  <div className="text-2xl font-display font-bold text-white">{allTotal.toLocaleString('id')}</div>
                  <div className="text-xs text-white/40">unit</div>
                </div>
              </div>
            </div>
          )}

          {ALL_OPERATORS.map(op => {
            const opKeys = Object.keys(results).filter(k => AREA_CONFIG[k].operator === op)
            if (!opKeys.length) return null
            const col = OP_COLORS[op]
            return (
              <div key={op} className="mb-5">
                <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-white mb-3"
                  style={{ background: col.bg }}>{op}</div>
                {opKeys.map(ak => {
                  const cfg  = AREA_CONFIG[ak]
                  const rows = results[ak] || []
                  const tot  = rows.reduce((s, r) => s + r.grand_total, 0)
                  const isExp = expanded.has(ak)
                  return (
                    <div key={ak} className="card mb-3 overflow-hidden">
                      <button onClick={() => toggle(ak)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 text-left">
                          {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span className="text-sm font-semibold text-[#1A2332]">{op} — {cfg.area}</span>
                          <span className="text-xs text-slate-400">{cfg.warehouses.length} WH · {rows.length} baris</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-red-600">{tot.toLocaleString('id')} unit</span>
                          {rows.length > 0 && (
                            <button onClick={e => { e.stopPropagation(); generatePDF({ rows, warehouses: cfg.warehouses, operator: op, area: cfg.area, tanggal: selDate }) }}
                              className="btn-ghost text-xs px-2 py-1">
                              <FileDown size={12} /> PDF
                            </button>
                          )}
                        </div>
                      </button>

                      {isExp && (
                        <div className="overflow-auto border-t border-[#E2EAF2]">
                          {rows.length === 0
                            ? <div className="p-8 text-center text-slate-400 text-sm">Tidak ada data stok.</div>
                            : (
                              <table className="data-table" style={{ minWidth: `${300 + cfg.warehouses.length * 75}px` }}>
                                <thead>
                                  <tr>
                                    <th className="text-left" style={{ background: '#0D2137' }}>JENIS 2</th>
                                    <th style={{ background: '#0D2137' }}>STATUS</th>
                                    <th className="text-left" style={{ background: '#0D2137' }}>TYPE</th>
                                    {cfg.warehouses.map(wh => (
                                      <th key={wh} style={{ background: col.bg, fontSize: '9px' }}>{shortWH(wh)}</th>
                                    ))}
                                    <th style={{ background: '#C0392B' }}>TOTAL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    let prev = ''
                                    return rows.map((r, i) => {
                                      const jenis = r.jenis_nte !== prev ? r.jenis_nte : ''
                                      prev = r.jenis_nte
                                      return (
                                        <tr key={i}>
                                          <td className={`td-label text-[11px] ${jenis ? 'font-bold text-navy bg-blue-50/40' : ''}`}>{jenis}</td>
                                          <td><span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${r.status_nte === 'NTE BARU' ? 'badge-baru' : 'badge-refurbish'}`}>{r.status_nte === 'NTE BARU' ? 'BARU' : 'RFBSH'}</span></td>
                                          <td className="td-label text-[11px] font-mono pl-3">{r.type_nte.replace(/_/g, ' ')}</td>
                                          {cfg.warehouses.map(wh => {
                                            const v = (r[wh] || 0) as number
                                            return <td key={wh} className={`text-xs ${v > 0 ? 'text-slate-700' : 'text-slate-200'}`}>{v || ''}</td>
                                          })}
                                          <td className="font-bold text-red-600 bg-red-50/40 text-xs">{r.grand_total || ''}</td>
                                        </tr>
                                      )
                                    })
                                  })()}
                                  <tr className="bg-navy">
                                    <td colSpan={3} className="text-white font-bold text-xs py-2.5 pl-4">Grand Total</td>
                                    {cfg.warehouses.map(wh => {
                                      const t = rows.reduce((s, r) => s + ((r[wh] || 0) as number), 0)
                                      return <td key={wh} className="text-center text-xs font-bold text-white/80">{t || ''}</td>
                                    })}
                                    <td className="text-center font-bold text-white bg-[#C0392B] text-xs">{tot}</td>
                                  </tr>
                                </tbody>
                              </table>
                            )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </>
      )}

      {Object.keys(results).length === 0 && (
        <div className="card p-16 text-center">
          <Zap size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Klik <strong>Generate Rekap</strong> untuk memulai</p>
        </div>
      )}
    </div>
  )
}
