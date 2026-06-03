// lib/masterData.ts
// Katalog NTE, warehouse, dan operator — edit di sini untuk update data

export const AREA_CONFIG: Record<string, {
  operator: string
  area: string
  warehouses: string[]
}> = {
  "TELKOMSEL - BANDUNG": {
    operator: "TELKOMSEL", area: "BANDUNG",
    warehouses: [
      "TA SO INV AHMAD YANI WH", "TA SO INV BANDUNG CENTRUM WH",
      "TA SO INV CIANJUR WH", "TA SO INV CUAURA WH", "TA SO INV CIMAHI WH",
      "TA SO INV GEGERKALONG WH", "TA SO INV KOPO WH", "TA SO INV LEMBANG WH",
      "TA SO INV PADALARANG WH", "TA SO INV RAJAWALI WH",
      "TA SO INV SINDANGLAYA WH", "TA SO INV UJUNG BERUNG WH",
    ]
  },
  "TELKOMSEL - SOREANG": {
    operator: "TELKOMSEL", area: "SOREANG",
    warehouses: [
      "TA SO INV SOREANG WH", "TA SO INV BANJARAN WH",
      "TA SO INV MAJALAYA WH", "TA SO INV SOREANG 2 WH", "TA SO INV CIWIDEY WH",
    ]
  },
  "TELKOM - BANDUNG": {
    operator: "TELKOM", area: "BANDUNG",
    warehouses: [
      "TA SO CCAN AHMAD YANI WH", "TA SO CCAN BANDUNG CENTRUM WH",
      "TA SO CCAN CIANJUR WH", "TA SO CCAN CUAURA WH", "TA SO CCAN CIMAHI WH",
      "TA SO CCAN GEGERKALONG WH", "TA SO CCAN KOPO WH", "TA SO CCAN LEMBANG WH",
      "TA SO CCAN PADALARANG WH", "TA SO CCAN RAJAWALI WH",
      "TA SO CCAN SINDANGLAYA WH", "TA SO CCAN UJUNG BERUNG WH",
    ]
  },
  "TELKOM - SOREANG": {
    operator: "TELKOM", area: "SOREANG",
    warehouses: [
      "TA SO CCAN SOREANG WH", "TA SO CCAN BANJARAN WH",
      "TA SO CCAN MAJALAYA WH", "TA SO CCAN SOREANG 2 WH", "TA SO CCAN CIWIDEY WH",
    ]
  },
  "TIF - BANDUNG": {
    operator: "TIF", area: "BANDUNG",
    warehouses: [
      "TA SO TIF BANDUNG CENTRIUM WH", "TA SO TIF CIJAURA WH",
      "TA SO TIF GEGERKALONG WH", "TA SO TIF UJUNGBERUNG WH",
    ]
  },
  "TIF - SOREANG": {
    operator: "TIF", area: "SOREANG",
    warehouses: [
      "TA SO TIF KADIPATEN WH", "TA SO TIF MAJALENGKA WH", "TA SO TIF SUMEDANG WH",
    ]
  },
}

export const NTE_STATUS: string[] = ["NTE BARU", "REFURBISH"]
export const ALL_OPERATORS: string[] = ["TELKOMSEL", "TELKOM", "TIF"]
export const ALL_AREAS: string[] = ["BANDUNG", "SOREANG"]

