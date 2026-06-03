'use client'
import { useState } from 'react'
import { AREA_CONFIG, ALL_OPERATORS, ALL_AREAS, NTE_CATALOG, NTE_STATUS, OP_COLORS } from '@/lib/masterData'
import { Database, Bot, Package, Building2, Copy, Check } from 'lucide-react'

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="bg-[#0d1117] px-4 py-3 font-mono text-xs text-[#a8d4ff] leading-relaxed whitespace-pre overflow-x-auto">
        {code}
      </div>
      <button onClick={copy} className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white/60 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition">
        {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function MasterPage() {
  const [tab, setTab] = useState<string>('warehouse')

  const tabs = [
    { key: 'warehouse', label: '🏭 Warehouse', icon: Building2 },
    { key: 'nte',       label: '📦 Katalog NTE', icon: Package },
    { key: 'bot',       label: '🤖 WA Bot', icon: Bot },
  ]

  const totalWH  = Object.values(AREA_CONFIG).reduce((s, v) => s + v.warehouses.length, 0)
  const totalNTE = [...new Set(Object.values(NTE_CATALOG).flatMap(cat => Object.values(cat).flat()))].length

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Master Data & Info</h1>
        <p className="page-subtitle">Referensi operator, warehouse, katalog NTE, dan panduan WhatsApp bot</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total WH', value: totalWH, sub: '6 kombinasi' },
          { label: 'Operator', value: ALL_OPERATORS.length, sub: 'Telkomsel, Telkom, TIF' },
          { label: 'Type NTE', value: totalNTE, sub: 'gabungan semua operator' },
          { label: 'Status', value: NTE_STATUS.length, sub: NTE_STATUS.join(', ') },
        ].map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === key ? 'bg-white text-[#1A2332] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Warehouse tab */}
      {tab === 'warehouse' && (
        <div className="space-y-4">
          {ALL_OPERATORS.map(op => {
            const col = OP_COLORS[op]
            const opKeys = Object.entries(AREA_CONFIG).filter(([,v]) => v.operator === op)
            return (
              <div key={op} className="card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: col.bg }}>
                  <span className="text-white font-display font-bold text-sm">{op}</span>
                  <span className="text-white/60 text-xs">{opKeys.reduce((s,[,v])=>s+v.warehouses.length,0)} WH total</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-[#E2EAF2]">
                  {opKeys.map(([ak, cfg]) => (
                    <div key={ak} className="p-5">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📍 {cfg.area}</div>
                      <div className="space-y-1.5">
                        {cfg.warehouses.map((wh, i) => (
                          <div key={wh} className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">{i+1}</span>
                            <span className="text-slate-600 font-medium">{wh}</span>
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

      {/* NTE catalog tab */}
      {tab === 'nte' && (
        <div className="space-y-4">
          {ALL_OPERATORS.map(op => {
            const col  = OP_COLORS[op]
            const cat  = NTE_CATALOG[op] || {}
            const total = Object.values(cat).flat().length
            return (
              <div key={op} className="card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: col.bg }}>
                  <span className="text-white font-display font-bold text-sm">{op}</span>
                  <span className="text-white/60 text-xs">{Object.keys(cat).length} jenis · {total} type</span>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(cat).map(([jenis, types]) => (
                    <div key={jenis} className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs font-bold text-navy mb-2">{jenis}</div>
                      <div className="space-y-0.5">
                        {types.map(t => (
                          <div key={t} className="text-[10px] font-mono text-slate-500 bg-white rounded px-2 py-0.5 border border-slate-100">{t}</div>
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

      {/* Bot tab */}
      {tab === 'bot' && (
        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-[#1A2332] mb-4">Setup WhatsApp Bot</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">1. Clone & install</p>
                <CodeBlock code={`cd nte_whatsapp_bot\nnpm install\ncp .env.example .env`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">2. Isi konfigurasi .env</p>
                <CodeBlock code={`API_BASE_URL=http://localhost:8502\nALLOWED_NUMBERS=628xxx,628yyy\nREPORT_TARGET=628xxx@c.us\nCRON_SCHEDULE=0 7 * * *\nAUTO_REPORT_FORMAT=jpg`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">3. Jalankan</p>
                <CodeBlock code={`node bot.js\n# Scan QR yang muncul di terminal`} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-semibold text-[#1A2332] mb-4">Daftar Perintah Bot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { cmd: '/bantuan', desc: 'Tampilkan semua perintah' },
                { cmd: '/status', desc: 'Cek koneksi server' },
                { cmd: '/tanggal', desc: 'Daftar tanggal ada data' },
                { cmd: '/stok', desc: 'Ringkasan stok hari ini' },
                { cmd: '/stok telkomsel', desc: 'Ringkasan per operator' },
                { cmd: '/laporan', desc: 'Semua laporan hari ini (ZIP)' },
                { cmd: '/laporan telkomsel bandung', desc: '1 laporan PDF' },
                { cmd: '/laporan tsel bdg jpg', desc: '1 laporan JPG' },
                { cmd: '/laporan semua jpg', desc: 'Semua JPG satu per satu' },
                { cmd: '/laporan telkom 2025-05-19', desc: 'Tanggal tertentu' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                  <code className="text-[11px] font-mono bg-navy text-white px-2 py-1 rounded-md shrink-0">{cmd}</code>
                  <span className="text-xs text-slate-500 mt-0.5">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
