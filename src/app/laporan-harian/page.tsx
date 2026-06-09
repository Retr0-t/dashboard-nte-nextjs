'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLaporanHarian, getDashboardStats } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS, OP_TO_OWNER, shortWH } from '@/lib/masterData'
import { generatePDF, generateJPG } from '@/lib/exportReport'
import { FileDown, ImageDown, RefreshCw, Eye, EyeOff, Database, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface PivotRow {
  jenis_2: string; type: string; status: string; grand_total: number
  [wh: string]: string | number
}

function LaporanContent() {
  const params     = useSearchParams()
  const initOp     = params.get('op')    || ALL_OPERATORS[0]
  const initWitel  = params.get('witel') || 'BANDUNG'

  const [selOp,    setSelOp]    = useState<string>(initOp)
  const [selWitel, setSelWitel] = useState<string>(initWitel)
  const [rows,     setRows]     = useState<PivotRow[]>([])
  const [stats,    setStats]    = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [heatmap,  setHeatmap]  = useState(true)
  const [exporting, setExporting] = useState<'pdf'|'jpg'|null>(null)

  // area key = "OWNER|WITEL"
  const owner    = OP_TO_OWNER[selOp] || 'INV'
  const areaKey  = `${owner}|${selWitel}`
  const cfg      = AREA_CONFIG[areaKey]
  const whs      = cfg?.warehouses || []
  const col      = OP_COLORS[selOp] || OP_COLORS['TELKOMSEL']

  // Load stats once
  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {})
  }, [])

  // Load laporan
  const load = useCallback(async () => {
    if (!owner || !whs.length) return
    setLoading(true)
    setError(null)
    try {
      const data = await getLaporanHarian({ owner, wh_so: whs })
      setRows(data)
    } catch (e: any) {
      setError(e.message)
      toast.error('Gagal memuat data: ' + e.message)
      setRows([])
    } finally { setLoading(false) }
  }, [owner, areaKey])

  useEffect(() => { load() }, [load])

  const totalUnit   = rows.reduce((s, r) => s + r.grand_total, 0)
  const totalTypes  = Array.from(new Set(rows.map(r => r.type))).length
  const whsWithData = whs.filter(wh => rows.some(r => ((r[wh] as number) || 0) > 0))

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
        rows, warehouses: whs,
        operator: selOp, area: selWitel,
        tanggal: new Date().toISOString().split('T')[0],
      }
      if (fmt === 'pdf') await generatePDF(d)
      else               await generateJPG(d)
    } catch (e: any) { toast.error('Export gagal: ' + e.message) }
    finally { setExporting(null) }
  }

  const lastUpdated = stats?.lastUpdated
    ? formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: id })
    : null

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="page-title">Laporan Harian</h1>
          <p className="page-subtitle">
            Stok dihitung otomatis dari unit fisik di Supabase · 1 baris = 1 unit NTE
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setHeatmap(!heatmap)} className="btn-ghost text-xs">
            {heatmap ? <EyeOff size={13}/> : <Eye size={13}/>} Heatmap
          </button>
          <button onClick={load} disabled={loading} className="btn-secondary text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting !== null}
            className="btn-secondary text-xs">
            <FileDown size={13}/> {exporting==='pdf' ? 'PDF...' : 'PDF'}
          </button>
          <button onClick={() => handleExport('jpg')} disabled={exporting !== null}
            className="btn-primary text-xs" style={{ background: col.bg }}>
            <ImageDown size={13}/> {exporting==='jpg' ? 'JPG...' : 'JPG'}
          </button>
        </div>
      </div>

      {/* Supabase status */}
      {stats && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-700 font-semibold">
            {stats.totalUnits?.toLocaleString('id')} unit di Supabase
          </span>
          {lastUpdated && (
            <span className="text-emerald-600">· Update {lastUpdated}</span>
          )}
          <span className="ml-auto text-emerald-500 font-mono text-[10px]">
            master_stock_nte · owner={owner}
          </span>
        </div>
      )}

      {/* Filter */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        {/* Operator */}
        <div className="flex gap-1">
          {ALL_OPERATORS.map(op => (
            <button key={op} onClick={() => setSelOp(op)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                ${selOp === op
                  ? 'text-white border-transparent'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              style={selOp === op ? { background: OP_COLORS[op]?.bg } : {}}>
              {op}
            </button>
          ))}
        </div>

        {/* Area (Bandung / Soreang) */}
        <div className="flex gap-1">
          {['BANDUNG','SOREANG'].map(w => (
            <button key={w} onClick={() => setSelWitel(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                ${selWitel === w
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {w}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Database size={12}/>
          <span>owner: <code className="font-mono bg-slate-100 px-1 rounded">{owner}</code></span>
          <span className="text-slate-300">·</span>
          <span>{whs.length} WH terdaftar</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: 'Grand Total',  value: loading ? '…' : totalUnit.toLocaleString('id') + ' unit' },
          { label: 'Type NTE',     value: loading ? '…' : String(totalTypes) },
          { label: 'WH Ada Stok', value: loading ? '…' : `${whsWithData.length}/${whs.length}` },
          { label: 'Operator',    value: `${selOp} — ${selWitel}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">{label}</span>
            <span className="text-sm font-bold text-[#1A2332]">{value}</span>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5"/>
          <div>
            <div className="font-semibold">Gagal mengambil data dari Supabase</div>
            <div className="text-xs mt-0.5 font-mono">{error}</div>
            <div className="text-xs mt-1 text-red-500">
              Pastikan tabel <code>master_stock_nte</code> ada dan env vars sudah benar.
            </div>
          </div>
        </div>
      )}

      {/* Report table */}
      <div className="card overflow-hidden">
        {/* Title bar */}
        <div className="px-5 py-3.5 flex items-center justify-between"
          style={{ background: col.bg }}>
          <div className="text-white font-display font-bold text-sm tracking-wide uppercase">
            STOCK NTE {selOp} {selWitel}
          </div>
          <div className="text-white/60 text-xs">
            {new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
          </div>
        </div>

        {/* Sub-header */}
        <div className="flex text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-200">
          <div className="px-3 py-2 border-r border-slate-200 min-w-[160px]">COUNTA of SN</div>
          <div className="px-3 py-2 flex-1" style={{ color: col.bg }}>WH SO (SESUAI SCMT)</div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw size={28} className="animate-spin text-slate-300 mx-auto mb-3"/>
            <p className="text-slate-400 text-sm">Menghitung stok dari Supabase...</p>
            <p className="text-slate-300 text-xs mt-1">
              Query: master_stock_nte WHERE owner='{owner}'
            </p>
          </div>
        ) : rows.length === 0 && !error ? (
          <div className="p-16 text-center">
            <Database size={32} className="text-slate-200 mx-auto mb-3"/>
            <p className="text-slate-400 text-sm font-medium">
              Tidak ada data untuk <strong>{selOp} {selWitel}</strong>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              owner=<code>{owner}</code> · witel LIKE %{selWitel}%
            </p>
          </div>
        ) : !error && (
          <div className="overflow-auto">
            <table className="lap-table sticky-header"
              style={{ minWidth: `${260 + 200 + whs.length * 78 + 80}px` }}>
              <thead>
                <tr>
                  <th className="text-left w-44" style={{ background: '#0D2137' }}>JENIS 2</th>
                  <th className="w-28" style={{ background: '#0D2137' }}>STATUS</th>
                  <th className="text-left" style={{ background: '#0D2137', minWidth: '200px' }}>TYPE</th>
                  {whs.map(wh => (
                    <th key={wh} style={{ background: col.bg, fontSize: '9px', width: '75px' }}>
                      {shortWH(wh)}
                    </th>
                  ))}
                  <th style={{ background: '#C0392B', width: '80px' }}>Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let prevJenis = ''
                  return rows.map((row, i) => {
                    const isNew  = row.jenis_2 !== prevJenis
                    prevJenis    = row.jenis_2
                    const vals   = whs.map(wh => (row[wh] as number) || 0)
                    const maxVal = Math.max(...vals, 1)

                    return (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        {/* JENIS 2 */}
                        <td className={`td-label text-[11px] pl-3
                          ${isNew ? 'font-bold text-[#1E3A5F] bg-[#EBF2FA]' : 'text-slate-200'}`}>
                          {isNew ? row.jenis_2 : ''}
                        </td>

                        {/* STATUS */}
                        <td>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold
                            ${row.status === 'NTE BARU' ? 'badge-baru' : 'badge-refurbish'}`}>
                            {row.status}
                          </span>
                        </td>

                        {/* TYPE */}
                        <td className="td-label text-[11px] font-mono pl-3 text-slate-700">
                          {row.type}
                        </td>

                        {/* Per WH */}
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
                  <td colSpan={3} className="td-label font-bold text-xs text-white py-2.5 pl-4 bg-[#1E3A5F]">
                    Grand Total
                  </td>
                  {whs.map(wh => {
                    const t = rows.reduce((s, r) => s + ((r[wh] as number) || 0), 0)
                    return (
                      <td key={wh} className="text-xs font-bold text-white bg-[#2E6DA4]">
                        {t > 0 ? t.toLocaleString('id') : ''}
                      </td>
                    )
                  })}
                  <td className="text-sm font-bold text-white bg-[#C0392B]">
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
                    ? 'bg-white border-slate-200 text-slate-700'
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

export default function LaporanHarianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat...</div>}>
      <LaporanContent />
    </Suspense>
  )
}
