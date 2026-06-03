// lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
}

if (!supabaseAnon) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnon
)

/* ==========================================================
   TYPES
========================================================== */

export interface MasterStockNTE {
  id?: number

  reg: string
  witel: string

  wh_code: string
  wh_so: string

  status: string

  jenis: string
  jenis_2: string

  merk: string
  type: string

  sn: string

  status_scmt: string

  tanggal_update?: string

  owner?: string

  created_at?: string
  updated_at?: string
}

export interface PivotRow {
  jenis: string
  jenis_2: string
  status: string
  type: string

  [warehouse: string]: string | number

  grand_total: number
}

/* ==========================================================
   MASTER DATA
========================================================== */

export async function getMasterStockNTE(
  filters?: {
    reg?: string
    witel?: string
    wh_so?: string
    owner?: string
    status?: string
    jenis?: string
    jenis_2?: string
  }
): Promise<MasterStockNTE[]> {

  let query = supabase
    .from('master_stock_nte')
    .select('*')

  if (filters?.reg) {
    query = query.eq('reg', filters.reg)
  }

  if (filters?.witel) {
    query = query.eq('witel', filters.witel)
  }

  if (filters?.wh_so) {
    query = query.eq('wh_so', filters.wh_so)
  }

  if (filters?.owner) {
    query = query.eq('owner', filters.owner)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.jenis) {
    query = query.eq('jenis', filters.jenis)
  }

  if (filters?.jenis_2) {
    query = query.eq('jenis_2', filters.jenis_2)
  }

  const { data, error } = await query

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

/* ==========================================================
   WAREHOUSE LIST
========================================================== */

export async function getWarehouses(): Promise<string[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('wh_so')

  if (error) {
    console.error(error)
    return []
  }

  return [
    ...new Set(
      (data || [])
        .map(r => r.wh_so)
        .filter(Boolean)
    )
  ].sort()
}

/* ==========================================================
   WITEL LIST
========================================================== */

export async function getWitels(): Promise<string[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('witel')

  if (error) {
    console.error(error)
    return []
  }

  return [
    ...new Set(
      (data || [])
        .map(r => r.witel)
        .filter(Boolean)
    )
  ].sort()
}

/* ==========================================================
   JENIS LIST
========================================================== */

export async function getJenisList(): Promise<string[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('jenis')

  if (error) {
    console.error(error)
    return []
  }

  return [
    ...new Set(
      (data || [])
        .map(r => r.jenis)
        .filter(Boolean)
    )
  ].sort()
}

/* ==========================================================
   DASHBOARD SUMMARY
========================================================== */

export async function getDashboardSummary() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')

  if (error) {
    console.error(error)

    return {
      totalSN: 0,
      totalType: 0,
      totalWarehouse: 0
    }
  }

  const rows = data || []

  return {

    totalSN: rows.length,

    totalType: new Set(
      rows.map(r => r.type)
    ).size,

    totalWarehouse: new Set(
      rows.map(r => r.wh_so)
    ).size
  }
}

/* ==========================================================
   PIVOT BUILDER
========================================================== */

export function buildPivot(
  rows: MasterStockNTE[],
  warehouses: string[]
): PivotRow[] {

  const map: Record<string, PivotRow> = {}

  rows.forEach((r) => {

    const key =
      `${r.jenis}|${r.jenis_2}|${r.status}|${r.type}`

    if (!map[key]) {

      map[key] = {

        jenis: r.jenis,

        jenis_2: r.jenis_2,

        status: r.status,

        type: r.type,

        grand_total: 0
      }

      warehouses.forEach(wh => {
        map[key][wh] = 0
      })
    }

    map[key][r.wh_so] =
      ((map[key][r.wh_so] as number) || 0) + 1
  })

  Object.values(map).forEach(row => {

    row.grand_total =
      warehouses.reduce(
        (sum, wh) =>
          sum + Number(row[wh] || 0),
        0
      )
  })

  return Object.values(map)
    .sort((a, b) =>
      String(a.jenis_2).localeCompare(
        String(b.jenis_2)
      )
    )
}

/* ==========================================================
   GRAND TOTAL PER WAREHOUSE
========================================================== */

export function buildWarehouseTotals(
  rows: MasterStockNTE[],
  warehouses: string[]
) {

  const totals: Record<string, number> = {}

  warehouses.forEach(wh => {
    totals[wh] = 0
  })

  rows.forEach(row => {

    if (!totals[row.wh_so]) {
      totals[row.wh_so] = 0
    }

    totals[row.wh_so]++
  })

  return totals
}

/* ==========================================================
   GRAND TOTAL
========================================================== */

export function getGrandTotal(
  rows: MasterStockNTE[]
) {
  return rows.length
}
