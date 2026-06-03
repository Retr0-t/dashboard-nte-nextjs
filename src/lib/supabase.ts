import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(
  supabaseUrl,
  supabaseAnon
)

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

/* =======================================================
   MASTER STOCK
======================================================= */

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

  if (filters?.reg)
    query = query.eq('reg', filters.reg)

  if (filters?.witel)
    query = query.eq('witel', filters.witel)

  if (filters?.wh_so)
    query = query.eq('wh_so', filters.wh_so)

  if (filters?.owner)
    query = query.eq('owner', filters.owner)

  if (filters?.status)
    query = query.eq('status', filters.status)

  if (filters?.jenis)
    query = query.eq('jenis', filters.jenis)

  if (filters?.jenis_2)
    query = query.eq('jenis_2', filters.jenis_2)

  const { data, error } = await query

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

/* =======================================================
   GET WAREHOUSE BY WITEL
======================================================= */

export async function getWarehousesByWitel(
  witel: string
): Promise<string[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('wh_so')
    .eq('witel', witel)

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

/* =======================================================
   GET WITEL LIST
======================================================= */

export async function getWitelList(): Promise<string[]> {

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

/* =======================================================
   DASHBOARD SUMMARY
======================================================= */

export async function getDashboardSummary() {

  const { data } = await supabase
    .from('master_stock_nte')
    .select('*')

  const rows = data || []

  return {
    totalSN: rows.length,

    totalWarehouse:
      new Set(rows.map(r => r.wh_so)).size,

    totalType:
      new Set(rows.map(r => r.type)).size,

    totalWitel:
      new Set(rows.map(r => r.witel)).size
  }
}

/* =======================================================
   BUILD PIVOT
======================================================= */

export function buildPivot(
  rows: MasterStockNTE[],
  warehouses: string[]
): PivotRow[] {

  const map: Record<string, PivotRow> = {}

  rows.forEach(r => {

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
      Number(map[key][r.wh_so] || 0) + 1
  })

  Object.values(map).forEach(row => {

    row.grand_total = warehouses.reduce(
      (sum, wh) =>
        sum + Number(row[wh] || 0),
      0
    )
  })

  return Object.values(map)
}
