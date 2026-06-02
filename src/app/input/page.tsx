'use client'
import { useEffect, useState, useCallback } from 'react'
import { getAvailableDates, getStok, upsertStok, deleteStok, StokRow } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, NTE_CATALOG, NTE_STATUS, shortWH, OP_COLORS } from '@/lib/masterData'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Save, Trash2, ChevronDown, ChevronRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'

type CellKey = string  // `${typeNte}||${status}||${warehouse}`

export default function InputPage() {
  const today = new Date().toISOString().split('T')[0]
  const [selDate, setSelDate]     = useState(today)
  const [selOp, setSelOp]         = useState<typeof ALL_OPERATORS[number]>(ALL_OPERATORS[0])
  const [selKey, setSelKey]       = useState('')
  const [cells, setCells]         = useState<Record<CellKey, number>>({})
  const [saving, setSaving]       = useState(false)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())

  const opKeys = Object.entries(AREA_CONFIG).filter(([,v]) => v.operator === selOp).map(([k]) => k)

  useEffect(() => {
    if (opKeys.length > 0 && !opKeys.includes(selKey)) setSelKey(opKeys[0])
  }, [selOp])

  const cfg       = AREA_CONFIG[selKey]
  const warehouses = cfg?.warehouses || []
  const catalog   = NTE_CATALOG[selOp] || {}

  // Load existing data
  useEffect(() => {
    if (!selDate || !selKey) return
    getStok({ tanggal: selDate, operator: selOp, area_key: selKey }).then(rows => {
      const map: Record<CellKey, number> = {}
      for (const r of rows) {
        map[`${r.type_nte}||${r.status_nte}||${r.warehouse}`] = r.closing_stock
      }
      setCells(map)
    })
  }, [selDate, selKey, selOp])

  const getValue = (type: string, status: string, wh: string) =>
    cells[`${type}||${status}||${wh}`] || 0

  const setValue = (type: string, status: string, wh: string, val: number) => {
    setCells(prev => ({ ...prev, [`${type}||${status}||${wh}`]: val }))
  }

  const getRowTotal = (type: string, status: string) =>
    warehouses.reduce((s, wh) => s + getValue(type, status, wh), 0)

  const getColTotal = (wh: string) => {
    let sum = 0
    for (const [, types] of Object.entries(catalog))
      for (const type of types)
        for (const st of NTE_STATUS)
          sum += getValue(type, st, wh)
    return sum
  }

  const grandTotal = warehouses.reduce((s, wh) => s + getColTotal(wh), 0)

  const toggleExpand = (jenis: string) => {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(jenis) ? n.delete(jenis) : n.add(jenis)
      return n
    })
  }

  // Expand all on first load
  useEffect(() => {
    setExpanded(new Set(Object.keys(catalog)))
  }, [selOp])

  const handleSave = async () => {
    setSaving(true)
    const rows: StokRow[] = []
    for (const [jenis, types] of Object.entries(catalog)) {
      for (const type of types) {
        for (const status of NTE_STATUS) {
          for (const wh of warehouses) {
            const val = getValue(type, status, wh)
            if (val > 0) {
              rows.push({
                tanggal: selDate, operator: selOp,
                area: cfg.area, area_key: selKey,
                warehouse: wh, jenis_nte: jenis,
                type_nte: type, status_nte: status,
                closing_stock: val,
              })
            }
          }
        }
      }
    }
    const { count, error } = await upsertStok(rows)
    setSaving(false)
    if (error) { toast.error(`Error: ${error}`); return }
    toast.success(`✅ ${count} entri berhasil disimpan!`)
  }

  const handleClear = async () => {
    if (!confirm(`Hapus semua data ${selOp} ${cfg?.area} tanggal ${selDate}?`)) return
    for (const wh of warehouses) await deleteStok(selDate, selOp, wh)
    setCells({})
    toast.success('Data dihapus.')
  }

  const col = OP_COLORS[selOp]
  const shortWHs = warehouses.map(shortWH)

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Input Stok</h1>
          <p className="page-subtitle">Edit langsung di tabel · semua WH dalam satu layar</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClear} className="btn-secondary text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 size={14} /> Hapus
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Tanggal</label>
          <input type="date" className="input-base w-40" value={selDate} onChange={e => setSelDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Operator</label>
          <div className="flex gap-1">
            {ALL_OPERATORS.map(op => (
              <button key={op} onClick={() => setSelOp(op)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selOp === op ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                style={selOp === op ? { background: OP_COLORS[op].bg, borderColor: OP_COLORS[op].bg } : {}}
              >{op}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Area</label>
          <select className="input-base w-44" value={selKey} onChange={e => setSelKey(e.target.value)}>
            {opKeys.map(k => <option key={k} value={k}>{AREA_CONFIG[k].area}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Info size={12} />
          <span>Klik sel angka → ketik → Tab untuk pindah</span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: 'Grand Total', value: grandTotal.toLocaleString('id') + ' unit' },
          { label: 'Baris Terisi', value: Object.values(cells).filter(v => v > 0).length },
          { label: 'WH', value: `${warehouses.filter(wh => getColTotal(wh) > 0).length}/${warehouses.length}` },
          { label: 'Tanggal', value: format(new Date(selDate), 'dd MMM yyyy', { locale: id }) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E2EAF2] px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">{label}</span>
            <span className="text-sm font-semibold text-[#1A2332]">{value}</span>
          </div>
        ))}
      </div>

      {/* Spreadsheet table */}
      <div className="card overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-320px)]">
          <table className="data-table sticky-header" style={{ minWidth: `${180 + 120 + warehouses.length * 80 + 80}px` }}>
            <thead>
              {/* WH header */}
              <tr>
                <th className="text-left w-36" style={{ background: '#0D2137' }}>JENIS NTE</th>
                <th className="text-left w-64" style={{ background: '#0D2137' }}>TYPE</th>
                <th className="w-24" style={{ background: '#0D2137' }}>STATUS</th>
                {warehouses.map((wh, i) => (
                  <th key={wh} className="w-20" style={{ background: col.bg, fontSize: '10px' }}>
                    {shortWHs[i]}
                  </th>
                ))}
                <th className="w-20" style={{ background: '#C0392B' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(catalog).map(([jenis, types]) => {
                const isExp = expanded.has(jenis)
                const jenisTotal = types.reduce((s, t) =>
                  s + NTE_STATUS.reduce((ss, st) => ss + warehouses.reduce((sss, wh) => sss + getValue(t, st, wh), 0), 0), 0)

                return [
                  // Jenis header row
                  <tr key={`h-${jenis}`} onClick={() => toggleExpand(jenis)}
                    className="cursor-pointer bg-[#EBF2FA] hover:bg-[#D9E8F7] transition-colors">
                    <td colSpan={3} className="td-label py-2 px-3 text-xs font-bold text-navy flex items-center gap-1.5">
                      {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {jenis}
                    </td>
                    {warehouses.map(wh => (
                      <td key={wh} className="text-center text-xs text-slate-400">
                        {types.reduce((s, t) => s + NTE_STATUS.reduce((ss, st) => ss + getValue(t, st, wh), 0), 0) || ''}
                      </td>
                    ))}
                    <td className="text-center font-bold text-red-600 text-xs">{jenisTotal || ''}</td>
                  </tr>,

                  // Type rows (expanded)
                  ...(isExp ? types.flatMap(type =>
                    NTE_STATUS.map(status => {
                      const rowTotal = getRowTotal(type, status)
                      return (
                        <tr key={`${type}||${status}`} className="hover:bg-slate-50/60 transition-colors">
                          <td className="td-label text-[11px] text-slate-400 pl-6" />
                          <td className="td-label text-[11px] font-mono text-slate-600 max-w-[240px] truncate pl-3">
                            {type.replace(/_/g,' ')}
                          </td>
                          <td className="text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${status === 'NTE BARU' ? 'badge-baru' : 'badge-refurbish'}`}>
                              {status === 'NTE BARU' ? 'BARU' : 'RFBSH'}
                            </span>
                          </td>
                          {warehouses.map(wh => {
                            const val = getValue(type, status, wh)
                            const max = Math.max(...warehouses.map(w => getValue(type, status, w)))
                            const heatClass = val === 0 ? 'heat-0' : max > 0 ? (val/max > 0.8 ? 'heat-max' : val/max > 0.5 ? 'heat-high' : val/max > 0.2 ? 'heat-mid' : 'heat-low') : ''
                            return (
                              <td key={wh} className="p-0">
                                <input
                                  type="number" min={0}
                                  value={val || ''}
                                  placeholder="0"
                                  onChange={e => setValue(type, status, wh, parseInt(e.target.value) || 0)}
                                  className={`w-full text-center text-xs py-1.5 px-1 bg-transparent border-0 outline-none
                                    focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 rounded transition-all
                                    ${val > 0 ? heatClass : 'text-slate-300'}`}
                                />
                              </td>
                            )
                          })}
                          <td className={`text-center text-xs font-bold ${rowTotal > 0 ? 'text-red-600 bg-red-50/50' : 'text-slate-300'}`}>
                            {rowTotal || ''}
                          </td>
                        </tr>
                      )
                    })
                  ) : [])
                ]
              })}

              {/* Grand total row */}
              <tr className="sticky bottom-0 bg-navy text-white font-bold">
                <td colSpan={3} className="text-white font-bold text-xs py-2.5 pl-4">Grand Total</td>
                {warehouses.map(wh => (
                  <td key={wh} className="text-center text-xs text-white font-bold bg-[#2E6DA4]">
                    {getColTotal(wh) || ''}
                  </td>
                ))}
                <td className="text-center text-sm font-bold text-white bg-[#C0392B]">
                  {grandTotal.toLocaleString('id')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* WH subtotal strip */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {warehouses.map((wh, i) => {
          const tot = getColTotal(wh)
          return (
            <div key={wh} className={`text-xs rounded-lg px-3 py-1.5 border font-medium ${tot > 0 ? 'bg-white border-[#E2EAF2] text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
              {shortWHs[i]}: {tot > 0 ? tot.toLocaleString('id') : '–'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
