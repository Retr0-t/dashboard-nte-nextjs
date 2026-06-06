'use client'
import { useEffect, useState } from 'react'
import { getLaporanHarian } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS, shortWH } from '@/lib/masterData'
import { generatePDF } from '@/lib/exportReport'
import { Zap, FileDown, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RekapPage() {
  const [scope,     setScope]     = useState('Semua')
  const [results,   setResults]   = useState<Record<string, any[]>>({})
  const [loading,   setLoading]   = useState(false)
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set())

  const scopeOpts = ['Semua', ...ALL_OPERATORS,
    ...Object.keys(AREA_CONFIG)]

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const keys = scope === 'Semua' ? Object.keys(AREA_CONFIG)
        : ALL_OPERATORS.includes(scope) ? Object.keys(AREA_CONFIG).filter(k => AREA_CONFIG[k].operator === scope)
        : [scope]

      const res: Record<string, any[]> = {}
      for (const ak of keys) {
        const cfg = AREA_CONFIG[ak]
        res[ak] = await getLaporanHarian({ operator: cfg.operator, warehouses: cfg.warehouses })
      }
      setResults(res)
      setExpanded(new Set(Object.keys(res)))
      toast.success('Rekap berhasil di-generate!')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally { setLoading(false) }
  }

  const toggle = (k: string) => setExpanded(p => {
    const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n
  })

  // Grand totals per operator
  const opTotals = ALL_OPERATORS.map(op => ({
    op,
    total: Object.entries(results)
      .filter(([k]) => AREA_CONFIG[k]?.operator === op)
      .reduce((s, [, rows]) => s + rows.reduce((ss, r) => ss + r.grand_total, 0), 0)
  }))
  const allTotal = opTotals.reduce((s, o) => s + o.total, 0)

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="page-title">Rekap Otomatis</h1>
        <p className="page-subtitle">Generate pivot stok semua operator-area sekaligus dari Supabase</p>
      </div>

      {/* Controls */}
      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <select className="input-base w-56" value={scope} onChange={e => setScope(e.target.value)}>
          {scopeOpts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleGenerate} disabled={loading} className="btn-primary">
          <Zap size={14}/> {loading ? 'Memproses...' : 'Generate Rekap'}
        </button>
        {Object.keys(results).length > 0 && (
          <span className="text-xs text-slate-400 ml-2">
            {Object.keys(results).length} laporan di-generate
          </span>
        )}
      </div>

      {/* Grand summary */}
      {Object.keys(results).length > 0 && scope === 'Semua' && (
        <div className="card p-5 mb-5">
          <div className="text-sm font-display font-semibold mb-4">Grand Total Semua Operator</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {opTotals.map(({ op, total }) => (
              <div key={op} className="rounded-xl p-4 border"
                style={{ background: OP_COLORS[op].light, borderColor: OP_COLORS[op].border }}>
                <div className="text-xs font-bold mb-1" style={{ color: OP_COLORS[op].bg }}>{op}</div>
                <div className="text-2xl font-display font-bold text-[#1A2332]">{total.toLocaleString('id')}</div>
                <div className="text-xs text-slate-400">unit</div>
              </div>
            ))}
            <div className="rounded-xl p-4 bg-[#1E3A5F] border border-[#0D2137]">
              <div className="text-xs font-bold text-white/50 mb-1">SEMUA OPERATOR</div>
              <div className="text-2xl font-display font-bold text-white">{allTotal.toLocaleString('id')}</div>
              <div className="text-xs text-white/40">unit</div>
            </div>
          </div>
        </div>
      )}

      {/* Per area results */}
      {ALL_OPERATORS.map(op => {
        const opKeys = Object.keys(results).filter(k => AREA_CONFIG[k]?.operator === op)
        if (!opKeys.length) return null
        const col = OP_COLORS[op]

        return (
          <div key={op} className="mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white mb-3"
              style={{ background: col.bg }}>
              {op}
            </div>

            {opKeys.map(ak => {
              const cfg  = AREA_CONFIG[ak]
              const rows = results[ak] || []
              const tot  = rows.reduce((s, r) => s + r.grand_total, 0)
              const isExp = expanded.has(ak)

              return (
                <div key={ak} className="card mb-3 overflow-hidden">
                  <button onClick={() => toggle(ak)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isExp ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                      <span className="text-sm font-semibold">{op} — {cfg.area}</span>
                      <span className="text-xs text-slate-400">{cfg.warehouses.length} WH · {rows.length} baris</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#C0392B]">{tot.toLocaleString('id')} unit</span>
                      {rows.length > 0 && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            generatePDF({
                              rows, warehouses: cfg.warehouses, operator: op,
                              area: cfg.area, tanggal: new Date().toISOString().split('T')[0]
                            })
                          }}
                          className="btn-ghost text-xs px-2 py-1">
                          <FileDown size={12}/> PDF
                        </button>
                      )}
                    </div>
                  </button>

                  {isExp && (
                    <div className="overflow-auto border-t border-slate-200">
                      {rows.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Tidak ada data stok.</div>
                      ) : (
                        <table className="lap-table" style={{ minWidth: `${300 + cfg.warehouses.length * 75}px` }}>
                          <thead>
                            <tr>
                              <th className="text-left" style={{ background: '#0D2137' }}>JENIS 2</th>
                              <th style={{ background: '#0D2137' }}>STATUS</th>
                              <th className="text-left" style={{ background: '#0D2137' }}>TYPE</th>
                              {cfg.warehouses.map(wh => (
                                <th key={wh} style={{ background: col.bg, fontSize:'9px' }}>{shortWH(wh)}</th>
                              ))}
                              <th style={{ background: '#C0392B' }}>TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              let prev = ''
                              return rows.map((r, i) => {
                                const jenis = r.jenis_nte !== prev ? r.jenis_nte : ''; prev = r.jenis_nte
                                return (
                                  <tr key={i}>
                                    <td className={`td-label text-[11px] pl-3 ${jenis ? 'font-bold text-[#1E3A5F] bg-[#EBF2FA]' : 'text-transparent'}`}>{jenis}</td>
                                    <td>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${r.status_nte==='NTE BARU'?'badge-baru':'badge-refurbish'}`}>
                                        {r.status_nte==='NTE BARU'?'NTE BARU':'REFURBISH'}
                                      </span>
                                    </td>
                                    <td className="td-label text-[11px] font-mono pl-3">{r.type_nte.replace(/_/g,' ')}</td>
                                    {cfg.warehouses.map(wh => {
                                      const v = (r[wh]||0) as number
                                      return <td key={wh} className={`text-xs ${v>0?'text-slate-700':'text-slate-200'}`}>{v||''}</td>
                                    })}
                                    <td className="font-bold text-[#C0392B] bg-[#FADBD8]/40 text-xs">{r.grand_total||''}</td>
                                  </tr>
                                )
                              })
                            })()}
                            <tr style={{ background: '#1E3A5F' }}>
                              <td colSpan={3} className="text-white font-bold text-xs py-2 pl-4">Grand Total</td>
                              {cfg.warehouses.map(wh => {
                                const t = rows.reduce((s,r) => s+((r[wh]||0) as number), 0)
                                return <td key={wh} className="text-center text-xs font-bold text-white/80" style={{background:'#2E6DA4'}}>{t||''}</td>
                              })}
                              <td className="text-center font-bold text-white text-xs" style={{background:'#C0392B'}}>{tot}</td>
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

      {Object.keys(results).length === 0 && (
        <div className="card p-20 text-center">
          <Zap size={36} className="text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">Klik <strong>Generate Rekap</strong> untuk memulai</p>
        </div>
      )}
    </div>
  )
}
