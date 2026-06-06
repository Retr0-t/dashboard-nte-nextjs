/**
 * NTE_Sync_AppsScript.js
 * Push data G-Sheet → Supabase (tabel master_stok_nte)
 * realtime onEdit + full sync harian
 *
 * CARA SETUP:
 * 1. G-Sheet → Extensions → Apps Script → paste kode ini
 * 2. Isi CONFIG di bawah
 * 3. Jalankan setupTriggers() sekali → authorize → selesai
 */

const CONFIG = {
  SUPABASE_URL:   'https://xxxxxxxxxxxx.supabase.co',  // Supabase Settings > API > URL
  SUPABASE_KEY:   'eyJhbGci...',                        // Service Role Key (bukan anon!)
  TABLE_NAME:     'master_stok_nte',
  SHEET_NAME:     'Sheet1',                             // nama sheet G-Sheet Anda
  BACKUP_HOUR:    6,                                    // jam full sync harian (WIB)
  NEXTJS_API_URL: 'https://your-app.vercel.app',        // URL app Vercel Anda
  SYNC_SECRET:    'nte-sync-secret-2025',
  LOG_SHEET:      'Sync Log',
}

// Mapping kolom G-Sheet → field Supabase
const COLUMN_MAP = {
  'REG':                  'reg',
  'WITEL':                'witel',
  'WH CODE':              'wh_code',
  'WH SO (SESUAI SCMT)':  'warehouse',
  'STATUS':               'status_nte',
  'JENIS':                'jenis',
  'JENIS 2':              'jenis_nte',
  'MERK':                 'merk',
  'TYPE':                 'type_nte',
  'SN':                   'sn',
  'STATUS SCMT':          'status_scmt',
  'TANGGAL UPDATE':       'tanggal_update',
  'OWNER (INV/ CCAN)':    'operator',
}

// Mapping OWNER → operator
const OPERATOR_MAP = {
  'INV': 'TELKOMSEL', 'inv': 'TELKOMSEL',
  'CCAN': 'TELKOM',   'ccan': 'TELKOM',
  'TIF': 'TIF',       'tif': 'TIF',
}

// ── Setup trigger (jalankan sekali) ──────────────────────────────────────────
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t))

  ScriptApp.newTrigger('onEditSync')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit().create()

  const utcHour = CONFIG.BACKUP_HOUR - 7 < 0 ? CONFIG.BACKUP_HOUR - 7 + 24 : CONFIG.BACKUP_HOUR - 7
  ScriptApp.newTrigger('dailyFullSync')
    .timeBased().atHour(utcHour).everyDays(1).create()

  writeLog('INFO', 'Triggers dipasang: onEdit + daily jam ' + CONFIG.BACKUP_HOUR + ':00 WIB')
  SpreadsheetApp.getUi().alert('✅ Triggers berhasil!\n\n• Realtime: setiap edit\n• Harian: jam ' + CONFIG.BACKUP_HOUR + ':00 WIB')
}

// ── onEdit trigger ────────────────────────────────────────────────────────────
function onEditSync(e) {
  if (!e) return
  const sheet = e.source.getActiveSheet()
  if (sheet.getName() !== CONFIG.SHEET_NAME) return
  const row = e.range.getRow()
  if (row <= 1) return

  try {
    const headers = getHeaders(sheet)
    const rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0]
    const record  = buildRecord(headers, rowData, row)
    if (!record) return
    upsertToSupabase([record])
    writeLog('EDIT', 'Baris ' + row + ' di-sync: ' + (record.type_nte || '-'))
  } catch (err) {
    writeLog('ERROR', 'onEdit baris ' + row + ': ' + err.message)
  }
}

