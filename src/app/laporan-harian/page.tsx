'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLaporanHarian } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS, shortWH } from '@/lib/masterData'
import { generatePDF, generateJPG } from '@/lib/exportReport'
import { FileDown, ImageDown, RefreshCw, Eye, EyeOff, Database } from 'lucide-react'
import { Suspense } from 'react'
import toast from 'react-hot-toast'

interface PivotRow {
  jenis_nte: string; type_nte: string; status_nte: string; grand_total: number
  [wh: string]: string | number
}

function LaporanContent() {
  const params   = useSearchParams()
  const initOp   = params.get('op')   || ALL_OPERATORS[0]
  const initArea = params.get('area') || ''

  const [selOp,  setSelOp]  = useState<string>(initOp)
  const [selKey, setSelKey] = useState<string>('')
  const [rows,   setRows]   = useState<PivotRow[]>([])
  const [loading, setLoading]  = useState(false)
  const [heatmap, setHeatmap]  = useState(true)
  const [exporting, setExporting] = useState<'pdf'|'jpg'|null>(null)

  const opKeys = Object.entries(AREA_CONFIG)
  .filter(([, v]) => v.operator === selOp)
  .map(([k]) => k)

  // Set default area key
  useEffect(() => {
    if (!opKeys.length) return
    if (initArea) {
      const found = opKeys.find(k => AREA_CONFIG[k].area === initArea)
      setSelKey(found || opKeys[0])
    } else if (!opKeys.includes(selKey)) {
      setSelKey(opKeys[0])
    }
  }, [selOp, initArea])

  const cfg = AREA_CONFIG[selKey] || { wh_so: [], area: '', owner: '' }
  const whs = cfg.wh_so
  const col = OP_COLORS[selOp] || OP_COLORS['TELKOMSEL']

  // Load pivot data
  const load = useCallback(async () => {
    if (!selOp || !selKey || !whs.length) return
    setLoading(true)
    try {
      const data = await getLaporanHarian({ owner: selOp, wh_so: whs })
      setRows(data)
    } catch (e: any) {
      toast.error('Gagal memuat: ' + e.message)
      setRows([])
    } finally { setLoading(false) }
  }, [selOp, selKey])

  useEffect(() => { load() }, [load])

  const totalUnit  = rows.reduce((s, r) => s + r.grand_total, 0)
  const totalTypes = Array.from(new Set(rows.map(r => r.type_nte))).length
  const whsWithData = whs.filter(wh => rows.some(r => ((r[wh] as number) || 0) > 0))

  // Heatmap color per cell
  const heat = (val: number, max: number) => {
    if (!heatmap || val === 0) return ''
    const r = max > 0 ? val / max : 0
    if (r > 0.8) return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (r > 0.5) return 'bg-green-50 text-green-700'
    if (r > 0.2) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-600'
  }

  const handleExport = async (fmt: 'pdf'|'jpg') => {
    if (!rows.length) { toast.error('Tidak ada data'); return }
    setExporting(fmt)
    try {
      const d = {
        rows, warehouses: whs, operator: selOp, area: cfg.area,
        tanggal: new Date().toISOString().split('T')[0]
      }
      if (fmt === 'pdf') await generatePDF(d)
      else               await generateJPG(d)
    } catch (e: any) { toast.error('Export gagal: ' + e.message) }
    finally { setExporting(null) }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="page-title">Laporan Harian</h1>
          <p className="page-subtitle">
            Stok dihitung otomatis dari unit fisik di G-Sheet · 1 unit = 1 baris G-Sheet
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setHeatmap(!heatmap)} className="btn-ghost text-xs">
            {heatmap ? <EyeOff size={13}/> : <Eye size={13}/>} Heatmap
          </button>
          <button onClick={load} disabled={loading} className="btn-secondary text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting !== null} className="btn-secondary text-xs">
            <FileDown size={13}/> {exporting==='pdf' ? 'PDF...' : 'PDF'}
          </button>
          <button onClick={() => handleExport('jpg')} disabled={exporting !== null}
            className="btn-primary text-xs" style={{ background: col.bg }}>
            <ImageDown size={13}/> {exporting==='jpg' ? 'JPG...' : 'JPG'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        {/* Operator tabs */}
        <div className="flex gap-1">
          {ALL_OPERATORS.map(op => (
            <button key={op} onClick={() => setSelOp(op)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                ${selOp === op ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              style={selOp === op ? { background: OP_COLORS[op]?.bg } : {}}>
              {op}
            </button>
          ))}
        </div>

        {/* Area select */}
        <select className="input-base w-40" value={selKey} onChange={e => setSelKey(e.target.value)}>
          {opKeys.map(k => (
            <option key={k} value={k}>{AREA_CONFIG[k].area}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Database size={12}/> Sumber: master_stok_nte (Supabase)
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: 'Grand Total',   value: loading ? '…' : totalUnit.toLocaleString('id') + ' unit' },
          { label: 'Type NTE',      value: loading ? '…' : String(totalTypes) },
          { label: 'WH Ada Stok',   value: loading ? '…' : `${whsWithData.length}/${whs.length}` },
          { label: 'Area',          value: `${selOp} — ${cfg.area}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">{label}</span>
            <span className="text-sm font-bold text-[#1A2332]">{value}</span>
          </div>
        ))}
      </div>

      {/* Report table */}
      <div className="card overflow-hidden">
        {/* Title bar — mirip header G-Sheet */}
        <div className="px-5 py-3.5 flex items-center justify-between"
          style={{ background: col.bg }}>
          <div className="text-white font-display font-bold text-sm tracking-wide uppercase">
            STOCK NTE {selOp} {cfg.area}
          </div>
          <div className="text-white/60 text-xs">
            {new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
          </div>
        </div>

        {/* Sub-header row */}
        <div className="grid text-[10px] font-semibold text-slate-500 uppercase tracking-widest
          border-b border-slate-200 bg-slate-50"
          style={{ gridTemplateColumns: '160px 90px 1fr' }}>
          <div className="px-3 py-2 border-r border-slate-200">COUNTA of SN</div>
          <div className="px-3 py-2 border-r border-slate-200" />
          <div className="px-3 py-2" style={{ color: col.bg }}>WH SO (SESUAI SCMT)</div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw size={28} className="animate-spin text-slate-300 mx-auto mb-3"/>
            <p className="text-slate-400 text-sm">Menghitung stok dari Supabase...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center">
            <Database size={32} className="text-slate-200 mx-auto mb-3"/>
            <p className="text-slate-400 text-sm">
              Belum ada data untuk <strong>{selOp} {cfg.area}</strong>
            </p>
            <p className="text-xs text-slate-300 mt-1">Pastikan G-Sheet sudah di-sync via Apps Script</p>
            <a href="/gsheet" className="text-[#2E6DA4] text-xs underline mt-2 inline-block">
              Setup G-Sheet Sync →
            </a>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="lap-table sticky-header"
              style={{ minWidth: `${240 + 200 + whs.length * 80 + 80}px` }}>
              <thead>
                <tr>
                  <th className="text-left w-40" style={{ background: '#0D2137' }}>JENIS 2</th>
                  <th className="w-24" style={{ background: '#0D2137' }}>STATUS</th>
                  <th className="text-left" style={{ background: '#0D2137', minWidth: '200px' }}>TYPE</th>
                  {whs.map(wh => (
                    <th key={wh} style={{ background: col.bg, fontSize: '9px', width: '72px' }}>
                      {shortWH(wh)}
                    </th>
                  ))}
                  <th style={{ background: '#C0392B', width: '80px' }}>Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let prevJenis = ''
                  let jenisRowSpanStart = 0
                  return rows.map((row, i) => {
                    const isNewJenis = row.jenis_nte !== prevJenis
                    prevJenis = row.jenis_nte
                    const whVals = whs.map(wh => (row[wh] as number) || 0)
                    const maxVal = Math.max(...whVals)

                    return (
                      <tr key={i}>
                        {/* JENIS 2 */}
                        <td className={`td-label text-[11px] pl-3
                          ${isNewJenis ? 'font-bold text-[#1E3A5F] bg-[#EBF2FA]' : 'text-transparent'}`}>
                          {isNewJenis ? row.jenis_nte : ''}
                        </td>

                        {/* STATUS */}
                        <td>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold
                            ${row.status_nte === 'NTE BARU' ? 'badge-baru' : 'badge-refurbish'}`}>
                            {row.status_nte === 'NTE BARU' ? 'NTE BARU' : 'REFURBISH'}
                          </span>
                        </td>

                        {/* TYPE */}
                        <td className="td-label text-[11px] font-mono pl-3 text-slate-700">
                          {row.type_nte.replace(/_/g,' ')}
                        </td>

                        {/* Per WH count */}
                        {whs.map(wh => {
                          const val = (row[wh] as number) || 0
                          return (
                            <td key={wh}
                              className={`text-xs ${val > 0 ? heat(val, maxVal) : 'text-slate-200'}`}>
                              {val > 0 ? val.toLocaleString('id') : ''}
                            </td>
                          )
                        })}

                        {/* Grand Total */}
                        <td className="text-xs font-bold text-[#C0392B] bg-[#FADBD8]/40">
                          {row.grand_total > 0 ? row.grand_total.toLocaleString('id') : ''}
                        </td>
                      </tr>
                    )
                  })
                })()}

                {/* Grand Total row */}
                <tr className="sticky bottom-0">
                  <td colSpan={3} className="td-label font-bold text-xs text-white py-2.5 pl-4"
                    style={{ background: '#1E3A5F' }}>
                    Grand Total
                  </td>
                  {whs.map(wh => {
                    const t = rows.reduce((s, r) => s + ((r[wh] as number) || 0), 0)
                    return (
                      <td key={wh} className="text-xs font-bold text-white"
                        style={{ background: '#2E6DA4' }}>
                        {t > 0 ? t.toLocaleString('id') : ''}
                      </td>
                    )
                  })}
                  <td className="text-sm font-bold text-white" style={{ background: '#C0392B' }}>
                    {totalUnit.toLocaleString('id')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WH subtotal strip */}
      {!loading && rows.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {whs.map(wh => {
            const tot = rows.reduce((s, r) => s + ((r[wh] as number) || 0), 0)
            return (
              <div key={wh}
                className={`text-xs rounded-lg px-3 py-1.5 border font-medium
                  ${tot > 0 ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                {shortWH(wh)}: {tot > 0 ? tot.toLocaleString('id') : '–'}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LaporanHarianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat...</div>}>
      <LaporanContent />
    </Suspense>
  )
}
