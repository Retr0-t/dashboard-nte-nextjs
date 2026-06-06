'use client'
// lib/exportReport.ts — PDF & JPG export (browser only, dynamic imports)
import { shortWH, OP_COLORS } from './masterData'

export interface ExportData {
  rows:       any[]
  warehouses: string[]
  owner:   string
  area:       string
  tanggal:    string
}

const OP_RGB: Record<string, [number,number,number]> = {
  TELKOMSEL: [27,  94,  32],
  TELKOM:    [13,  71, 161],
  TIF:       [230, 81,   0],
}

export async function generatePDF(data: ExportData): Promise<void> {
  const jsPDF     = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  const { rows, warehouses, owner, area, tanggal } = data
  const rgb     = OP_RGB[operator] || [30, 58, 95]
  const shortWHs = warehouses.map(shortWH)
  const doc     = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
  const pageW   = doc.internal.pageSize.getWidth()
  const pageH   = doc.internal.pageSize.getHeight()

  // Header
  doc.setFillColor(...rgb)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(255,255,255)
  doc.text(`STOCK NTE ${owner} — ${area}`, pageW/2, 10, { align:'center' })
  doc.setFontSize(8); doc.setFont('helvetica','normal')
  doc.text(`Tanggal: ${tanggal}  |  WH: ${warehouses.length}  |  ${new Date().toLocaleString('id-ID')}`, pageW/2, 17, { align:'center' })

  // Table
  let prevJenis = ''
  const body = rows.map(r => {
    const j = r.jenis_nte !== prevJenis ? r.jenis_nte : ''
    prevJenis = r.jenis_nte
    return [j, r.status_nte, r.type_nte.replace(/_/g,' '),
      ...warehouses.map(wh => ((r[wh]||0)>0 ? String(r[wh]) : '')),
      r.grand_total>0 ? String(r.grand_total) : '']
  })
  const gtRow = ['Grand Total','','',
    ...warehouses.map(wh => { const t=rows.reduce((s,r)=>s+((r[wh]||0) as number),0); return t>0?String(t):'' }),
    String(rows.reduce((s,r)=>s+r.grand_total,0))]
  body.push(gtRow)

  const nWH    = warehouses.length
  const fixedW = 35+18+55
  const whW    = Math.max(10, (pageW-28-fixedW-18)/nWH)

  autoTable(doc, {
    startY: 26,
    head: [['JENIS 2','STATUS','TYPE',...shortWHs,'Grand Total']],
    body,
    theme: 'grid',
    styles: { fontSize:7, cellPadding:1.5, valign:'middle', textColor:[30,30,30] },
    headStyles: { fillColor:rgb, textColor:[255,255,255], fontStyle:'bold', fontSize:7, halign:'center' },
    columnStyles: {
      0:{cellWidth:35,fontStyle:'bold',textColor:[30,58,95]},
      1:{cellWidth:18,halign:'center'},
      2:{cellWidth:55},
      ...Object.fromEntries(warehouses.map((_,i)=>[i+3,{cellWidth:whW,halign:'center'}])),
      [nWH+3]:{cellWidth:18,halign:'center',fontStyle:'bold',textColor:[192,57,43]},
    },
    didParseCell(d) {
      if (d.section!=='body') return
      const {row:{index:ri}, column:{index:ci}} = d
      if (ci===1) {
        const v=String(d.cell.raw||'')
        if (v==='NTE BARU')  { d.cell.styles.fillColor=[213,245,227]; d.cell.styles.textColor=[30,132,73] }
        if (v==='REFURBISH') { d.cell.styles.fillColor=[255,243,205]; d.cell.styles.textColor=[133,100,4] }
      }
      if (ci===nWH+3 && ri<body.length-1) { d.cell.styles.fillColor=[250,219,216]; d.cell.styles.fontStyle='bold' }
      if (ri===body.length-1) {
        d.cell.styles.fillColor=[30,58,95]; d.cell.styles.textColor=[255,255,255]; d.cell.styles.fontStyle='bold'
        if (ci===nWH+3) d.cell.styles.fillColor=[192,57,43]
      }
    },
    margin:{left:14,right:14}, tableLineColor:[200,200,200], tableLineWidth:0.1,
  })

  doc.setFontSize(7); doc.setTextColor(150,150,150)
  doc.text(`NTE Operations · Telkom Indonesia · ${operator} ${area} · ${tanggal}`, pageW/2, pageH-5, {align:'center'})
  doc.save(`STOCK_NTE_${operator}_${area}_${tanggal}.pdf`)
}

