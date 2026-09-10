import jsPDF from 'jspdf';
import type { CotizacionIcono, CotizacionLineaInput, CotizacionTotales } from '@erp-afuego/shared';
import { formatCOP } from './format';

// Genera el PDF de una cotización con el mismo diseño de la plantilla de
// referencia de A Fuego (papel kraft, ilustración esquemática, tabla de
// ítems + logística, totales, condiciones comerciales y firma del
// vendedor). Recibe datos "planos" en vez del DTO completo para poder
// generar el PDF también como vista previa desde el formulario, antes de
// guardar la cotización.
export interface CotizacionPdfData {
  fecha: string;
  asunto: string;
  lugar: string;
  numeroPersonas: number;
  clienteNombre: string;
  items: CotizacionLineaInput[];
  logistica: CotizacionLineaInput[];
  totales: CotizacionTotales;
  condicionesComerciales: string;
  vendedorNombre: string;
  taxRateNombre: string | null;
  icono?: CotizacionIcono | null;
}

const COLOR_KRAFT: [number, number, number] = [240, 230, 210];
const COLOR_INK: [number, number, number] = [28, 25, 23];
const COLOR_ORANGE: [number, number, number] = [234, 88, 12];
const COLOR_MUTED: [number, number, number] = [110, 100, 90];

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function money(value: number): string {
  return formatCOP(value).replace('COP', '').trim();
}

