import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Exportación a Excel/PDF para los módulos financieros (requisito
// transversal de la especificación). Ambas funciones reciben las mismas
// columnas + filas ya formateadas para mostrar (strings listas para
// imprimir, no números crudos) para que lo que se exporta sea idéntico a
// lo que se ve en pantalla.
export interface ExportColumn {
  key: string;
  label: string;
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  columns: ExportColumn[],
  rows: Record<string, string | number>[],
) {
  const formatted = rows.map((row) =>
    Object.fromEntries(columns.map((c) => [c.label, row[c.key] ?? ''])),
  );
  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: Record<string, string | number>[],
  subtitle?: string,
) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(subtitle, 14, 21);
  }
  autoTable(doc, {
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
    startY: subtitle ? 26 : 20,
    headStyles: { fillColor: [234, 88, 12] },
    styles: { fontSize: 9 },
  });
  doc.save(`${filename}.pdf`);
}
