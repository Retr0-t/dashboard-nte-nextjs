'use client'
import { useState } from 'react'
import { upsertStok, StokRow } from '@/lib/supabase'
import { AREA_CONFIG, NTE_CATALOG, NTE_STATUS, OP_COLORS, ALL_OPERATORS } from '@/lib/masterData'
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface ParsedRow {
  row: number
  status: 'ok' | 'error'
  message?: string
  data?: StokRow
}

export default function UploadPage() {
  const [parsing, setParsing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [preview, setPreview]   = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')

  // ── Download template ────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const rows: any[] = [
      ['tanggal','operator','area','area_key','warehouse','jenis_nte','type_nte','status_nte','closing_stock'],
      ['2025-05-19','TELKOMSEL','BANDUNG','TELKOMSEL - BANDUNG','TA SO INV AHMAD YANI WH','ONT DUAL BAND','ONT_FIBERHOME_HG6145D2','NTE BARU',247],
      ['2025-05-19','TELKOM','BANDUNG','TELKOM - BANDUNG','TA SO CCAN AHMAD YANI WH','ONT SINGLE BAND','ONT_FIBERHOME_AN5506-04-FS','NTE BARU',10],
      ['2025-05-19','TIF','SOREANG','TIF - SOREANG','TA SO TIF KADIPATEN WH','ONT PREMIUM','ONT_FIBERHOME_HG6145F1','REFURBISH',5],
    ]
    const wb  = XLSX.utils.book_new()
    const ws  = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = rows[0].map(() => ({ wch: 28 }))
    XLSX.utils.book_append_sheet(wb, ws, 'Template Input Stok')

    // Sheet referensi
    const refRows: any[][] = [['operator','area','area_key','warehouse','jenis_nte','type_nte','status_nte']]
    for (const [ak, cfg] of Object.entries(AREA_CONFIG)) {
      const cat = NTE_CATALOG[cfg.operator] || {}
      for (const [jenis, types] of Object.entries(cat)) {
        for (const t of types) {
          for (const s of NTE_STATUS) {
            for (const wh of cfg.warehouses) {
              refRows.push([cfg.operator, cfg.area, ak, wh, jenis, t, s])
            }
          }
        }
      }
    }
    const wsRef = XLSX.utils.aoa_to_sheet(refRows)
    wsRef['!cols'] = refRows[0].map(() => ({ wch: 28 }))
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi')
    XLSX.writeFile(wb, 'template_input_stok_NTE.xlsx')
  }

  // ── Parse uploaded file ──────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParsing(true)
    setPreview([])

    try {
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(buf)
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const raw  = XLSX.utils.sheet_to_json<any>(ws, { defval: '' })

      const required = ['tanggal','operator','area','area_key','warehouse','jenis_nte','type_nte','status_nte','closing_stock']
      const cols = Object.keys(raw[0] || {}).map(c => c.toLowerCase().trim())
      const missing = required.filter(c => !cols.includes(c))
      if (missing.length) {
        toast.error(`Kolom tidak ditemukan: ${missing.join(', ')}`)
        setParsing(false)
        return
      }

      const parsed: ParsedRow[] = raw.map((r: any, i: number) => {
        const rowNum = i + 2
        const norm: any = {}
        for (const [k, v] of Object.entries(r)) norm[k.toLowerCase().trim()] = v

        const stock = parseInt(String(norm.closing_stock))
        if (isNaN(stock) || stock < 0)
          return { row: rowNum, status: 'error' as const, message: 'closing_stock harus angka ≥ 0' }
        if (!['TELKOMSEL','TELKOM','TIF'].includes(String(norm.operator).toUpperCase()))
          return { row: rowNum, status: 'error' as const, message: `Operator tidak valid: ${norm.operator}` }
        if (!['NTE BARU','REFURBISH'].includes(String(norm.status_nte).toUpperCase()))
          return { row: rowNum, status: 'error' as const, message: `Status tidak valid: ${norm.status_nte}` }

        return {
          row: rowNum,
          status: 'ok' as const,
          data: {
            tanggal:       String(norm.tanggal).trim(),
            operator:      String(norm.operator).toUpperCase().trim(),
            area:          String(norm.area).toUpperCase().trim(),
            area_key:      String(norm.area_key).trim(),
            warehouse:     String(norm.warehouse).trim(),
            jenis_nte:     String(norm.jenis_nte).trim(),
            type_nte:      String(norm.type_nte).trim(),
            status_nte:    String(norm.status_nte).toUpperCase().trim(),
            closing_stock: stock,
          },
        }
      })

      setPreview(parsed)
    } catch (err: any) {
      toast.error(`Gagal membaca file: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }

  // ── Save to Supabase ─────────────────────────────────────────────────────
  const handleSave = async () => {
    const validRows = preview.filter(p => p.status === 'ok' && p.data).map(p => p.data!)
    if (!validRows.length) { toast.error('Tidak ada baris valid.'); return }

    setSaving(true)
    const { count, error } = await upsertStok(validRows)
    setSaving(false)

    if (error) { toast.error(`Error: ${error}`); return }
    toast.success(`✅ ${count} baris berhasil disimpan!`)
    setPreview([])
    setFileName('')
  }

  const okCount  = preview.filter(p => p.status === 'ok').length
  const errCount = preview.filter(p => p.status === 'error').length

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Upload Excel</h1>
        <p className="page-subtitle">Import data stok dari file Excel — bisa banyak operator & warehouse sekaligus</p>
      </div>

      {/* Step 1: Download template */}
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-display font-semibold text-[#1A2332] mb-1">
              Langkah 1 — Download Template
            </div>
            <p className="text-xs text-slate-400">
              Template berisi contoh baris & sheet Referensi dengan semua kombinasi operator/WH/NTE yang valid.
            </p>
          </div>
          <button onClick={downloadTemplate} className="btn-secondary shrink-0">
            <Download size={14} /> Download Template Excel
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {['tanggal (YYYY-MM-DD)', 'operator (TELKOMSEL/TELKOM/TIF)', 'area, area_key, warehouse'].map(col => (
            <div key={col} className="bg-slate-50 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-500">{col}</div>
          ))}
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="card p-5 mb-5">
        <div className="text-sm font-display font-semibold text-[#1A2332] mb-4">
          Langkah 2 — Upload File Excel
        </div>
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-[#E2EAF2] rounded-xl p-10 text-center hover:border-navy-500 hover:bg-blue-50/30 transition-all">
            <FileSpreadsheet size={36} className="text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-medium text-slate-500">
              {fileName || 'Klik atau drag & drop file Excel di sini'}
            </div>
            <div className="text-xs text-slate-300 mt-1">Format: .xlsx · .xls</div>
          </div>
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        </label>

        {parsing && (
          <div className="mt-4 text-center text-sm text-slate-400 animate-pulse">Membaca file...</div>
        )}
      </div>

      {/* Step 3: Preview & save */}
      {preview.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <div className="text-sm font-display font-semibold text-[#1A2332]">
                Langkah 3 — Preview & Simpan
              </div>
              <div className="flex gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 size={12} /> {okCount} baris valid
                </span>
                {errCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <XCircle size={12} /> {errCount} baris error
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || okCount === 0} className="btn-primary">
              <Upload size={14} /> {saving ? 'Menyimpan...' : `Simpan ${okCount} Baris`}
            </button>
          </div>

          <div className="overflow-auto max-h-96">
            <table className="data-table">
              <thead>
                <tr>
                  {['Baris','Status','Tanggal','Operator','WH','Type NTE','Status NTE','Stok'].map(h => (
                    <th key={h} style={{ background: '#1E3A5F' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 100).map(p => (
                  <tr key={p.row} className={p.status === 'error' ? 'bg-red-50' : ''}>
                    <td className="text-xs text-slate-400">{p.row}</td>
                    <td>
                      {p.status === 'ok'
                        ? <CheckCircle2 size={12} className="text-emerald-500 mx-auto" />
                        : <XCircle size={12} className="text-red-500 mx-auto" />
                      }
                    </td>
                    {p.status === 'ok' && p.data ? <>
                      <td className="text-xs">{p.data.tanggal}</td>
                      <td className="text-xs font-semibold" style={{ color: OP_COLORS[p.data.operator]?.bg }}>
                        {p.data.operator}
                      </td>
                      <td className="td-label text-[10px]">{p.data.warehouse}</td>
                      <td className="text-[10px] font-mono td-label">{p.data.type_nte}</td>
                      <td>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${p.data.status_nte === 'NTE BARU' ? 'badge-baru' : 'badge-refurbish'}`}>
                          {p.data.status_nte === 'NTE BARU' ? 'BARU' : 'RFBSH'}
                        </span>
                      </td>
                      <td className="font-semibold text-xs">{p.data.closing_stock}</td>
                    </> : <>
                      <td colSpan={6} className="td-label text-xs text-red-500">{p.message}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 100 && (
              <div className="text-center text-xs text-slate-400 py-3">
                Menampilkan 100 dari {preview.length} baris
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
