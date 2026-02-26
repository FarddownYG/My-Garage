import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Vehicle, MaintenanceEntry } from '../types';
import { formatDate } from './formatDate';

const maintenanceTypeLabels: Record<string, string> = {
  oil: 'Vidange',
  tires: 'Pneus',
  brakes: 'Freins',
  filter: 'Filtre',
  battery: 'Batterie',
  inspection: 'Contrôle technique',
  other: 'Autre',
};

/**
 * Word-wrap text to fit within a max character width per line.
 * Splits on spaces when possible, hard-breaks long words.
 */
function wrapText(text: string, maxCharsPerLine: number): string {
  if (!text || text.length <= maxCharsPerLine) return text;

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    // If a single word is longer than maxChars, hard-break it
    if (word.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
      for (let i = 0; i < word.length; i += maxCharsPerLine) {
        lines.push(word.substring(i, i + maxCharsPerLine));
      }
      continue;
    }

    if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.join('\n');
}

export function exportMaintenancePdf(
  vehicle: Vehicle,
  entries: MaintenanceEntry[],
  lang: 'fr' | 'en' = 'fr'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const isFr = lang === 'fr';
  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const marginL = 14;
  const marginR = 14;
  const usableWidth = pageWidth - marginL - marginR; // 182

  // Column widths (must sum to usableWidth)
  const colDate = 22;
  const colType = 34;
  const colKm = 24;
  const colCost = 20;
  const colNotes = usableWidth - colDate - colType - colKm - colCost; // 82

  // Header background
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Title
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(22);
  doc.text(isFr ? "Carnet d'Entretien" : 'Maintenance Log', marginL, 20);

  // Vehicle name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(vehicle.name, marginL, 30);

  // Vehicle info line
  doc.setTextColor(150, 150, 170);
  doc.setFontSize(9);
  const infoLine = [
    vehicle.brand,
    vehicle.model,
    vehicle.year?.toString(),
    vehicle.licensePlate,
    `${vehicle.mileage.toLocaleString()} km`,
  ].filter(Boolean).join(' | ');
  doc.text(infoLine, marginL, 37);

  // Generation date
  doc.setTextColor(100, 100, 120);
  doc.setFontSize(8);
  const genDate = `${isFr ? 'Généré le' : 'Generated on'} ${new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  doc.text(genDate, pageWidth - marginR - doc.getTextWidth(genDate), 37);

  // Sort entries by date descending
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) {
    doc.setTextColor(100, 100, 120);
    doc.setFontSize(12);
    doc.text(isFr ? 'Aucun entretien enregistré' : 'No maintenance recorded', pageWidth / 2, 70, { align: 'center' });
  } else {
    const headers = [[
      isFr ? 'Date' : 'Date',
      isFr ? 'Type' : 'Type',
      isFr ? 'Km' : 'Mileage',
      isFr ? 'Coût' : 'Cost',
      isFr ? 'Notes' : 'Notes',
    ]];

    // ~40 chars fit in 82mm at fontSize 8
    const maxNoteChars = 38;

    const rows = sorted.map(entry => [
      formatDate(entry.date),
      wrapText(entry.customType || maintenanceTypeLabels[entry.type] || entry.type, 18),
      `${entry.mileage.toLocaleString()} km`,
      entry.cost ? `${entry.cost.toFixed(2)} €` : '-',
      wrapText(entry.notes || '-', maxNoteChars),
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 52,
      margin: { top: marginL, right: marginR, bottom: 20, left: marginL },
      tableWidth: usableWidth,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 30, 40],
        lineColor: [200, 200, 210],
        lineWidth: 0.2,
        overflow: 'ellipsize',
        minCellHeight: 8,
      },
      headStyles: {
        fillColor: [34, 211, 238],
        textColor: [10, 10, 15],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250],
      },
      columnStyles: {
        0: { cellWidth: colDate, halign: 'center' },
        1: { cellWidth: colType, halign: 'left' },
        2: { cellWidth: colKm, halign: 'right' },
        3: { cellWidth: colCost, halign: 'right' },
        4: { cellWidth: colNotes, halign: 'left' },
      },
    });

    // Total cost
    const totalCost = sorted.reduce((sum, e) => sum + (e.cost || 0), 0);
    if (totalCost > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFillColor(240, 240, 245);
      doc.roundedRect(marginL, finalY + 8, usableWidth, 14, 3, 3, 'F');
      doc.setTextColor(30, 30, 40);
      doc.setFontSize(10);
      doc.text(`${isFr ? 'Total des coûts' : 'Total costs'} : ${totalCost.toFixed(2)} €`, marginL + 6, finalY + 17);
      doc.text(`${sorted.length} ${isFr ? 'entretien(s)' : 'maintenance(s)'}`, pageWidth - marginR - 6, finalY + 17, { align: 'right' });
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 170);
    doc.setFontSize(7);
    doc.text("Valcar - Carnet d'entretien", marginL, 290);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - marginR, 290, { align: 'right' });
  }

  // Save
  const fileName = `carnet-entretien-${vehicle.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
