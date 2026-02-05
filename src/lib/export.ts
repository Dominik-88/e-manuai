// Export utilities for service records, areas, and GPS data
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface ServiceRecord {
  id: string;
  datum_servisu: string;
  mth_pri_servisu: number;
  typ_zasahu: string;
  popis: string;
  provedl_osoba: string;
  provedla_firma?: string | null;
  naklady?: number | null;
  arealy?: { nazev: string } | null;
}

interface MachineInfo {
  model: string;
  vyrobni_cislo: string;
  aktualni_mth: number;
}

// Export service records to PDF
export async function exportServicesToPDF(
  services: ServiceRecord[],
  machine: MachineInfo
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Servisní kniha', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${machine.model}`, pageWidth / 2, 30, { align: 'center' });
  doc.text(`S/N: ${machine.vyrobni_cislo} | Aktuální MTH: ${machine.aktualni_mth}`, pageWidth / 2, 38, { align: 'center' });
  
  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(14, 45, pageWidth - 14, 45);
  
  // Table header
  let yPos = 55;
  const colWidths = [25, 20, 25, 75, 30];
  const headers = ['Datum', 'MTH', 'Typ', 'Popis', 'Technik'];
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  let xPos = 14;
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos);
    xPos += colWidths[i];
  });
  
  yPos += 3;
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 7;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  for (const service of services) {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    xPos = 14;
    const date = new Date(service.datum_servisu).toLocaleDateString('cs-CZ');
    const row = [
      date,
      service.mth_pri_servisu.toFixed(1),
      service.typ_zasahu,
      service.popis.substring(0, 50) + (service.popis.length > 50 ? '...' : ''),
      service.provedl_osoba
    ];
    
    row.forEach((cell, i) => {
      doc.text(String(cell), xPos, yPos, { maxWidth: colWidths[i] - 2 });
      xPos += colWidths[i];
    });
    
    yPos += 8;
  }
  
  // Footer with generation date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Vygenerováno: ${new Date().toLocaleString('cs-CZ')} | Strana ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save file
  doc.save(`servisni-kniha-${machine.vyrobni_cislo}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export service records to Excel
export function exportServicesToExcel(
  services: ServiceRecord[],
  machine: MachineInfo
): void {
  // Prepare data
  const data = services.map(s => ({
    'Datum': new Date(s.datum_servisu).toLocaleDateString('cs-CZ'),
    'MTH': s.mth_pri_servisu,
    'Typ zásahu': s.typ_zasahu,
    'Popis': s.popis,
    'Technik': s.provedl_osoba,
    'Firma': s.provedla_firma || '',
    'Areál': s.arealy?.nazev || '',
    'Náklady (Kč)': s.naklady || ''
  }));
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Datum
    { wch: 8 },  // MTH
    { wch: 14 }, // Typ
    { wch: 50 }, // Popis
    { wch: 20 }, // Technik
    { wch: 20 }, // Firma
    { wch: 25 }, // Areál
    { wch: 12 }, // Náklady
  ];
  
  // Add header info
  XLSX.utils.sheet_add_aoa(ws, [
    [`Servisní kniha - ${machine.model}`],
    [`S/N: ${machine.vyrobni_cislo} | Aktuální MTH: ${machine.aktualni_mth}`],
    [`Vygenerováno: ${new Date().toLocaleString('cs-CZ')}`],
    []
  ], { origin: 'A1' });
  
  // Shift data down
  const dataWithHeaders = XLSX.utils.sheet_to_json(ws, { header: 1 });
  XLSX.utils.book_append_sheet(wb, ws, 'Servisní záznamy');
  
  // Save file
  XLSX.writeFile(wb, `servisni-kniha-${machine.vyrobni_cislo}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Export GPS route to GPX format
export function exportGPXRoute(
  routeName: string,
  points: Array<{ lat: number; lon: number; time?: string; ele?: number }>
): void {
  const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="e-ManuAI" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${routeName}</name>
    <time>${new Date().toISOString()}</time>
    <desc>GPS trasa exportovaná z e-ManuAI</desc>
  </metadata>
  <trk>
    <name>${routeName}</name>
    <trkseg>
${points.map(p => `      <trkpt lat="${p.lat}" lon="${p.lon}">
${p.ele ? `        <ele>${p.ele}</ele>` : ''}
${p.time ? `        <time>${p.time}</time>` : ''}
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${routeName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export areas to Excel
export function exportAreasToExcel(
  areas: Array<{
    nazev: string;
    typ: string;
    plocha_m2: number | null;
    obvod_oploceni_m: number | null;
    gps_latitude: number | null;
    gps_longitude: number | null;
    okres: string | null;
    kategorie_travnate_plochy: string | null;
  }>
): void {
  const data = areas.map(a => ({
    'Název': a.nazev,
    'Typ': a.typ,
    'Plocha (m²)': a.plocha_m2 || '',
    'Oplocení (bm)': a.obvod_oploceni_m || '',
    'GPS Latitude': a.gps_latitude || '',
    'GPS Longitude': a.gps_longitude || '',
    'Okres': a.okres || '',
    'Kategorie TZ': a.kategorie_travnate_plochy || ''
  }));
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Areály');
  XLSX.writeFile(wb, `arealy-${new Date().toISOString().split('T')[0]}.xlsx`);
}
