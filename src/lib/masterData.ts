// lib/masterData.ts
// owner di DB: INV=TELKOMSEL, CCAN=TELKOM, TIF=TIF
// warehouses = nilai field wh_so di tabel master_stock_nte

export const OWNER_TO_OP: Record<string, string> = {
  INV:  'TELKOMSEL',
  CCAN: 'TELKOM',
  TIF:  'TIF',
}

export const OP_TO_OWNER: Record<string, string> = {
  TELKOMSEL: 'INV',
  TELKOM:    'CCAN',
  TIF:       'TIF',
}

// Key = "OWNER|WITEL" sesuai nilai di DB
export const AREA_CONFIG: Record<string, {
  owner:      string
  operator:   string
  witel:      string
  warehouses: string[]  // nilai wh_so di DB
}> = {
  'INV|BANDUNG': {
    owner: 'INV', operator: 'TELKOMSEL', witel: 'BANDUNG',
    warehouses: [
      'TA SO INV AHMAD YANI WH',
      'TA SO INV BANDUNG CENTRUM WH',
      'TA SO INV CIANJUR WH',
      'TA SO INV CIJAURA WH',
      'TA SO INV CIMAHI WH',
      'TA SO INV GEGERKALONG WH',
      'TA SO INV KOPO WH',
      'TA SO INV LEMBANG WH',
      'TA SO INV PADALARANG WH',
      'TA SO INV RAJAWALI WH',
      'TA SO INV SINDANGLAYA WH',
      'TA SO INV UJUNG BERUNG WH',
    ],
  },
  'INV|SOREANG': {
    owner: 'INV', operator: 'TELKOMSEL', witel: 'SOREANG',
    warehouses: [
      'TA SO INV KADIPATEN WH',
      'TA SO INV BANJARAN WH',
      'TA SO INV MAJALAYA WH',
      'TA SO INV SUMEDANG WH',
      'TA SO INV MAJALENGKA WH',
    ],
  },
  'CCAN|BANDUNG': {
    owner: 'CCAN', operator: 'TELKOM', witel: 'BANDUNG',
    warehouses: [
      'TA SO CCAN AHMAD YANI WH',
      'TA SO CCAN BANDUNG CENTRUM WH',
      'TA SO CCAN CIANJUR WH',
      'TA SO CCAN CIJAURA WH',
      'TA SO CCAN CIMAHI WH',
      'TA SO CCAN GEGERKALONG WH',
      'TA SO CCAN KOPO WH',
      'TA SO CCAN LEMBANG WH',
      'TA SO CCAN PADALARANG WH',
      'TA SO CCAN RAJAWALI WH',
      'TA SO CCAN SINDANGLAYA WH',
      'TA SO CCAN UJUNG BERUNG WH',
      'TA WITEL CCAN JABAR TENGAH (BANDUNG) WH,
    ],
  },
  'CCAN|SOREANG': {
    owner: 'CCAN', operator: 'TELKOM', witel: 'SOREANG',
    warehouses: [
      'TA SO CCAN SUMEDANG WH',
      'TA SO CCAN BANJARAN WH',
      'TA SO CCAN MAJALAYA WH',
      'TA SO CCAN KADIPATEN WH',
      'TA SO CCAN MAJALENGKA WH',
      'TA WITEL CCAN BANDUNG BARAT WH,
    ],
  },
  'TIF|BANDUNG': {
    owner: 'TIF', operator: 'TIF', witel: 'BANDUNG',
    warehouses: [
      'TA SO TIF BANDUNG CENTRIUM WH',
      'TA SO TIF CIJAURA WH',
      'TA SO TIF GEGERKALONG WH',
      'TA SO TIF UJUNGBERUNG WH',
      'TA SO TIF KOPO WH'
    ],
  },
  'TIF|SOREANG': {
    owner: 'TIF', operator: 'TIF', witel: 'SOREANG',
    warehouses: [
      'TA SO TIF KADIPATEN WH',
      'TA SO TIF MAJALENGKA WH',
      'TA SO TIF SUMEDANG WH',
    ],
  },
}

export const ALL_OPERATORS: string[] = ['TELKOMSEL', 'TELKOM', 'TIF']
export const ALL_OWNERS:    string[] = ['INV', 'CCAN', 'TIF']
export const ALL_WITELS:    string[] = ['BANDUNG', 'SOREANG']

export function getAreaKeys(operator?: string): string[] {
  return Object.entries(AREA_CONFIG)
    .filter(([, v]) => !operator || v.operator === operator)
    .map(([k]) => k)
}

export const OP_COLORS: Record<string, { bg: string; light: string; border: string }> = {
  TELKOMSEL: { bg: '#1B5E20', light: '#E8F5E9', border: '#A5D6A7' },
  TELKOM:    { bg: '#0D47A1', light: '#E3F2FD', border: '#90CAF9' },
  TIF:       { bg: '#E65100', light: '#FFF3E0', border: '#FFCC80' },
}

export function shortWH(wh: string): string {
  return wh
    .replace(/TA SO INV /g,  '')
    .replace(/TA SO CCAN /g, '')
    .replace(/TA SO TIF /g,  '')
    .replace(/ WH$/g, '')
    .trim()
}