export async function generateJPG(data: ExportData): Promise<void> {
  const html2canvas = (await import('html2canvas')).default
  const { rows, warehouses, owner, area, tanggal } = data
  const rgb  = OP_RGB[operator] || [30,58,95]
  const hex  = `rgb(${rgb.join(',')})`
  const shortWHs = warehouses.map(shortWH)
  const total = rows.reduce((s,r)=>s+r.grand_total, 0)

  const el = document.createElement('div')
  el.style.cssText = `position:fixed;left:-9999px;top:0;background:white;padding:16px;font-family:Arial,sans-serif;width:${Math.max(900,380+warehouses.length*72)}px`
  document.body.appendChild(el)

  let prev = ''
  el.innerHTML = `
  <div style="border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
    <div style="background:${hex};padding:14px 20px;color:white">
      <div style="font-size:16px;font-weight:bold">STOCK NTE ${operator} — ${area}</div>
      <div style="font-size:10px;opacity:.8;margin-top:4px">Tanggal: ${tanggal} · Total: ${total.toLocaleString('id-ID')} unit</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead>
        <tr style="background:${hex}">
          <th style="color:white;padding:6px 8px;text-align:left;border:1px solid rgba(255,255,255,.2);min-width:120px">JENIS 2</th>
          <th style="color:white;padding:6px 4px;text-align:center;border:1px solid rgba(255,255,255,.2);width:90px">STATUS</th>
          <th style="color:white;padding:6px 8px;text-align:left;border:1px solid rgba(255,255,255,.2);min-width:180px">TYPE</th>
          ${shortWHs.map(w=>`<th style="color:white;padding:6px 4px;text-align:center;font-size:9px;border:1px solid rgba(255,255,255,.2);width:72px">${w}</th>`).join('')}
          <th style="color:white;padding:6px 4px;text-align:center;background:#C0392B;border:1px solid rgba(255,255,255,.2);width:72px">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r,i)=>{
          const jenis = r.jenis_nte!==prev ? r.jenis_nte : ''; prev=r.jenis_nte
          const bg = i%2===0?'#fff':'#f8fafc'
          const sBg  = r.status_nte==='NTE BARU'?'#d5f5e3':'#fff3cd'
          const sTxt = r.status_nte==='NTE BARU'?'#1e8449':'#856404'
          return `<tr style="background:${bg}">
            <td style="padding:4px 8px;border:1px solid #e2eaf2;font-weight:${jenis?'bold':'normal'};color:#1e3a5f;background:${jenis?'#ebf2fa':bg}">${jenis}</td>
            <td style="padding:4px;border:1px solid #e2eaf2;text-align:center">
              <span style="background:${sBg};color:${sTxt};padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600">${r.status_nte==='NTE BARU'?'BARU':'RFBSH'}</span>
            </td>
            <td style="padding:4px 8px;border:1px solid #e2eaf2;font-family:monospace;font-size:10px">${r.type_nte.replace(/_/g,' ')}</td>
            ${warehouses.map(wh=>{const v=(r[wh]||0) as number;return`<td style="padding:4px;border:1px solid #e2eaf2;text-align:center;background:${v>0?'#f0fdf4':bg};color:${v>0?'#166534':'#ccc'}">${v>0?v:''}</td>`}).join('')}
            <td style="padding:4px;border:1px solid #e2eaf2;text-align:center;background:#fadbd8;color:#c0392b;font-weight:bold">${r.grand_total||''}</td>
          </tr>`
        }).join('')}
        <tr style="background:#1e3a5f">
          <td colspan="3" style="padding:6px 8px;color:white;font-weight:bold;border:1px solid #0d2137">Grand Total</td>
          ${warehouses.map(wh=>{const t=rows.reduce((s,r)=>s+((r[wh]||0) as number),0);return`<td style="padding:6px 4px;text-align:center;color:white;font-weight:bold;background:#2e6da4;border:1px solid #0d2137">${t||''}</td>`}).join('')}
          <td style="padding:6px 4px;text-align:center;color:white;font-weight:bold;background:#c0392b;border:1px solid #922b21">${total}</td>
        </tr>
      </tbody>
    </table>
  </div>`

  const canvas = await html2canvas(el, { scale:2, backgroundColor:'#fff', useCORS:true })
  document.body.removeChild(el)
  const a = document.createElement('a')
  a.download = `STOCK_NTE_${operator}_${area}_${tanggal}.jpg`
  a.href = canvas.toDataURL('image/jpeg', 0.92)
  a.click()
}
