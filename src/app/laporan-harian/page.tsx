'use client'
import { useEffect, useState, useCallback } from 'react'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS, shortWH } from '@/lib/masterData'
import { getLaporanHarian, getGsheetStats } from '@/lib/supabaseGsheet'
import { FileDown, ImageDown, Eye, EyeOff, RefreshCw, Clock, Database } from 'lucide-react'
import { generatePDF, generateJPG } from '@/lib/exportReport'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

type PivotRow = {
  jenis_nte: string
  type_nte: string
  status_nte: string
  grand_total: number
  [wh: string]: string | number
}

export default function LaporanHarianPage() {
  const [selOp,  setSelOp]  = useState<string>(ALL_OPERATORS[0])
  const [selKey, setSelKey] = useState<string>('')
  const [rows,   setRows]   = useState<PivotRow[]>([])
  const [stats,  setStats]  = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [heatmap, setHeatmap] = useState(true)
  const [showZeros, setShowZeros] = useState(false)
  const [exporting, setExporting] = useState<'pdf'|'jpg'|null>(null)

  const opKeys = Object.entries(AREA_CONFIG)
    .filter(([, v]) => v.operator === selOp)
    .map(([k]) => k)

  // Set default area_key when operator changes
  useEffect(() => {
    if (opKeys[0] && !opKeys.includes(selKey)) setSelKey(opKeys[0])
  }, [selOp])

  const cfg  = AREA_CONFIG[selKey] || { warehouses: [], area: '' }
  const whs  = cfg.warehouses
  const col  = OP_COLORS[selOp] || OP_COLORS['TELKOMSEL']

  // Load stats once
  useEffect(() => {
    getGsheetStats().then(setStats).catch(() => {})
  }, [])

  // Load laporan saat operator/area berubah
  const loadLaporan = useCallback(async () => {
    if (!selOp || !selKey || !whs.length) return
    setLoading(true)
    try {
      const data = await getLaporanHarian({ operator: selOp, warehouses: whs })
      setRows(data)
    } catch (e: any) {
      toast.error('Gagal memuat data: ' + e.message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [selOp, selKey])

  useEffect(() => { loadLaporan() }, [loadLaporan])

  // Filter tampilan
  const filtered = showZeros ? rows : rows.filter(r => r.grand_total > 0)

  const totalUnit   = rows.reduce((s, r) => s + r.grand_total, 0)
  const totalTypes  = new Set(rows.map(r => r.type_nte)).size
  const whsWithData = whs.filter(wh => rows.some(r => ((r[wh] as number) || 0) > 0))

  // Heatmap color
  const heatClass = (val: number, maxVal: number): string => {
    if (!heatmap || val === 0) return ''
    const r = maxVal > 0 ? val / maxVal : 0
    if (r > 0.8) return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (r > 0.5) return 'bg-green-50 text-green-700 font-medium'
    if (r > 0.2) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-600'
  }

  // Export
  const handleExport = async (fmt: 'pdf' | 'jpg') => {
    if (!filtered.length) { toast.error('Tidak ada data untuk di-export'); return }
    setExporting(fmt)
    try {
      const data = {
        rows: filtered, warehouses: whs,
        operator: selOp, area: cfg.area,
        tanggal: new Date().toISOString().split('T')[0],
      }
      if (fmt === 'pdf') await generatePDF(data)
      else               await generateJPG(data)
    } catch (e: any) {
      toast.error('Export gagal: ' + e.message)
    } finally {
      setExporting(null)
    }
  }

  const lastSync = stats?.lastSyncedAt
    ? formatDistanceToNow(new Date(stats.lastSyncedAt), { addSuffix: true, locale: id })
    : null

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Laporan Harian</h1>
          <p className="page-subtitle">Data realtime dari G-Sheet — dihitung otomatis dari unit fisik per WH</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setHeatmap(!heatmap)} className="btn-ghost text-xs">
            {heatmap ? <EyeOff size={13}/> : <Eye size={13}/>}
            Heatmap
          </button>
          <button onClick={loadLaporan} disabled={loading} className="btn-secondary text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
            Refresh
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting !== null || loading} className="btn-secondary text-xs">
            <FileDown size={13}/> {exporting === 'pdf' ? 'PDF...' : 'PDF'}
          </button>
          <button onClick={() => handleExport('jpg')} disabled={exporting !== null || loading}
            className="btn-primary text-xs" style={{ background: col.bg }}>
            <ImageDown size={13}/> {exporting === 'jpg' ? 'JPG...' : 'JPG'}
          </button>
        </div>
      </div>

      {/* G-Sheet status bar */}
      {stats && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
          <Database size={13} className="text-emerald-600 shrink-0"/>
          <span className="text-emerald-700 font-medium">
            G-Sheet tersambung — {stats.totalRows?.toLocaleString('id')} unit NTE di database
          </span>
          {lastSync && (
            <span className="text-emerald-600 flex items-center gap-1">
              <Clock size={11}/> Sync {lastSync}
            </span>
          )}
          <a href="/gsheet" className="ml-auto text-emerald-600 hover:underline">Kelola sync →</a>
        </div>
      )}

      {/* Filter bar */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        {/* Operator buttons */}
        <div className="flex gap-1">
          {ALL_OPERATORS.map(op => (
            <button key={op} onClick={() => setSelOp(op)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
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

        <label className="flex items-center gap-2 text-xs text-slate-500 ml-auto cursor-pointer select-none">
          <input type="checkbox" checked={showZeros} onChange={e => setShowZeros(e.target.checked)} className="rounded"/>
          Tampilkan baris nol
        </label>
      </div>

      {/* KPI strip */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: 'Total Unit',  value: loading ? '…' : totalUnit.toLocaleString('id') },
          { label: 'Type NTE',   value: loading ? '…' : String(totalTypes) },
          { label: 'WH Ada Data',value: loading ? '…' : `${whsWithData.length}/${whs.length}` },
          { label: 'Sumber Data',value: 'G-Sheet Live' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E2EAF2] px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">{label}</span>
            <span className={`text-sm font-bold text-[#1A2332] ${label==='Sumber Data'?'text-emerald-600':''}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Report table */}
      <div className="card overflow-hidden" id="laporan-table">
        {/* Title bar — mirip G-Sheet */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-[#E2EAF2]"
          style={{ background: col.bg }}>
          <div className="text-white font-display font-bold text-sm tracking-wide">
            STOCK NTE {selOp} — {cfg.area}
          </div>
          <div className="text-white/60 text-xs">
            {new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
            {' · '}realtime dari G-Sheet
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw size={24} className="animate-spin text-slate-300 mx-auto mb-3"/>
            <p className="text-slate-400 text-sm">Menghitung stok dari G-Sheet master...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <Database size={32} className="text-slate-200 mx-auto mb-3"/>
            <p>Belum ada data untuk <strong>{selOp} {cfg.area}</strong>.</p>
            <p className="text-xs mt-1">Pastikan G-Sheet sudah di-sync ke Supabase.</p>
            <a href="/gsheet" className="text-navy underline text-xs mt-2 inline-block">Setup G-Sheet Sync →</a>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="data-table sticky-header"
              style={{ minWidth: `${240 + 200 + whs.length * 78 + 80}px` }}>
              <thead>
                {/* Row 1: sub header */}
                <tr>
                  <th rowSpan={2} className="text-left w-36" style={{ background: '#0D2137' }}>JENIS 2</th>
                  <th rowSpan={2} className="text-center w-24" style={{ background: '#0D2137' }}>STATUS</th>
                  <th rowSpan={2} className="text-left w-56" style={{ background: '#0D2137' }}>TYPE</th>
                  <th colSpan={whs.length} className="text-center text-[10px]" style={{ background: col.bg }}>
                    WH SO (SESUAI SCMT)
                  </th>
                  <th rowSpan={2} style={{ background: '#C0392B' }}>Grand Total</th>
                </tr>
                {/* Row 2: WH names */}
                <tr>
                  {whs.map(wh => (
                    <th key={wh} style={{ background: col.bg, fontSize: '9px', fontWeight: 600 }}>
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
                    const whVals = whs.map(wh => (row[wh] as number) || 0)
                    const maxVal = Math.max(...whVals)

                    return (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        {/* JENIS 2 */}
                        <td className={`td-label text-[11px] ${isNewJenis
                          ? 'font-bold text-navy bg-[#EBF2FA]'
                          : 'text-slate-200'}`}>
                          {isNewJenis ? row.jenis_nte : ''}
                        </td>

                        {/* STATUS badge */}
                        <td className="text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold
                            ${row.status_nte === 'NTE BARU' ? 'badge-baru' : 'badge-refurbish'}`}>
                            {row.status_nte === 'NTE BARU' ? 'BARU' : 'RFBSH'}
                          </span>
                        </td>

                        {/* TYPE */}
                        <td className="td-label text-[11px] font-mono pl-3">
                          {row.type_nte.replace(/_/g, ' ')}
                        </td>

                        {/* Per WH count */}
                        {whs.map(wh => {
                          const val = (row[wh] as number) || 0
                          return (
                            <td key={wh}
                              className={`text-center text-xs transition-colors
                                ${val > 0 ? heatClass(val, maxVal) : 'text-slate-200'}`}>
                              {val > 0 ? val.toLocaleString('id') : ''}
                            </td>
                          )
                        })}

                        {/* Grand Total */}
                        <td className="text-center text-xs font-bold text-red-600 bg-red-50/40">
                          {row.grand_total > 0 ? row.grand_total.toLocaleString('id') : ''}
                        </td>
                      </tr>
                    )
                  })
                })()}

                {/* Grand Total Row */}
                <tr className="sticky bottom-0 bg-navy">
                  <td colSpan={3} className="text-white font-bold text-xs py-2.5 pl-4">
                    Grand Total
                  </td>
                  {whs.map(wh => {
                    const t = rows.reduce((s, r) => s + ((r[wh] as number) || 0), 0)
                    return (
                      <td key={wh} className="text-center text-xs font-bold text-white/90 bg-[#2E6DA4]">
                        {t > 0 ? t.toLocaleString('id') : ''}
                      </td>
                    )
                  })}
                  <td className="text-center font-bold text-white bg-[#C0392B]">
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
                  ${tot > 0
                    ? 'bg-white border-[#E2EAF2] text-slate-700'
                    : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                {shortWH(wh)}: {tot > 0 ? tot.toLocaleString('id') : '–'}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
