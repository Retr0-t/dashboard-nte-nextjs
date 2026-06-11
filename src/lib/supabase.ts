  
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
    sn: string
    reg: string | null
    witel: string | null
    wh_code: string | null
    wh_so: string | null
    status: string | null
    jenis: string | null
    jenis_2: string | null
    merk: string | null
    type: string | null
    status_scmt: string | null
    tanggal_update: string | null
    owner: string | null
    updated_at: string | null
  }
  
  export interface PivotRow {
    jenis_2: string
    type: string
    status: string
    grand_total: number
    [wh_so: string]: string | number
  }
  
  /* ==========================================================
     HELPERS
  ========================================================== */
  
  const PAGE_SIZE = 1000
  
  function normalizeOwner(owner: string | null | undefined) {
    return (owner || '')
      .trim()
      .replace(/_/g, ' ')
      .toUpperCase()
  }
  
  function normalizeStatus(status: string | null | undefined) {
    return (status || '')
      .trim()
      .toUpperCase()
  }
  
  /* ==========================================================
     FETCH ALL DATA WITH PAGINATION
  ========================================================== */
  
  async function fetchAllRows(
    selectCols: string,
    owner?: string
  ): Promise<any[]> {
    const allData: any[] = []
  
    let from = 0
  
    while (true) {
      let query = supabase
        .from('master_stock_nte')
        .select(selectCols)
        .range(from, from + PAGE_SIZE - 1)
  
      if (owner) {
        query = query.eq('owner', owner)
      }
  
      const { data, error } = await query
  
      if (error) throw error
  
      if (!data || data.length === 0) {
        break
      }
  
      allData.push(...data)
  
      if (data.length < PAGE_SIZE) {
        break
      }
  
      from += PAGE_SIZE
    }
  
    return allData
  }
  
  /* ==========================================================
     GET LAPORAN HARIAN
  ========================================================== */
  
  export async function getLaporanHarian(params: {
    owner: string
    wh_so: string[]
  }): Promise<PivotRow[]> {
  
    const { owner, wh_so: warehouses } = params
  
    const data = await fetchAllRows(
      'wh_so, jenis_2, type, status',
      owner
    )
  
    if (!data.length) return []
  
    const countMap: Record<string, Record<string, number>> = {}
  
    for (const row of data) {
  
      const wh = (row.wh_so || '').trim()
      const jenis = (row.jenis_2 || '').trim()
      const type = (row.type || '').trim()
      const status = normalizeStatus(row.status)
  
      if (
        status !== 'NTE BARU' &&
        status !== 'REFURBISH'
      ) {
        continue
      }
  
      if (!wh || !jenis || !type) continue
  
      const key = `${jenis}||${type}||${status}`
  
      if (!countMap[key]) {
        countMap[key] = {}
      }
  
      countMap[key][wh] =
        (countMap[key][wh] || 0) + 1
    }
  
    const rows: PivotRow[] = []
  
    for (const [key, whCounts] of Object.entries(countMap)) {
  
      const [jenis_2, type, status] =
        key.split('||')
  
      const row: PivotRow = {
        jenis_2,
        type,
        status,
        grand_total: 0
      }
  
      let grand = 0
  
      for (const wh of warehouses) {
        const qty = whCounts[wh] || 0
  
        row[wh] = qty
        grand += qty
      }
  
      row.grand_total = grand
  
      if (grand > 0) {
        rows.push(row)
      }
    }
  
    rows.sort((a, b) => {
  
      if (a.jenis_2 !== b.jenis_2) {
        return a.jenis_2.localeCompare(b.jenis_2)
      }
  
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type)
      }
  
      if (a.status === 'NTE BARU') return -1
      if (b.status === 'NTE BARU') return 1
  
      return a.status.localeCompare(b.status)
    })
  
    return rows
  }
  
  /* ==========================================================
     DASHBOARD STATS
  ========================================================== */
  
 export async function getDashboardStats() {

  const allData = await fetchAllRows(
    'owner, updated_at'
  )

  const totalUnits = allData.length

  const ownerStats = {
    TELKOMSEL: 0,
    TELKOM: 0,
    TIF: 0,
  }

  let latestUpdated: string | null = null

  for (const row of allData) {

    const owner = normalizeOwner(row.owner)

    if (owner === 'TELKOMSEL') {
      ownerStats.TELKOMSEL++
    }
    else if (owner === 'TELKOM') {
      ownerStats.TELKOM++
    }
    else {
      ownerStats.TIF++
    }

    if (
      row.updated_at &&
      (
        !latestUpdated ||
        row.updated_at > latestUpdated
      )
    ) {
      latestUpdated = row.updated_at
    }
  }

  return {
    totalUnits,
    ownerStats,
    lastUpdated: latestUpdated,
  }
}
  
  /* ==========================================================
     GET WH COVERAGE
  ========================================================== */
  
  export async function getWHCoverage(owner?: string) {
  
    const allData = await fetchAllRows(
      'owner, wh_so',
      owner
    )
  
    const seen = new Set<string>()
  
    return allData
      .map((r: any) => ({
        owner: normalizeOwner(r.owner),
        wh_so: (r.wh_so || '').trim()
      }))
      .filter((r: any) => {
  
        if (!r.wh_so) return false
  
        const key = `${r.owner}|${r.wh_so}`
  
        if (seen.has(key)) {
          return false
        }
  
        seen.add(key)
  
        return true
      })
  }
  
  /* ==========================================================
     GET OWNER LIST
  ========================================================== */
  
  export async function getOwners(): Promise<string[]> {
  
    const data = await fetchAllRows('owner')
  
    return Array.from(
      new Set(
        data
          .map((r: any) => normalizeOwner(r.owner))
          .filter(Boolean)
      )
    )
  }
  
  /* ==========================================================
     GET WITEL LIST
  ========================================================== */
  
  export async function getWitelList(): Promise<string[]> {
  
    const data = await fetchAllRows('witel')
  
    return Array.from(
      new Set(
        data
          .map((r: any) => r.witel)
          .filter(Boolean)
      )
    )
  }
  