export async function generateCotizacionPDF(data: CotizacionPdfData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Fondo kraft + marco delgado, mismo lenguaje visual que las tarjetas
  // ilustradas de la carta.
  doc.setFillColor(...COLOR_KRAFT);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.4);
  doc.rect(margin - 4, margin - 4, pageW - (margin - 4) * 2, pageH - (margin - 4) * 2);

  let cursorY = margin + 4;

  // --- Encabezado: logo + datos del evento ---
  const logoDataUrl = await urlToDataUrl('/logo-black.png');
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin, cursorY, 26, 12);
    } catch {
      // si la imagen no carga, seguimos sin logo — nunca bloquea el PDF
    }
  }

  const headerLabelX = pageW - margin - 80;
  const headerValueX = pageW - margin - 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_ORANGE);
  doc.text('FECHA:', headerLabelX, cursorY + 4);
  doc.text('ASUNTO:', headerLabelX, cursorY + 9);
  doc.text('LUGAR:', headerLabelX, cursorY + 16);
  doc.text('INVITADOS:', headerLabelX, cursorY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_INK);
  const fechaTexto = new Date(`${data.fecha}T00:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(fechaTexto, headerValueX, cursorY + 4);
  doc.text(data.asunto, headerValueX, cursorY + 9, { maxWidth: pageW - margin - headerValueX });
  doc.text(data.lugar, headerValueX, cursorY + 16);
  doc.text(`${data.numeroPersonas} personas`, headerValueX, cursorY + 21);

  cursorY += 28;
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.2);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 8;

  // --- Columna izquierda: propuesta + ilustración + descripción ---
  const leftW = 62;
  const leftX = margin;
  let leftY = cursorY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_ORANGE);
  doc.text('PROPUESTA', leftX, leftY);
  leftY += 6;

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(15);
  doc.setTextColor(...COLOR_INK);
  const asuntoLines = doc.splitTextToSize(data.asunto, leftW);
  doc.text(asuntoLines, leftX, leftY);
  leftY += asuntoLines.length * 6 + 3;

  if (data.icono) {
    const iconDataUrl = await urlToDataUrl(`/cotizacion-icons/${data.icono}.png`);
    if (iconDataUrl) {
      const size = leftW;
      doc.setDrawColor(...COLOR_INK);
      doc.setLineWidth(0.3);
      doc.rect(leftX, leftY, size, size);
      try {
        doc.addImage(iconDataUrl, 'PNG', leftX + 3, leftY + 3, size - 6, size - 6);
      } catch {
        // si la imagen no carga, dejamos el marco vacío
      }
      leftY += size + 6;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_ORANGE);
  doc.text('DESCRIPCIÓN', leftX, leftY);
  leftY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_INK);
  const descripcionTexto = data.items.map((i) => i.descripcion).join('. ');
  const descLines = doc.splitTextToSize(descripcionTexto, leftW);
  doc.text(descLines, leftX, leftY);
  leftY += descLines.length * 4.5;

  // --- Columna derecha: tabla de ítems + logística + totales ---
  const rightX = margin + leftW + 10;
  const rightW = pageW - margin - rightX;
  let rightY = cursorY;

  // Columnas numéricas alineadas a la derecha, con espacio fijo reservado
  // para cada una (antes CANT y VR UND quedaban casi en la misma posición
  // y el texto se encimaba).
  const colVrTotalX = rightX + rightW;
  const colVrUndX = colVrTotalX - 32;
  const colCantX = colVrUndX - 24;
  const descripcionMaxWidth = colCantX - rightX - 12;

  function tableHeader(title: string) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_INK);
    doc.text(title.toUpperCase(), rightX, rightY);
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_MUTED);
    doc.text('CANT', colCantX, rightY, { align: 'right' });
    doc.text('VR UND', colVrUndX, rightY, { align: 'right' });
    doc.text('VR TOTAL', colVrTotalX, rightY, { align: 'right' });
    rightY += 4;
    doc.setDrawColor(...COLOR_MUTED);
    doc.setLineWidth(0.1);
    doc.line(rightX, rightY, rightX + rightW, rightY);
    rightY += 4;
  }

  function tableRows(lineas: CotizacionLineaInput[]) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_INK);
    for (const linea of lineas) {
      const nombreLines = doc.splitTextToSize(linea.descripcion, descripcionMaxWidth);
      doc.text(nombreLines, rightX, rightY);
      doc.text(String(linea.cantidad), colCantX, rightY, { align: 'right' });
      doc.text(money(linea.valorUnitario), colVrUndX, rightY, { align: 'right' });
      doc.text(money(linea.cantidad * linea.valorUnitario), colVrTotalX, rightY, {
        align: 'right',
      });
      rightY += Math.max(5, nombreLines.length * 4.2);
    }
  }

  function subtotalRow(label: string, valor: number) {
    doc.setDrawColor(...COLOR_MUTED);
    doc.setLineWidth(0.1);
    doc.line(rightX, rightY, rightX + rightW, rightY);
    rightY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(label, rightX, rightY);
    doc.text(money(valor), rightX + rightW, rightY, { align: 'right' });
    rightY += 7;
  }

  tableHeader(data.asunto);
  tableRows(data.items);
  subtotalRow('SUB-TOTAL', data.totales.subtotalItems);

  if (data.logistica.length > 0) {
    tableHeader('Logística');
    tableRows(data.logistica);
    subtotalRow('SUB-TOTAL', data.totales.subtotalLogistica);
  }

  // Caja de totales, alineada a la derecha.
  rightY += 2;
  const boxW = 62;
  const boxX = rightX + rightW - boxW;
  const boxLineH = 6;
  const boxH = boxLineH * 3 + 4;
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.3);
  doc.rect(boxX, rightY, boxW, boxH);

  let boxY = rightY + boxLineH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('SUBTOTAL', boxX + 3, boxY);
  doc.text(money(data.totales.subtotal), boxX + boxW - 3, boxY, { align: 'right' });
  boxY += boxLineH;

  const impuestoLabel = data.taxRateNombre ? data.taxRateNombre.toUpperCase() : 'IMPUESTO';
  doc.text(impuestoLabel, boxX + 3, boxY);
  doc.text(money(data.totales.impuestoValor), boxX + boxW - 3, boxY, { align: 'right' });
  boxY += boxLineH;

  doc.setFillColor(...COLOR_ORANGE);
  doc.rect(boxX, boxY - boxLineH + 2, boxW, boxLineH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', boxX + 3, boxY);
  doc.text(money(data.totales.total), boxX + boxW - 3, boxY, { align: 'right' });
  doc.setTextColor(...COLOR_INK);

  rightY += boxH + 8;
  leftY = Math.max(leftY, rightY);

  // --- Condiciones comerciales ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_ORANGE);
  doc.text('Condiciones comerciales:', margin, leftY);
  leftY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_INK);
  const condicionesLineas = data.condicionesComerciales.split('\n').filter((l) => l.trim());
  for (const linea of condicionesLineas) {
    const wrapped = doc.splitTextToSize(`• ${linea.trim()}`, pageW - margin * 2);
    doc.text(wrapped, margin, leftY);
    leftY += wrapped.length * 4.2;
  }

  // --- Firma ---
  const firmaY = pageH - margin - 22;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_INK);
  doc.text(data.vendedorNombre, pageW / 2, firmaY, { align: 'center' });
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.2);
  doc.line(pageW / 2 - 30, firmaY + 2, pageW / 2 + 30, firmaY + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Ventas', pageW / 2, firmaY + 6, { align: 'center' });

  // --- Pie de página ---
  const footerY = pageH - margin - 4;
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.1);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_ORANGE);
  const colW = (pageW - margin * 2) / 3;
  doc.text('TEL', margin + colW * 0.5, footerY, { align: 'center' });
  doc.text('IG', margin + colW * 1.5, footerY, { align: 'center' });
  doc.text('UBICACIÓN', margin + colW * 2.5, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_INK);
  doc.text('305 227 9193', margin + colW * 0.5, footerY + 4, { align: 'center' });
  doc.text('@afuego_eventos', margin + colW * 1.5, footerY + 4, { align: 'center' });
  doc.text('Carrera 30 # 1 sur 28, Loma de Los Parra', margin + colW * 2.5, footerY + 4, {
    align: 'center',
    maxWidth: colW,
  });

  const nombreArchivo = `cotizacion_${data.clienteNombre.replace(/\s+/g, '_')}_${data.fecha}.pdf`;
  doc.save(nombreArchivo);
}
