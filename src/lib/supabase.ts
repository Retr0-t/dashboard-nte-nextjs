// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ──────────────────────────────────────────────────────────────────
export interface MasterStokRow {
  id:            number
  row_number:    number
  reg:           string
  witel:         string
  wh_code:       string
  warehouse:     string
  status_nte:    string
  jenis:         string
  jenis_nte:     string
  merk:          string
  type_nte:      string
  sn:            string
  status_scmt:   string
  tanggal_update:string
  operator:      string
  synced_at:     string
}

export interface PivotRow {
  jenis_nte:   string
  type_nte:    string
  status_nte:  string
  grand_total: number
  [warehouse: string]: string | number
}

// ── Normalize status ────────────────────────────────────────────────────────
function normalizeStatus(s: string): string {
  const t = (s || '').trim().toUpperCase()
  if (t.includes('BARU'))   return 'NTE BARU'
  if (t.includes('REFURB')) return 'REFURBISH'
  return t
}

// ── getLaporanHarian ────────────────────────────────────────────────────────
// Ambil semua unit dari master_stok_nte untuk 1 operator,
// lalu COUNT per (jenis_nte, type_nte, status_nte, warehouse) → pivot
export async function getLaporanHarian(params: {
  operator:   string
  warehouses: string[]
}): Promise<PivotRow[]> {
  const { operator, warehouses } = params

  const { data, error } = await supabase
    .from('master_stok_nte')
    .select('warehouse, jenis_nte, type_nte, status_nte')
    .eq('operator', operator)
    .not('type_nte',  'is', null)
    .not('warehouse', 'is', null)

  if (error) throw error
  if (!data?.length) return []

  // COUNT per group
  const countMap: Record<string, Record<string, number>> = {}

  for (const row of data) {
    const wh     = (row.warehouse  || '').trim()
    const type   = (row.type_nte   || '').trim()
    const status = normalizeStatus(row.status_nte || '')
    const jenis  = (row.jenis_nte  || 'Lainnya').trim()

    if (!wh || !type || !['NTE BARU', 'REFURBISH'].includes(status)) continue

    const key = `${jenis}||${type}||${status}`
    if (!countMap[key]) countMap[key] = {}
    countMap[key][wh] = (countMap[key][wh] || 0) + 1
  }

  // Build pivot
  const rows: PivotRow[] = []
  for (const [key, whCounts] of Object.entries(countMap)) {
    const [jenis_nte, type_nte, status_nte] = key.split('||')
    const row: PivotRow = { jenis_nte, type_nte, status_nte, grand_total: 0 }
    let grand = 0
    for (const wh of warehouses) {
      const v = whCounts[wh] || 0
      row[wh] = v
      grand  += v
    }
    row.grand_total = grand
    if (grand > 0) rows.push(row)
  }

  // Sort: jenis → type → NTE BARU dulu
  rows.sort((a, b) => {
    if (a.jenis_nte  !== b.jenis_nte)  return a.jenis_nte.localeCompare(b.jenis_nte)
    if (a.type_nte   !== b.type_nte)   return a.type_nte.localeCompare(b.type_nte)
    if (a.status_nte === 'NTE BARU')   return -1
    if (b.status_nte === 'NTE BARU')   return  1
    return 0
  })

  return rows
}

// ── getDashboardStats ───────────────────────────────────────────────────────
export async function getDashboardStats() {
  const { count: total } = await supabase
    .from('master_stok_nte')
    .select('*', { count: 'exact', head: true })

  const { data: opData } = await supabase
    .from('master_stok_nte')
    .select('operator')
    .not('operator', 'is', null)

  const { data: latest } = await supabase
    .from('master_stok_nte')
    .select('synced_at, tanggal_update')
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  const operators = Array.from(new Set((opData || []).map((r: any) => r.operator).filter(Boolean)))

  return {
    totalUnits:    total || 0,
    operators,
    lastSyncedAt:  latest?.synced_at     || null,
    lastUpdatedAt: latest?.tanggal_update || null,
  }
}

// ── getWHCoverage ───────────────────────────────────────────────────────────
export async function getWHCoverage(operator?: string) {
  let q = supabase
    .from('master_stok_nte')
    .select('operator, warehouse')
    .not('warehouse', 'is', null)

  if (operator) q = q.eq('operator', operator)

  const { data } = await q
  const seen = new Set<string>()
  return (data || []).filter((r: any) => {
    const k = `${r.operator}|${r.warehouse}`
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}
