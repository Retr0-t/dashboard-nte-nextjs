'use client'
import { useEffect, useState } from 'react'
import { getAvailableDates, getStok, buildPivot } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, NTE_CATALOG, NTE_STATUS, shortWH, OP_COLORS } from '@/lib/masterData'
import { format } from 'date-fns'; import { id } from 'date-fns/locale'
import { FileDown, ImageDown, Eye, EyeOff } from 'lucide-react'
import { generatePDF, generateJPG } from '@/lib/exportReport'

export default function LaporanHarianPage() {
  const [dates, setDates]       = useState<string[]>([])
  const [selDate, setSelDate]   = useState('')
  const [selOp, setSelOp]       = useState<typeof ALL_OPERATORS[number]>(ALL_OPERATORS[0])
  const [selKey, setSelKey]     = useState('')
  const [rows, setRows]         = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const [heatmap, setHeatmap]   = useState(true)
  const [showZeros, setShowZeros] = useState(false)
  const [exporting, setExporting] = useState<'pdf'|'jpg'|null>(null)

  const opKeys = Object.entries(AREA_CONFIG).filter(([,v]) => v.operator === selOp).map(([k]) => k)

  useEffect(() => { getAvailableDates().then(d => { setDates(d); if(d[0]) setSelDate(d[0]) }) }, [])
  useEffect(() => { if(opKeys[0] && !opKeys.includes(selKey)) setSelKey(opKeys[0]) }, [selOp])

  const cfg      = AREA_CONFIG[selKey] || { warehouses: [], area: '' }
  const whs      = cfg.warehouses
  const catalog  = NTE_CATALOG[selOp] || {}
  const col      = OP_COLORS[selOp]

  useEffect(() => {
    if (!selDate || !selKey) return
    setLoading(true)
    getStok({ tanggal: selDate, area_key: selKey })
      .then(data => setRows(buildPivot(data, whs)))
      .finally(() => setLoading(false))
  }, [selDate, selKey])

  const filtered = showZeros ? rows : rows.filter(r => r.grand_total > 0)
  const totalUnit = rows.reduce((s, r) => s + r.grand_total, 0)

  const heatCell = (val: number, maxVal: number) => {
    if (!heatmap || val === 0) return ''
    const r = maxVal > 0 ? val / maxVal : 0
    if (r > 0.8) return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (r > 0.5) return 'bg-green-50 text-green-700 font-medium'
    if (r > 0.2) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-600'
  }

  const handleExport = async (fmt: 'pdf'|'jpg') => {
    setExporting(fmt)
    try {
      const data = { rows: filtered, warehouses: whs, operator: selOp, area: cfg.area, tanggal: selDate }
      if (fmt === 'pdf') await generatePDF(data)
      else               await generateJPG(data)
    } finally { setExporting(null) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Laporan Harian</h1>
          <p className="page-subtitle">Pivot stok NTE per WH · format identik laporan G-Sheet</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setHeatmap(!heatmap)} className="btn-ghost text-xs">
            {heatmap ? <EyeOff size={13}/> : <Eye size={13}/>} Heatmap
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting !== null} className="btn-secondary text-xs">
            <FileDown size={13}/> {exporting==='pdf' ? 'Generating...' : 'PDF'}
          </button>
          <button onClick={() => handleExport('jpg')} disabled={exporting !== null} className="btn-primary text-xs" style={{ background: col.bg }}>
            <ImageDown size={13}/> {exporting==='jpg' ? 'Generating...' : 'JPG'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <select className="input-base w-40" value={selDate} onChange={e => setSelDate(e.target.value)}>
          {dates.map(d => <option key={d} value={d}>{format(new Date(d),'dd MMM yyyy',{locale:id})}</option>)}
        </select>
        <div className="flex gap-1">
          {ALL_OPERATORS.map(op => (
            <button key={op} onClick={() => setSelOp(op)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selOp === op ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              style={selOp === op ? { background: OP_COLORS[op].bg } : {}}
            >{op}</button>
          ))}
        </div>
        <select className="input-base w-40" value={selKey} onChange={e => setSelKey(e.target.value)}>
          {opKeys.map(k => <option key={k} value={k}>{AREA_CONFIG[k].area}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-500 ml-auto cursor-pointer">
          <input type="checkbox" checked={showZeros} onChange={e => setShowZeros(e.target.checked)} className="rounded" />
          Tampilkan baris nol
        </label>
      </div>

      {/* KPI strip */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: 'Total Unit', value: totalUnit.toLocaleString('id') },
          { label: 'Type NTE', value: new Set(rows.map(r => r.type_nte)).size },
          { label: 'Baris Data', value: rows.length },
          { label: 'WH', value: `${whs.filter(wh => rows.some(r => (r[wh]||0) > 0)).length}/${whs.length}` },
        ].map(({label, value}) => (
          <div key={label} className="bg-white rounded-xl border border-[#E2EAF2] px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">{label}</span>
            <span className="text-sm font-bold text-[#1A2332]">{value}</span>
          </div>
        ))}
      </div>

      {/* Report table */}
      <div className="card overflow-hidden" id="laporan-table">
        {/* Report title bar (matches G-Sheet header) */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-[#E2EAF2]"
          style={{ background: col.bg }}>
          <div className="text-white font-display font-bold text-sm tracking-wide">
            STOCK NTE {selOp} — {cfg.area}
          </div>
          <div className="text-white/70 text-xs">{selDate}</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Belum ada data stok untuk kombinasi ini.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="data-table sticky-header" style={{ minWidth: `${240 + 200 + whs.length * 80 + 80}px` }}>
              <thead>
                <tr>
                  <th rowSpan={2} className="text-left w-36" style={{background:'#0D2137'}}>JENIS 2</th>
                  <th rowSpan={2} className="text-center w-24" style={{background:'#0D2137'}}>STATUS</th>
                  <th rowSpan={2} className="text-left w-56" style={{background:'#0D2137'}}>TYPE</th>
                  <th colSpan={whs.length} className="text-center" style={{background: col.bg, fontSize:'10px'}}>
                    WH SO (SESUAI SCMT)
                  </th>
                  <th rowSpan={2} style={{background:'#C0392B'}}>Grand Total</th>
                </tr>
                <tr>
                  {whs.map(wh => (
                    <th key={wh} style={{background: col.bg, fontSize:'9px', fontWeight:600}}>
                      {shortWH(wh)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let prevJenis = ''
                  return filtered.map((row, i) => {
                    const isNewJenis = row.jenis_nte !== prevJenis
                    prevJenis = row.jenis_nte
                    const whVals = whs.map(wh => (row[wh] || 0) as number)
                    const maxVal = Math.max(...whVals)
                    return (
                      <tr key={i}>
                        <td className={`td-label text-[11px] ${isNewJenis ? 'font-bold text-navy bg-navy-50/50' : 'text-slate-300'}`}>
                          {isNewJenis ? row.jenis_nte : ''}
                        </td>
                        <td className="text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${row.status_nte === 'NTE BARU' ? 'badge-baru' : 'badge-refurbish'}`}>
                            {row.status_nte === 'NTE BARU' ? 'BARU' : 'RFBSH'}
                          </span>
                        </td>
                        <td className="td-label text-[11px] font-mono pl-3">{row.type_nte.replace(/_/g,' ')}</td>
                        {whs.map(wh => {
                          const val = (row[wh] || 0) as number
                          return (
                            <td key={wh} className={`text-center text-xs transition-colors ${val > 0 ? heatCell(val, maxVal) : 'text-slate-200'}`}>
                              {val > 0 ? val : ''}
                            </td>
                          )
                        })}
                        <td className="text-center text-xs font-bold text-red-600 bg-red-50/40">
                          {row.grand_total > 0 ? row.grand_total : ''}
                        </td>
                      </tr>
                    )
                  })
                })()}
                {/* Grand total row */}
                <tr className="bg-navy">
                  <td colSpan={3} className="text-white font-bold text-xs py-2.5 pl-4">Grand Total</td>
                  {whs.map(wh => (
                    <td key={wh} className="text-center text-xs font-bold text-white/90">
                      {rows.reduce((s, r) => s + ((r[wh]||0) as number), 0) || ''}
                    </td>
                  ))}
                  <td className="text-center font-bold text-white bg-[#C0392B]">{totalUnit}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