// ── Full sync harian ──────────────────────────────────────────────────────────
function dailyFullSync() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME)
  if (!sheet) { writeLog('ERROR', 'Sheet tidak ditemukan'); return }

  const headers = getHeaders(sheet)
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) { writeLog('INFO', 'Sheet kosong'); return }

  const allData = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
  const records = []
  allData.forEach((row, i) => {
    const rec = buildRecord(headers, row, i + 2)
    if (rec) records.push(rec)
  })

  if (!records.length) { writeLog('INFO', 'Tidak ada baris valid'); return }

  const BATCH = 500
  let total = 0
  for (let i = 0; i < records.length; i += BATCH) {
    upsertToSupabase(records.slice(i, i + BATCH))
    total += Math.min(BATCH, records.length - i)
    Utilities.sleep(300)
  }

  writeLog('DAILY', 'Full sync: ' + total + ' baris dikirim')

  // Notify Next.js
  try {
    if (CONFIG.NEXTJS_API_URL) {
      UrlFetchApp.fetch(CONFIG.NEXTJS_API_URL + '/api/gsheet-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sync-secret': CONFIG.SYNC_SECRET },
        payload: JSON.stringify({ action: 'notify' }),
        muteHttpExceptions: true,
      })
    }
  } catch (e) { writeLog('WARN', 'Notify Next.js: ' + e.message) }
}

// ── Build record ──────────────────────────────────────────────────────────────
function buildRecord(headers, rowValues, rowNum) {
  if (!rowValues.some(v => v !== '' && v !== null)) return null
  const raw = {}
  headers.forEach((h, i) => { raw[h] = rowValues[i] })
  const rec = {}

  Object.entries(COLUMN_MAP).forEach(([col, field]) => {
    let val = raw[col]
    if (val instanceof Date) {
      val = Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd')
    } else if (val !== null && val !== undefined) {
      val = String(val).trim()
    } else {
      val = null
    }
    rec[field] = val || null
  })

  if (rec.operator) {
    rec.operator = OPERATOR_MAP[rec.operator] || String(rec.operator).toUpperCase()
  }

  rec.row_number = rowNum
  rec.synced_at  = new Date().toISOString()
  rec.source     = 'gsheet'
  return rec
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim())
}

function upsertToSupabase(records) {
  const res = UrlFetchApp.fetch(
    CONFIG.SUPABASE_URL + '/rest/v1/' + CONFIG.TABLE_NAME,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        CONFIG.SUPABASE_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
        'Prefer':        'resolution=merge-duplicates,return=minimal',
      },
      payload: JSON.stringify(records),
      muteHttpExceptions: true,
    }
  )
  const code = res.getResponseCode()
  if (code >= 400) throw new Error('Supabase ' + code + ': ' + res.getContentText().substring(0, 200))
}

function writeLog(type, message) {
  const ss = SpreadsheetApp.getActive()
  let log  = ss.getSheetByName(CONFIG.LOG_SHEET)
  if (!log) {
    log = ss.insertSheet(CONFIG.LOG_SHEET)
    log.getRange(1,1,1,3).setValues([['TIMESTAMP','TYPE','MESSAGE']]).setFontWeight('bold')
    log.setColumnWidths(1, 3, [160, 80, 500])
  }
  const ts = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss')
  log.appendRow([ts, type, message])
  const rows = log.getLastRow() - 1
  if (rows > 1000) log.deleteRows(2, rows - 1000)
}

function checkConnection() {
  try {
    const res  = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/' + CONFIG.TABLE_NAME + '?limit=1', {
      headers: { 'apikey': CONFIG.SUPABASE_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY },
      muteHttpExceptions: true,
    })
    const code = res.getResponseCode()
    SpreadsheetApp.getUi().alert(code === 200
      ? '✅ Koneksi berhasil! Status: ' + code
      : '⚠️ Status: ' + code + '\n' + res.getContentText().substring(0, 300))
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Gagal: ' + e.message)
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🔄 NTE Sync')
    .addItem('Setup Trigger (sekali saja)', 'setupTriggers')
    .addSeparator()
    .addItem('Sync Sekarang (full)',        'dailyFullSync')
    .addItem('Cek Koneksi Supabase',        'checkConnection')
    .addSeparator()
    .addItem('Lihat Log',                  'openLog')
    .addToUi()
}

function openLog() {
  const log = SpreadsheetApp.getActive().getSheetByName(CONFIG.LOG_SHEET)
  if (log) SpreadsheetApp.getActive().setActiveSheet(log)
  else SpreadsheetApp.getUi().alert('Log belum ada. Coba sync dulu.')
}
