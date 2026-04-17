// Export utilities for service records, areas, and GPS data
// jsPDF and ExcelJS are dynamically imported to avoid bundling in the main chunk

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

// Helper: trigger browser download from a Blob
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export service records to PDF
export async function exportServicesToPDF(
  services: ServiceRecord[],
  machine: MachineInfo
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
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

  doc.setLineWidth(0.5);
  doc.line(14, 45, pageWidth - 14, 45);

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

  doc.save(`servisni-kniha-${machine.vyrobni_cislo}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export service records to Excel (exceljs)
export async function exportServicesToExcel(
  services: ServiceRecord[],
  machine: MachineInfo
): Promise<void> {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Servisní záznamy');

  // Header rows
  ws.addRow([`Servisní kniha - ${machine.model}`]);
  ws.addRow([`S/N: ${machine.vyrobni_cislo} | Aktuální MTH: ${machine.aktualni_mth}`]);
  ws.addRow([`Vygenerováno: ${new Date().toLocaleString('cs-CZ')}`]);
  ws.addRow([]);

  // Column headers
  ws.addRow(['Datum', 'MTH', 'Typ zásahu', 'Popis', 'Technik', 'Firma', 'Areál', 'Náklady (Kč)']);

  // Data
  for (const s of services) {
    ws.addRow([
      new Date(s.datum_servisu).toLocaleDateString('cs-CZ'),
      s.mth_pri_servisu,
      s.typ_zasahu,
      s.popis,
      s.provedl_osoba,
      s.provedla_firma || '',
      s.arealy?.nazev || '',
      s.naklady || ''
    ]);
  }

  // Column widths
  ws.columns = [
    { width: 12 }, { width: 8 }, { width: 14 }, { width: 50 },
    { width: 20 }, { width: 20 }, { width: 25 }, { width: 12 },
  ];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `servisni-kniha-${machine.vyrobni_cislo}-${new Date().toISOString().split('T')[0]}.xlsx`);
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
  downloadBlob(blob, `${routeName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.gpx`);
}

// Export areas to Excel (exceljs)
export async function exportAreasToExcel(
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
): Promise<void> {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Areály');

  ws.addRow(['Název', 'Typ', 'Plocha (m²)', 'Oplocení (bm)', 'GPS Latitude', 'GPS Longitude', 'Okres', 'Kategorie TZ']);

  for (const a of areas) {
    ws.addRow([
      a.nazev,
      a.typ,
      a.plocha_m2 || '',
      a.obvod_oploceni_m || '',
      a.gps_latitude || '',
      a.gps_longitude || '',
      a.okres || '',
      a.kategorie_travnate_plochy || ''
    ]);
  }

  ws.columns = [
    { width: 30 }, { width: 12 }, { width: 12 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 10 }, { width: 12 },
  ];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `arealy-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ===== Areas mowing report (PDF protocol) =====
interface AreaReportRow {
  nazev: string;
  typ: string;
  plocha_m2: number | null;
  okres: string | null;
  status: 'done-today' | 'high' | 'medium' | 'ok' | 'never';
  daysSince: number | null;
  lastMowedAt: string | null;
  poznamky?: string | null;
}

const STATUS_LABELS: Record<AreaReportRow['status'], string> = {
  'done-today': 'Posekáno dnes',
  'ok': 'V pořádku',
  'medium': 'Střední priorita',
  'high': 'Vysoká priorita',
  'never': 'Nikdy neposekáno',
};

export async function exportAreasReportPDF(rows: AreaReportRow[]): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString('cs-CZ');

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Protokol o sečení areálů', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Datum: ${today}`, pageWidth / 2, 28, { align: 'center' });

  // Summary
  const doneToday = rows.filter(r => r.status === 'done-today').length;
  const high = rows.filter(r => r.status === 'high' || r.status === 'never').length;
  const totalArea = rows.reduce((s, r) => s + (r.plocha_m2 || 0), 0);
  const doneArea = rows.filter(r => r.status === 'done-today').reduce((s, r) => s + (r.plocha_m2 || 0), 0);

  doc.setFontSize(10);
  doc.text(`Celkem areálů: ${rows.length}`, 14, 40);
  doc.text(`Posekáno dnes: ${doneToday}`, 14, 46);
  doc.text(`Vysoká priorita: ${high}`, 14, 52);
  doc.text(`Plocha celkem: ${totalArea.toLocaleString('cs-CZ')} m² | Dnes: ${doneArea.toLocaleString('cs-CZ')} m²`, 14, 58);

  doc.setLineWidth(0.5);
  doc.line(14, 64, pageWidth - 14, 64);

  // Table header
  let yPos = 72;
  const colWidths = [55, 25, 25, 25, 30, 25];
  const headers = ['Areál', 'Typ', 'Plocha m²', 'Stav', 'Naposled', 'Dní'];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let xPos = 14;
  headers.forEach((h, i) => {
    doc.text(h, xPos, yPos);
    xPos += colWidths[i];
  });
  yPos += 3;
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const r of rows) {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    xPos = 14;
    const lastMowed = r.lastMowedAt ? new Date(r.lastMowedAt).toLocaleDateString('cs-CZ') : '—';
    const cells = [
      r.nazev.substring(0, 32),
      r.typ,
      r.plocha_m2?.toLocaleString('cs-CZ') ?? '—',
      STATUS_LABELS[r.status],
      lastMowed,
      r.daysSince != null ? String(r.daysSince) : '—',
    ];
    cells.forEach((c, i) => {
      doc.text(String(c), xPos, yPos, { maxWidth: colWidths[i] - 2 });
      xPos += colWidths[i];
    });
    yPos += 6;

    if (r.poznamky) {
      doc.setTextColor(110);
      doc.text(`  • ${r.poznamky.substring(0, 100)}`, 14, yPos, { maxWidth: pageWidth - 28 });
      doc.setTextColor(0);
      yPos += 5;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `e-ManuAI · Vygenerováno: ${new Date().toLocaleString('cs-CZ')} · Strana ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save(`protokol-arealy-${new Date().toISOString().split('T')[0]}.pdf`);
}
