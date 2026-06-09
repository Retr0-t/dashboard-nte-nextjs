'use client'
import { useState } from 'react'
import { AREA_CONFIG, ALL_OPERATORS, OP_COLORS, OP_TO_OWNER } from '@/lib/masterData'

export default function MasterPage() {
  const [tab, setTab] = useState('warehouse')
  const totalWH = Object.values(AREA_CONFIG).reduce((s, v) => s + v.warehouses.length, 0)

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="page-title">Master Data</h1>
        <p className="page-subtitle">Referensi operator, owner, area, dan daftar warehouse</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total WH',  value: totalWH,              sub: '6 kombinasi owner-witel' },
          { label: 'Operator',  value: ALL_OPERATORS.length, sub: 'TELKOMSEL · TELKOM · TIF' },
          { label: 'Owner (DB)',value: 3,                    sub: 'INV · CCAN · TIF' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <div className="stat-value text-[#1E3A5F]">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'warehouse', label: '🏭 Warehouse' },
          { key: 'mapping',   label: '🔗 Owner Mapping' },
          { key: 'info',      label: 'ℹ️ Info' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === key
                ? 'bg-white text-[#1A2332] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Warehouse tab */}
      {tab === 'warehouse' && (
        <div className="space-y-4">
          {ALL_OPERATORS.map(op => {
            const col    = OP_COLORS[op]
            const owner  = OP_TO_OWNER[op]
            const opKeys = Object.entries(AREA_CONFIG).filter(([, v]) => v.operator === op)
            const total  = opKeys.reduce((s, [, v]) => s + v.warehouses.length, 0)
            return (
              <div key={op} className="card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: col.bg }}>
                  <span className="text-white font-display font-bold text-sm">{op}</span>
                  <span className="text-white/50 text-[10px] font-mono">owner="{owner}"</span>
                  <span className="text-white/60 text-xs ml-auto">{total} WH total</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {opKeys.map(([ak, cfg]) => (
                    <div key={ak} className="p-5">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        📍 {cfg.witel} — {cfg.warehouses.length} warehouse
                      </div>
                      <div className="space-y-1.5">
                        {cfg.warehouses.map((wh, i) => (
                          <div key={wh} className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-xs text-slate-600 font-medium">{wh}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Owner mapping tab */}
      {tab === 'mapping' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-4">
              Mapping field <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">owner</code> di Supabase
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {[
                { owner: 'INV',  op: 'TELKOMSEL', witel: 'BANDUNG / SOREANG', color: '#1B5E20', light: '#E8F5E9' },
                { owner: 'CCAN', op: 'TELKOM',    witel: 'BANDUNG / SOREANG', color: '#0D47A1', light: '#E3F2FD' },
                { owner: 'TIF',  op: 'TIF',       witel: 'BANDUNG / SOREANG', color: '#E65100', light: '#FFF3E0' },
              ].map(({ owner, op, witel, color, light }) => (
                <div key={owner} className="rounded-xl p-4 border text-center"
                  style={{ background: light, borderColor: color + '44' }}>
                  <div className="text-[10px] text-slate-400 mb-2">field <code>owner</code> di DB</div>
                  <div className="font-mono font-bold text-2xl mb-1" style={{ color }}>"{owner}"</div>
                  <div className="text-sm font-bold mb-1" style={{ color }}>→ {op}</div>
                  <div className="text-xs text-slate-400">{witel}</div>
                </div>
              ))}
            </div>

            <div className="text-sm font-semibold text-slate-600 mb-3">
              Mapping field <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">witel</code> di Supabase
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-xs font-mono space-y-1">
              <div className="text-slate-400">// Query laporan harian menggunakan ILIKE:</div>
              <div><span className="text-blue-600">witel</span> <span className="text-slate-400">ILIKE</span> <span className="text-emerald-600">'%BANDUNG%'</span> <span className="text-slate-400">→ area Bandung</span></div>
              <div><span className="text-blue-600">witel</span> <span className="text-slate-400">ILIKE</span> <span className="text-emerald-600">'%SOREANG%'</span> <span className="text-slate-400">→ area Soreang</span></div>
            </div>
          </div>

          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">
              Struktur tabel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">master_stock_nte</code>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1E3A5F] text-white">
                    {['Kolom','Tipe','Keterangan','Contoh nilai'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['sn',             'text',    'Serial Number — PRIMARY KEY unik',  'FTTH-001234'],
                    ['owner',          'text',    'INV / CCAN / TIF',                  'INV'],
                    ['witel',          'text',    'Nama WITEL',                        'BANDUNG'],
                    ['wh_so',          'text',    'Nama WH SO sesuai SCMT',            'TA SO INV AHMAD YANI WH'],
                    ['wh_code',        'text',    'Kode WH',                           'BDG-001'],
                    ['reg',            'text',    'Region',                            'REGIONAL 3'],
                    ['status',         'text',    'NTE BARU / REFURBISH',              'NTE BARU'],
                    ['jenis',          'text',    'Jenis NTE',                         'ONT'],
                    ['jenis_2',        'text',    'Jenis 2 (sub-kategori)',            'ONT DUAL BAND'],
                    ['merk',           'text',    'Merk perangkat',                    'FIBERHOME'],
                    ['type',           'text',    'Type lengkap',                      'ONT_FIBERHOME_HG6145D2'],
                    ['status_scmt',    'text',    'Status di SCMT',                    'AVAILABLE'],
                    ['tanggal_update', 'text',    'Tanggal update data',               '2025-05-19'],
                    ['updated_at',     'timestamptz','Waktu sync dari G-Sheet',        '2025-05-19T06:00:00Z'],
                  ].map(([col, type, desc, example], i) => (
                    <tr key={col} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 font-mono font-semibold text-[#1E3A5F]">{col}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{type}</td>
                      <td className="px-3 py-2 text-slate-600">{desc}</td>
                      <td className="px-3 py-2 font-mono text-slate-400 text-[10px]">{example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Info tab */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">NTE Dashboard v2.0</div>
            <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
              <p>Sistem pelaporan stok harian Network Terminal Environment untuk Telkom Indonesia.</p>
              <p>Data bersumber dari <strong>Google Sheets</strong> yang di-sync otomatis ke <strong>Supabase</strong> via Apps Script.</p>
              <p>Laporan dihitung dari COUNT unit fisik sehingga selalu akurat dan realtime.</p>
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">Tech Stack</div>
            <div className="space-y-2">
              {[
                ['Frontend',  'Next.js 14 + TypeScript + Tailwind CSS'],
                ['Database',  'Supabase (PostgreSQL) · master_stock_nte'],
                ['Sync',      'Google Apps Script (onEdit + daily 06:00)'],
                ['Export',    'jsPDF + html2canvas → PDF & JPG'],
                ['Deploy',    'Vercel'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 text-xs">
                  <span className="text-slate-400 w-20 shrink-0">{k}</span>
                  <span className="text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">Edit Warehouse</div>
            <p className="text-xs text-slate-500 mb-2">Edit <code className="bg-slate-100 px-1 rounded">src/lib/masterData.ts</code>:</p>
            <pre className="bg-[#0d1117] text-[#a8d4ff] text-[10px] rounded-xl px-3 py-2 overflow-x-auto">{`'INV|BANDUNG': {
  owner: 'INV',
  operator: 'TELKOMSEL',
  witel: 'BANDUNG',
  warehouses: [
    'TA SO INV AHMAD YANI WH',
    'TA SO INV WH BARU',  // ← tambah
  ]
}`}</pre>
          </div>
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">Cara Kerja Query</div>
            <pre className="bg-[#0d1117] text-[#a8d4ff] text-[10px] rounded-xl px-3 py-2 overflow-x-auto">{`-- Laporan Harian TELKOMSEL BANDUNG
SELECT wh_so, jenis_2, type, status,
       COUNT(*) AS stok
FROM master_stock_nte
WHERE owner = 'INV'
GROUP BY wh_so, jenis_2, type, status
ORDER BY jenis_2, type, status`}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
