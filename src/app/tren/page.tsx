'use client'
import { useEffect, useState } from 'react'
import { getStok, getTrend } from '@/lib/supabase'
import { getAvailableDates } from '@/lib/supabase'
import { AREA_CONFIG, ALL_OPERATORS, NTE_CATALOG, NTE_STATUS, OP_COLORS } from '@/lib/masterData'
import { format } from 'date-fns'; import { id } from 'date-fns/locale'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#1E3A5F','#2E6DA4','#C0392B','#1B5E20','#E65100','#7B1FA2','#00695C']

export default function TrenPage() {
  const [dates, setDates]         = useState<string[]>([])
  const [latest, setLatest]       = useState('')
  const [selType, setSelType]     = useState('')
  const [selStatus, setSelStatus] = useState(NTE_STATUS[0])
  const [selOp, setSelOp]         = useState('Semua')
  const [trendData, setTrendData] = useState<any[]>([])
  const [pieData, setPieData]     = useState<any[]>([])
  const [barData, setBarData]     = useState<any[]>([])
  const [top10, setTop10]         = useState<any[]>([])

  const allTypes = [...new Set(Object.values(NTE_CATALOG).flatMap(cat => Object.values(cat).flat()))]

  useEffect(() => {
    getAvailableDates().then(d => { setDates(d); if (d[0]) setLatest(d[0]) })
    if (allTypes[0]) setSelType(allTypes[0])
  }, [])

  useEffect(() => {
    if (!selType) return
    getTrend(selType, selStatus, selOp === 'Semua' ? undefined : selOp).then(data => {
      // Group by tanggal for line chart
      const byDate: Record<string, any> = {}
      for (const r of data) {
        if (!byDate[r.tanggal]) byDate[r.tanggal] = { tanggal: r.tanggal }
        byDate[r.tanggal][`${r.operator} ${r.area}`] = r.total
      }
      setTrendData(Object.values(byDate).sort((a,b) => a.tanggal.localeCompare(b.tanggal)))
    })
  }, [selType, selStatus, selOp])

  useEffect(() => {
    if (!latest) return
    getStok({ tanggal: latest }).then(rows => {
      // Pie by operator
      const opMap: Record<string, number> = {}
      for (const r of rows) { opMap[r.operator] = (opMap[r.operator] || 0) + r.closing_stock }
      setPieData(Object.entries(opMap).map(([name, value]) => ({ name, value })))

      // Bar by operator+area
      const areaMap: Record<string, number> = {}
      for (const r of rows) {
        const k = `${r.operator} ${r.area}`
        areaMap[k] = (areaMap[k] || 0) + r.closing_stock
      }
      setBarData(Object.entries(areaMap).map(([name, value]) => ({ name, value })))

      // Top 10 types
      const typeMap: Record<string, number> = {}
      for (const r of rows) { typeMap[r.type_nte] = (typeMap[r.type_nte] || 0) + r.closing_stock }
      setTop10(
        Object.entries(typeMap)
          .sort((a,b) => b[1]-a[1])
          .slice(0,10)
          .map(([name, value]) => ({ name: name.replace(/_/g,' ').slice(0,24), value }))
      )
    })
  }, [latest])

  const trendLines = [...new Set(trendData.flatMap(d => Object.keys(d).filter(k => k !== 'tanggal')))]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Tren Stok</h1>
        <p className="page-subtitle">Visualisasi pergerakan stok harian per type NTE</p>
      </div>

      {/* Trend chart */}
      <div className="card p-5 mb-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select className="input-base w-64" value={selType} onChange={e => setSelType(e.target.value)}>
            {allTypes.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
          <select className="input-base w-36" value={selStatus} onChange={e => setSelStatus(e.target.value as any)}>
            {NTE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-base w-36" value={selOp} onChange={e => setSelOp(e.target.value)}>
            <option value="Semua">Semua Operator</option>
            {ALL_OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
        </div>
        <div className="text-sm font-display font-semibold text-[#1A2332] mb-3">
          Tren: {selType.replace(/_/g,' ')} — {selStatus}
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} tickFormatter={d => format(new Date(d), 'dd/MM')} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={d => format(new Date(d), 'dd MMM yyyy', { locale: id })} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {trendLines.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-300 text-sm">Belum ada data historis</div>
        )}
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie */}
        <div className="card p-5">
          <div className="text-sm font-display font-semibold mb-4">Distribusi per Operator</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={Object.values(OP_COLORS)[i]?.bg || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => v.toLocaleString('id')} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar operator+area */}
        <div className="card p-5">
          <div className="text-sm font-display font-semibold mb-4">Per Operator & Area</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={90} />
              <Tooltip formatter={(v: any) => v.toLocaleString('id')} />
              <Bar dataKey="value" radius={[0,4,4,0]}>
                {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 */}
        <div className="card p-5">
          <div className="text-sm font-display font-semibold mb-4">Top 10 Type NTE</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
              <Tooltip formatter={(v: any) => v.toLocaleString('id')} />
              <Bar dataKey="value" fill="#2E6DA4" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
