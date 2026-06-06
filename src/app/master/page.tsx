'use client'
import { useState } from 'react'
import { AREA_CONFIG, ALL_OPERATORS, ALL_AREAS, OP_COLORS } from '@/lib/masterData'

export default function MasterPage() {
  const [tab, setTab] = useState<string>('warehouse')
  const totalWH = Object.values(AREA_CONFIG).reduce((s, v) => s + v.warehouses.length, 0)

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="page-title">Master Data</h1>
        <p className="page-subtitle">Referensi operator, area, dan daftar warehouse terdaftar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total WH',    value: totalWH,              sub: '6 kombinasi operator-area' },
          { label: 'Operator',   value: ALL_OPERATORS.length, sub: ALL_OPERATORS.join(', ') },
          { label: 'Area',       value: ALL_AREAS.length,     sub: ALL_AREAS.join(', ') },
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
          { key: 'warehouse', label: '🏭 Daftar Warehouse' },
          { key: 'info',      label: 'ℹ️ Info Sistem' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === key ? 'bg-white text-[#1A2332] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'warehouse' && (
        <div className="space-y-4">
          {ALL_OPERATORS.map(op => {
            const col    = OP_COLORS[op]
            const opKeys = Object.entries(AREA_CONFIG).filter(([, v]) => v.operator === op)
            const total  = opKeys.reduce((s, [, v]) => s + v.warehouses.length, 0)

            return (
              <div key={op} className="card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: col.bg }}>
                  <span className="text-white font-display font-bold text-sm">{op}</span>
                  <span className="text-white/60 text-xs">{total} WH total</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {opKeys.map(([ak, cfg]) => (
                    <div key={ak} className="p-5">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        📍 {cfg.area} — {cfg.warehouses.length} warehouse
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

      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">Tentang Dashboard</div>
            <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
              <p><strong className="text-slate-700">NTE Dashboard v2.0</strong></p>
              <p>Sistem pelaporan stok harian Network Terminal Environment untuk Telkom Indonesia.</p>
              <p>Data bersumber dari <strong>Google Sheets</strong> yang di-sync otomatis ke <strong>Supabase</strong> via Apps Script.</p>
              <p>Laporan harian dihitung dari jumlah unit fisik (COUNT per group) sehingga selalu akurat.</p>
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">Alur Data</div>
            <div className="space-y-2">
              {[
                ['G-Sheet', '1 baris = 1 unit NTE dengan SN unik'],
                ['Apps Script', 'onEdit trigger + daily sync jam 06:00'],
                ['Supabase', 'tabel master_stok_nte menyimpan semua unit'],
                ['Dashboard', 'COUNT(*) GROUP BY → pivot laporan harian'],
              ].map(([step, desc]) => (
                <div key={step} className="flex gap-3 items-start">
                  <span className="shrink-0 text-[10px] font-bold bg-[#1E3A5F] text-white px-2 py-0.5 rounded-md">
                    {step}
                  </span>
                  <span className="text-xs text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">Edit Warehouse</div>
            <p className="text-xs text-slate-500 mb-2">Edit file <code className="bg-slate-100 px-1 rounded">src/lib/masterData.ts</code> bagian AREA_CONFIG:</p>
            <pre className="bg-[#0d1117] text-[#a8d4ff] text-[10px] rounded-xl px-3 py-2 overflow-x-auto">{`"TELKOMSEL - BANDUNG": {
  warehouses: [
    "TA SO INV AHMAD YANI WH",
    "TA SO INV WH BARU",  // tambah di sini
  ]
}`}</pre>
          </div>
          <div className="card p-5">
            <div className="text-sm font-display font-semibold mb-3">Tech Stack</div>
            <div className="space-y-1.5">
              {[
                ['Frontend', 'Next.js 14 + TypeScript + Tailwind CSS'],
                ['Database', 'Supabase (PostgreSQL)'],
                ['Export',   'jsPDF + html2canvas'],
                ['Deploy',   'Vercel'],
                ['Sync',     'Google Apps Script'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs">
                  <span className="text-slate-400 w-16 shrink-0">{k}</span>
                  <span className="text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
