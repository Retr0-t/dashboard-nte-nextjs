'use client'
import { useEffect, useState } from 'react'
import { getLaporanHarian, getDashboardStats } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS } from '@/lib/masterData'
import { generatePDF, generateJPG } from '@/lib/exportReport'
import { FileDown, ImageDown, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function ExportPage() {
  const [stats,     setStats]     = useState<any>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => { getDashboardStats().then(setStats) }, [])

  const tanggal = new Date().toISOString().split('T')[0]

  const handleExport = async (ak: string, fmt: 'pdf' | 'jpg') => {
    const key = `${ak}-${fmt}`
    setExporting(key)
    try {
      const cfg  = AREA_CONFIG[ak]
      const rows = await getLaporanHarian({ operator: cfg.operator, warehouses: cfg.warehouses })
      if (!rows.length) { toast.error('Tidak ada data stok untuk ' + cfg.area); return }
      const d = { rows, warehouses: cfg.warehouses, operator: cfg.operator, area: cfg.area, tanggal }
      if (fmt === 'pdf') await generatePDF(d)
      else               await generateJPG(d)
      toast.success(`✅ ${cfg.operator} ${cfg.area} berhasil di-export!`)
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally { setExporting(null) }
  }

  const handleExportAll = async (fmt: 'pdf' | 'jpg') => {
    const keys = Object.keys(AREA_CONFIG)
    toast.loading(`Mengexport ${keys.length} laporan...`, { id: 'exp-all' })
    let done = 0
    for (const ak of keys) {
      await handleExport(ak, fmt)
      done++
      await new Promise(r => setTimeout(r, 600))
    }
    toast.success(`Selesai! ${done} laporan di-export.`, { id: 'exp-all' })
  }

  const lastSync = stats?.lastSyncedAt
    ? formatDistanceToNow(new Date(stats.lastSyncedAt), { addSuffix: true, locale: id })
    : null

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="page-title">Export PDF / JPG</h1>
        <p className="page-subtitle">Download laporan stok NTE per operator-area</p>
      </div>

      {/* Info bar */}
      {stats && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <span className="text-blue-700 font-medium">
            {stats.totalUnits?.toLocaleString('id')} unit NTE tersimpan
          </span>
          {lastSync && <span className="text-blue-500">· Sync {lastSync}</span>}
          <span className="ml-auto text-blue-400">Data diambil realtime dari Supabase saat export</span>
        </div>
      )}

      {/* Export all */}
      <div className="card p-5 mb-6">
        <div className="text-sm font-display font-semibold mb-1">Export Semua Sekaligus</div>
        <p className="text-xs text-slate-400 mb-4">
          Export semua {Object.keys(AREA_CONFIG).length} kombinasi operator-area sekaligus
        </p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => handleExportAll('pdf')} disabled={exporting !== null}
            className="btn-secondary">
            <FileDown size={14}/> Semua PDF
          </button>
          <button onClick={() => handleExportAll('jpg')} disabled={exporting !== null}
            className="btn-primary">
            <ImageDown size={14}/> Semua JPG
          </button>
        </div>
      </div>

      {/* Per operator */}
      {ALL_OPERATORS.map(op => {
        const col    = OP_COLORS[op]
        const opKeys = Object.keys(AREA_CONFIG).filter(k => AREA_CONFIG[k].operator === op)

        return (
          <div key={op} className="mb-5">
            <div className="inline-flex px-3 py-1.5 rounded-lg text-xs font-bold text-white mb-3"
              style={{ background: col.bg }}>
              {op}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opKeys.map(ak => {
                const cfg       = AREA_CONFIG[ak]
                const isPdfLoad = exporting === `${ak}-pdf`
                const isJpgLoad = exporting === `${ak}-jpg`
                const isBusy    = exporting !== null

                return (
                  <div key={ak} className="card card-hover p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-[#1A2332]">📍 {cfg.area}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{cfg.warehouses.length} warehouse</div>
                      </div>
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleExport(ak, 'pdf')} disabled={isBusy}
                        className="btn-secondary flex-1 text-xs py-2 justify-center">
                        <FileDown size={12}/> {isPdfLoad ? 'PDF...' : 'PDF'}
                      </button>
                      <button onClick={() => handleExport(ak, 'jpg')} disabled={isBusy}
                        className="btn-primary flex-1 text-xs py-2 justify-center"
                        style={{ background: col.bg }}>
                        <ImageDown size={12}/> {isJpgLoad ? 'JPG...' : 'JPG'}
                      </button>
                    </div>
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
