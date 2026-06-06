// lib/masterData.ts

export const AREA_CONFIG: Record<
  string,
  {
    owner: string
    area: string
    warehouses: string[]
  }
> = {
  "TELKOMSEL - BANDUNG": {
    owner: "TELKOMSEL",
    area: "BANDUNG",
    warehouses: [
      "TA SO INV AHMAD YANI WH",
      "TA SO INV BANDUNG CENTRUM WH",
      "TA SO INV CIANJUR WH",
      "TA SO INV CIJAURA WH",
      "TA SO INV CIMAHI WH",
      "TA SO INV GEGERKALONG WH",
      "TA SO INV KOPO WH",
      "TA SO INV LEMBANG WH",
      "TA SO INV PADALARANG WH",
      "TA SO INV RAJAWALI WH",
      "TA SO INV SINDANGLAYA WH",
      "TA SO INV UJUNG BERUNG WH",
    ],
  },

  "TELKOMSEL - SOREANG": {
    owner: "TELKOMSEL",
    area: "SOREANG",
    warehouses: [
      "TA SO INV SOREANG WH",
      "TA SO INV BANJARAN WH",
      "TA SO INV MAJALAYA WH",
      "TA SO INV SOREANG 2 WH",
      "TA SO INV CIWIDEY WH",
    ],
  },

  "TELKOM - BANDUNG": {
    owner: "TELKOM",
    area: "BANDUNG",
    warehouses: [
      "TA SO CCAN AHMAD YANI WH",
      "TA SO CCAN BANDUNG CENTRUM WH",
      "TA SO CCAN CIANJUR WH",
      "TA SO CCAN CUAURA WH",
      "TA SO CCAN CIMAHI WH",
      "TA SO CCAN GEGERKALONG WH",
      "TA SO CCAN KOPO WH",
      "TA SO CCAN LEMBANG WH",
      "TA SO CCAN PADALARANG WH",
      "TA SO CCAN RAJAWALI WH",
      "TA SO CCAN SINDANGLAYA WH",
      "TA SO CCAN UJUNG BERUNG WH",
    ],
  },

  "TELKOM - SOREANG": {
    owner: "TELKOM",
    area: "SOREANG",
    warehouses: [
      "TA SO CCAN SOREANG WH",
      "TA SO CCAN BANJARAN WH",
      "TA SO CCAN MAJALAYA WH",
      "TA SO CCAN SOREANG 2 WH",
      "TA SO CCAN CIWIDEY WH",
    ],
  },

  "TIF - BANDUNG": {
    owner: "TIF",
    area: "BANDUNG",
    warehouses: [
      "TA SO TIF BANDUNG CENTRIUM WH",
      "TA SO TIF CIJAURA WH",
      "TA SO TIF GEGERKALONG WH",
      "TA SO TIF UJUNGBERUNG WH",
    ],
  },

  "TIF - SOREANG": {
    owner: "TIF",
    area: "SOREANG",
    warehouses: [
      "TA SO TIF KADIPATEN WH",
      "TA SO TIF MAJALENGKA WH",
      "TA SO TIF SUMEDANG WH",
    ],
  },
}

export const ALL_OPERATORS = [
  "TELKOMSEL",
  "TELKOM",
  "TIF",
]

export const ALL_AREAS = [
  "BANDUNG",
  "SOREANG",
]

export const OP_COLORS: Record<
  string,
  {
    bg: string
    light: string
    border: string
  }
> = {
  TELKOMSEL: {
    bg: "#1B5E20",
    light: "#E8F5E9",
    border: "#A5D6A7",
  },

  TELKOM: {
    bg: "#0D47A1",
    light: "#E3F2FD",
    border: "#90CAF9",
  },

  TIF: {
    bg: "#E65100",
    light: "#FFF3E0",
    border: "#FFCC80",
  },
}

export function shortWH(wh: string): string {
  return wh
    .replace(/TA SO INV /g, '')
    .replace(/TA SO CCAN /g, '')
    .replace(/TA SO TIF /g, '')
    .replace(/ WH$/g, '')
    .trim()
}

export function getAreaKeys(owner?: string): string[] {
  return Object.entries(AREA_CONFIG)
    .filter(([, v]) => !owner || v.owner === owner)
    .map(([k]) => k)
}