export const NTE_CATALOG: Record<string, Record<string, string[]>> = {
  TELKOMSEL: {
    "KARTU PERDANA": ["SIM_CARD_TELKOMSEL_SMOOA", "SIM_CARD_TELKOMSEL_ONE_REVAMP"],
    "MESH WIFI": ["AP_MESH_ZTE_H196A_V9", "AP_MESH_FIBERHOME_SR1021E", "AP_MESH_HUAWEI_WA8021V5"],
    "ONT DUAL BAND": ["ONT_FIBERHOME_HG6145D2", "ONT_HUAWEI_HG8145V5", "ONT_ZTE_F670L", "ONT_ZTE_F672Y"],
    "ONT PREMIUM": ["ONT_FIBERHOME_HG6145F1", "ONT_HUAWEI_HG8145X6-10", "ONT_ZTE_F6600PV9.0", "ONT_FIBERHOME_HG6245N", "ONT_HUAWEI_HG8245U", "ONT_ZTE_F670_V2.0"],
    "ONT SINGLE BAND": ["ONT_FIBERHOME_HG6243C", "ONT_HUAWEI_HG8245H5", "ONT_ZTE_F609_V5.3"],
    "ORBIT": ["Orbit_IP_ZTE_MF920US", "ORBIT_SS_ex_ROUTER_HKM0128a", "ORBIT_SS_ZTE_K10_STAR_Z2", "ORBIT_SS_ZTE_K10_STAR_Z2_(EZNET)", "ORBIT_SS_ZTE_K10_STAR_Z2_(NON_REWORK)", "ORBIT_SS_ZTE_K10_STAR_Z2_(REWORK)"],
    "REMOTE": ["REMOTE_ANDROID_ZTE_C3140_31KEY"],
    "STB": ["SetTopBox_ZTE_B860H_V5.0", "SetTopBox_ZTE_ZX10_B866F_V1.1"],
  },
  TELKOM: {
    "AP": ["AP_CISCO_C9105AXI-F", "AP_CISCO_AIR-AP1832I-F-K9", "AP_CISCO_AIR-CAP1602E-C-K9", "AP_CISCO_AIR-CAP1602I-C-K9", "AP_CISCO_AIR-CAP3502E-C-K9", "AP_CISCO_AIR-CAP3502I-C-K9", "AP_HUAWEI_WA201DK-NE"],
    "IP CAM": ["IP_Camera_Azustar_WM-03"],
    "MESH WIFI": ["AP_MESH_ZTE_H196A_V9", "AP_MESH_FIBERHOME_SR1021E"],
    "ONT DUAL BAND": ["ONT_FIBERHOME_HG6145D2", "ONT_HUAWEI_HG8145V5", "ONT_NOKIA_G-2425G-A", "ONT_ZTE_F672Y"],
    "ONT ENTERPRISE": ["FH_AN_5261_DC_10G", "ONT_FIBERHOME_FH_AN_5231_AC_1G", "ONT_FIBERHOME_FH_AN_5261_DC_10G", "ONT_HUAWEI_MA_5822", "ONT_HUAWEI_MA5694_AC", "ONT_ZTE_F821AC", "ONT_ZTE_F939DC_DUAL_HOMING"],
    "ONT PREMIUM": ["ONT_FIBERHOME_HG6145F1", "ONT_ZTE_F670_V2.0", "ONT_FIBERHOME_HG6245N"],
    "ONT SINGLE BAND": ["ONT_FIBERHOME_AN5506-04-F", "ONT_FIBERHOME_AN5506-04-FS", "ONT_FIBERHOME_AN5506-07-B1", "ONT_FIBERHOME_HG6243C", "ONT_HUAWEI_HG8245", "ONT_HUAWEI_HG8245A", "ONT_HUAWEI_HG8245H", "ONT_HUAWEI_HG8245H5"],
    "PLC": ["PLC_TL-PA7017_KIT", "PLC_TL-PA4010KIT"],
    "SFP": ["SFP_10G_10KM", "SFP_10G_80KM", "SFP_1G_Electrical_RJ45"],
    "STB": ["SetTopBox_ZTE_ZX10_B866F_V1.1", "SetTopBox_ZTE_B860H_V5.0", "SetTopBoxIPTV_ZTE_B860H", "SetTopBoxIPTV_ZTE_B860H_V2.1"],
    "WIFI EXTENDER": ["WIFI_EXTENDER_EW-7438RPN"],
  },
  TIF: {
    "ONT DUAL BAND": ["ONT_FIBERHOME_HG6145D2", "ONT_HUAWEI_HG8145V5", "ONT_ZTE_F672Y"],
    "ONT PREMIUM": ["ONT_FIBERHOME_HG6145F1", "ONT_ZTE_F670_V2.0"],
    "ONT SINGLE BAND": ["ONT_FIBERHOME_AN5506-04-FS", "ONT_FIBERHOME_HG6243C", "ONT_HUAWEI_HG8245H5"],
    "STB": ["SetTopBox_ZTE_B860H_V5.0", "SetTopBox_ZTE_ZX10_B866F_V1.1"],
  },
}

export const OP_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  TELKOMSEL: { bg: "#1B5E20", text: "#ffffff", border: "#2E7D32", light: "#E8F5E9" },
  TELKOM:    { bg: "#0D47A1", text: "#ffffff", border: "#1565C0", light: "#E3F2FD" },
  TIF:       { bg: "#E65100", text: "#ffffff", border: "#F4511E", light: "#FFF3E0" },
}

export function shortWH(wh: string): string {
  return wh
    .replace(/TA SO INV /g, "").replace(/TA SO CCAN /g, "").replace(/TA SO TIF /g, "")
    .replace(/ WH$/g, "").trim()
}

export function getAreaKeys(operator?: string, area?: string) {
  return Object.entries(AREA_CONFIG)
    .filter(([, v]) => (!operator || v.operator === operator) && (!area || v.area === area))
    .map(([k]) => k)
}
