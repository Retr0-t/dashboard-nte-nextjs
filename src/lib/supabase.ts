// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ==========================================================
   TYPES
========================================================== */

export interface MasterStockRow {
  sn:             string
  reg:            string | null
  witel:          string | null
  wh_code:        string | null
  wh_so:          string | null
  status:         string | null
  jenis:          string | null
  jenis_2:        string | null
  merk:           string | null
  type:           string | null
  status_scmt:    string | null
  tanggal_update: string | null
  owner:          string | null
  updated_at:     string | null
}

export interface PivotRow {
  jenis_2:     string
  type:        string
  status:      string
  grand_total: number
  [wh_so: string]: string | number
}

/* ==========================================================
   GET LAPORAN HARIAN
   - Query ke master_stock_nte filter by owner
   - COUNT per (jenis_2, type, status, wh_so) → pivot
   - wh_so = daftar warehouse resmi dari masterData
========================================================== */

export async function getLaporanHarian(params: {
  owner:  string    // INV | CCAN | TIF
  wh_so:  string[]  // daftar wh_so resmi dari AREA_CONFIG
}): Promise<PivotRow[]> {
  const { owner, wh_so: warehouses } = params

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('wh_so, jenis_2, type, status')
    .eq('owner', owner)

  if (error) throw error
  if (!data?.length) return []

  // COUNT per group
  const countMap: Record<string, Record<string, number>> = {}

  for (const row of data) {
    const wh     = (row.wh_so   || '').trim()
    const jenis  = (row.jenis_2 || '').trim()
    const type   = (row.type    || '').trim()
    const status = (row.status  || '').trim()

    if (!wh || !jenis || !type || !status) continue

    const key = `${jenis}||${type}||${status}`
    if (!countMap[key]) countMap[key] = {}
    countMap[key][wh] = (countMap[key][wh] || 0) + 1
  }

  // Build pivot rows — kolom = warehouses resmi
  const rows: PivotRow[] = []

  for (const [key, whCounts] of Object.entries(countMap)) {
    const [jenis_2, type, status] = key.split('||')

    const row: PivotRow = { jenis_2, type, status, grand_total: 0 }
    let grand = 0

    for (const wh of warehouses) {
      const qty = whCounts[wh] || 0
      row[wh]   = qty
      grand    += qty
    }

    row.grand_total = grand
    if (grand > 0) rows.push(row)
  }

  // Sort: jenis_2 → type → NTE BARU dulu
  rows.sort((a, b) => {
    if (a.jenis_2 !== b.jenis_2) return a.jenis_2.localeCompare(b.jenis_2)
    if (a.type    !== b.type)    return a.type.localeCompare(b.type)
    if (a.status  === 'NTE BARU')  return -1
    if (b.status  === 'NTE BARU')  return  1
    return a.status.localeCompare(b.status)
  })

  return rows
}

/* ==========================================================
   DASHBOARD STATS
========================================================== */

export async function getDashboardStats() {
  const { count } = await supabase
    .from('master_stock_nte')
    .select('*', { count: 'exact', head: true })

  const { data: ownerData } = await supabase
    .from('master_stock_nte')
    .select('owner')
    .not('owner', 'is', null)

  const { data: latest } = await supabase
    .from('master_stock_nte')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const owners = Array.from(
    new Set((ownerData || []).map((r: any) => r.owner).filter(Boolean))
  )

  return {
    totalUnits:  count || 0,
    owners,
    lastUpdated: latest?.updated_at || null,
  }
}

/* ==========================================================
   GET WH COVERAGE
========================================================== */

export async function getWHCoverage(owner?: string) {
  let q = supabase
    .from('master_stock_nte')
    .select('owner, wh_so')
    .not('wh_so', 'is', null)

  if (owner) q = q.eq('owner', owner)

  const { data } = await q

  const seen = new Set<string>()

  return (data || [])
    .map((r: any) => ({
      owner: (r.owner || '').trim(),
      wh_so: (r.wh_so || '').trim(),
    }))
    .filter((r: any) => {
      const k = `${r.owner}|${r.wh_so}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
}

/* ==========================================================
   GET OWNER LIST
========================================================== */

export async function getOwners(): Promise<string[]> {
  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('owner')
  if (error) throw error
  return Array.from(
    new Set((data || []).map((r: any) => r.owner).filter(Boolean))
  )
}

/* ==========================================================
   GET WITEL LIST
========================================================== */

export async function getWitelList(): Promise<string[]> {
  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('witel')
  if (error) throw error
  return Array.from(
    new Set((data || []).map((r: any) => r.witel).filter(Boolean))
  )
}
