'use client'
import { useEffect, useState } from 'react'
import { getAvailableDates, getStok, buildPivot, getWHCoverage } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, NTE_CATALOG, NTE_STATUS, OP_COLORS } from '@/lib/masterData'
import { format } from 'date-fns'; import { id } from 'date-fns/locale'
import { FileDown, ImageDown, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { generatePDF, generateJPG, generateAllReports } from '@/lib/exportReport'
import toast from 'react-hot-toast'

export default function ExportPage() {
  const [dates, setDates]       = useState<string[]>([])
  const [selDate, setSelDate]   = useState('')
  const [coverage, setCoverage] = useState<any[]>([])
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    getAvailableDates().then(d => { setDates(d); if (d[0]) setSelDate(d[0]) })
  }, [])

  useEffect(() => {
    if (!selDate) return
    getWHCoverage(selDate).then(setCoverage)
  }, [selDate])

  const reportedKeys = new Set(coverage.map(r => r.area_key))

  const handleExport = async (ak: string, fmt: 'pdf' | 'jpg') => {
    const key = `${ak}-${fmt}`
    setExporting(key)
    try {
      const cfg     = AREA_CONFIG[ak]
      const raw     = await getStok({ tanggal: selDate, area_key: ak })
      const rows    = buildPivot(raw, cfg.warehouses)
      const catalog = NTE_CATALOG[cfg.operator] || {}
      const data    = { rows, warehouses: cfg.warehouses, operator: cfg.operator, area: cfg.area, tanggal: selDate }
      if (fmt === 'pdf') await generatePDF(data)
      else               await generateJPG(data)
      toast.success(`✅ ${cfg.operator} ${cfg.area} berhasil di-export!`)
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    } finally {
      setExporting(null)
    }
  }

  const handleExportAll = async (fmt: 'pdf' | 'jpg') => {
    const keys = Object.keys(AREA_CONFIG).filter(k => reportedKeys.has(k))
    toast.loading(`Mengexport ${keys.length} laporan...`, { id: 'export-all' })
    try {
      await generateAllReports(
        (ak, tgl) => getStok({ tanggal: tgl, area_key: ak }),
        AREA_CONFIG, selDate, fmt
      )
      toast.success(`Selesai! ${keys.length} laporan di-export.`, { id: 'export-all' })
    } catch(e: any) {
      toast.error(`Error: ${e.message}`, { id: 'export-all' })
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Export Laporan</h1>
          <p className="page-subtitle">Download laporan stok NTE dalam format PDF atau JPG</p>
        </div>
        <select className="input-base w-44" value={selDate} onChange={e => setSelDate(e.target.value)}>
          {dates.map(d => <option key={d} value={d}>{format(new Date(d), 'dd MMM yyyy', { locale: id })}</option>)}
        </select>
      </div>

      {/* Export all */}
      <div className="card p-5 mb-6">
        <div className="text-sm font-display font-semibold text-[#1A2332] mb-1">Export Semua Sekaligus</div>
        <p className="text-xs text-slate-400 mb-4">Download semua laporan yang ada datanya ({reportedKeys.size} dari {Object.keys(AREA_CONFIG).length} kombinasi)</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => handleExportAll('pdf')} disabled={exporting !== null} className="btn-secondary">
            <FileDown size={14} /> Download Semua PDF
          </button>
          <button onClick={() => handleExportAll('jpg')} disabled={exporting !== null} className="btn-primary">
            <ImageDown size={14} /> Download Semua JPG
          </button>
        </div>
      </div>

      {/* Per operator */}
      {ALL_OPERATORS.map(op => {
        const col = OP_COLORS[op]
        const opKeys = Object.keys(AREA_CONFIG).filter(k => AREA_CONFIG[k].operator === op)
        return (
          <div key={op} className="mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white mb-3"
              style={{ background: col.bg }}>
              {op}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opKeys.map(ak => {
                const cfg     = AREA_CONFIG[ak]
                const hasData = reportedKeys.has(ak)
                const isPdfLoading = exporting === `${ak}-pdf`
                const isJpgLoading = exporting === `${ak}-jpg`
                return (
                  <div key={ak} className={`card p-4 ${hasData ? 'card-hover' : 'opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-[#1A2332]">📍 {cfg.area}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{cfg.warehouses.length} warehouse</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasData
                          ? <CheckCircle2 size={14} className="text-emerald-500" />
                          : <AlertCircle size={14} className="text-amber-400" />
                        }
                        <span className={`text-[10px] font-medium ${hasData ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {hasData ? 'Ada data' : 'Kosong'}
                        </span>
                      </div>
                    </div>

                    {hasData ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExport(ak, 'pdf')}
                          disabled={exporting !== null}
                          className="btn-secondary flex-1 text-xs py-2 justify-center"
                        >
                          <FileDown size={12} />
                          {isPdfLoading ? 'PDF...' : 'PDF'}
                        </button>
                        <button
                          onClick={() => handleExport(ak, 'jpg')}
                          disabled={exporting !== null}
                          className="btn-primary flex-1 text-xs py-2 justify-center"
                          style={{ background: col.bg }}
                        >
                          <ImageDown size={12} />
                          {isJpgLoading ? 'JPG...' : 'JPG'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-300 text-center py-2">Tidak ada data stok</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
