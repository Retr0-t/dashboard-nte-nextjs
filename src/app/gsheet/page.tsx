'use client'
import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/lib/supabase'
import { RefreshCw, Database, Clock, Copy, Check, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

function CodeBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group rounded-xl overflow-hidden mt-2">
      <pre className="bg-[#0d1117] text-[#a8d4ff] text-[11px] font-mono leading-relaxed px-4 py-3 overflow-x-auto whitespace-pre">
        {text}
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white/60 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition opacity-0 group-hover:opacity-100">
        {copied ? <Check size={10}/> : <Copy size={10}/>}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function GsheetPage() {
  const [stats,   setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const lastUpdated = stats?.lastUpdated
    ? formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: id })
    : null

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="page-title">G-Sheet Sync</h1>
          <p className="page-subtitle">Status koneksi Google Sheets → Supabase dan panduan setup Apps Script</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-xs">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="stat-value text-[#1E3A5F]">
              {loading ? '…' : stats?.totalUnits?.toLocaleString('id') || '0'}
            </div>
            <Database size={16} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Total Unit di Supabase</div>
          <div className="text-xs text-slate-400 mt-0.5 font-mono">master_stock_nte</div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="stat-value text-emerald-600">
              {loading ? '…' : stats?.owners?.length || '0'}
            </div>
            <CheckCircle2 size={16} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Owner Aktif</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats?.owners?.join(' · ') || '-'}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="stat-value text-sky-600 text-lg mt-1">
              {loading ? '…' : (lastUpdated || 'Belum ada')}
            </div>
            <Clock size={16} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Terakhir Update</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats?.totalUnits ? '✅ Data tersedia' : '⚠️ Belum ada data'}
          </div>
        </div>
      </div>

      {/* Alur data */}
      <div className="card p-5 mb-5">
        <div className="text-sm font-display font-semibold mb-4">Alur Data</div>
        <div className="flex items-stretch gap-0 flex-wrap">
          {[
            { label: 'G-Sheet',      sub: '1 baris = 1 unit NTE\nkolom: REG, WITEL, WH SO,\nSTATUS, JENIS, TYPE, SN, OWNER', color: '#1B5E20' },
            { label: '→',            sub: '', color: 'transparent' },
            { label: 'Apps Script',  sub: 'onEdit trigger\n+ full sync\njam 06:00 WIB', color: '#0D47A1' },
            { label: '→',            sub: '', color: 'transparent' },
            { label: 'Supabase',     sub: 'tabel\nmaster_stock_nte\noupsert by row_number', color: '#2E6DA4' },
            { label: '→',            sub: '', color: 'transparent' },
            { label: 'Dashboard',    sub: 'COUNT(*)\nGROUP BY\njenis_2 × type × status × wh_so', color: '#1E3A5F' },
          ].map((item, i) => (
            item.label === '→'
              ? <div key={i} className="flex items-center text-slate-300 text-xl px-1">→</div>
              : (
                <div key={i} className="rounded-xl px-4 py-3 text-white flex-1 min-w-[100px]"
                  style={{ background: item.color }}>
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className="text-white/60 text-[10px] mt-1 whitespace-pre-line leading-relaxed">
                    {item.sub}
                  </div>
                </div>
              )
          ))}
        </div>
      </div>

      {/* Mapping owner */}
      <div className="card p-5 mb-5">
        <div className="text-sm font-display font-semibold mb-3">Mapping Owner di Supabase</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { owner: 'INV',  op: 'TELKOMSEL', color: '#1B5E20', light: '#E8F5E9' },
            { owner: 'CCAN', op: 'TELKOM',    color: '#0D47A1', light: '#E3F2FD' },
            { owner: 'TIF',  op: 'TIF',       color: '#E65100', light: '#FFF3E0' },
          ].map(({ owner, op, color, light }) => (
            <div key={owner} className="rounded-xl p-4 border text-center"
              style={{ background: light, borderColor: color + '44' }}>
              <div className="text-[10px] text-slate-400 mb-1">field owner =</div>
              <div className="font-mono font-bold text-lg" style={{ color }}>"{owner}"</div>
              <div className="text-xs font-semibold mt-1" style={{ color }}>→ {op}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup guide */}
      <div className="card p-5">
        <div className="text-sm font-display font-semibold mb-5">Cara Setup Apps Script</div>
        <div className="space-y-6">

          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Buka Apps Script di G-Sheet</div>
              <p className="text-xs text-slate-400 mt-0.5">Extensions → Apps Script → paste file <code className="bg-slate-100 px-1 rounded">NTE_Sync_AppsScript.js</code></p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Isi konfigurasi CONFIG</div>
              <CodeBlock text={`SUPABASE_URL:   'https://xxxx.supabase.co',
SUPABASE_KEY:   'service_role_key',   // bukan anon key!
TABLE_NAME:     'master_stock_nte',
SHEET_NAME:     'Sheet1',
NEXTJS_API_URL: 'https://your-app.vercel.app'`} />
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                ⚠️ Gunakan <strong>Service Role Key</strong> — ada di Supabase → Settings → API → service_role
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Pastikan header G-Sheet sesuai</div>
              <p className="text-xs text-slate-400 mt-0.5 mb-2">Kolom wajib di baris 1 G-Sheet:</p>
              <div className="flex flex-wrap gap-1.5">
                {['REG','WITEL','WH CODE','WH SO (SESUAI SCMT)','STATUS','JENIS','JENIS 2','MERK','TYPE','SN','STATUS SCMT','TANGGAL UPDATE','OWNER (INV/ CCAN)'].map(col => (
                  <span key={col} className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Tambah env vars di Vercel</div>
              <CodeBlock text={`SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
GSHEET_SYNC_SECRET       = nte-sync-secret-2025`} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">5</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Jalankan setupTriggers() — sekali saja</div>
              <p className="text-xs text-slate-400 mt-0.5">Apps Script → pilih fungsi <strong>setupTriggers</strong> → Run → authorize → selesai!</p>
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                ✅ Setelah setup: setiap edit di G-Sheet otomatis push ke <code>master_stock_nte</code>.
                Full sync juga berjalan setiap hari jam 06:00 WIB.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
