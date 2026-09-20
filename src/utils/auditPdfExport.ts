import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { AuditLog } from '../types';

const logoUrl = '/images/logo.png';

export const exportAuditPDF = async (auditLogs: AuditLog[], userName: string) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape layout
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Sort from newest to oldest
  const sortedLogs = [...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let y = 35;
  let itemsOnPage = 0;

  let logoImg: HTMLImageElement | null = null;
  try {
     logoImg = new Image();
     logoImg.crossOrigin = "Anonymous";
     logoImg.src = logoUrl;
     await new Promise((resolve, reject) => {
        logoImg!.onload = resolve;
        logoImg!.onerror = reject;
     });
  } catch(e) {
     logoImg = null;
  }

  // Draw header row
  const drawTableHeader = (startY: number) => {
    pdf.setFillColor(71, 85, 105); // slate-600
    pdf.rect(10, startY, pageWidth - 20, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    pdf.text('FECHA Y HORA', 15, startY + 5);
    pdf.text('USUARIO', 50, startY + 5);
    pdf.text('ÁREA', 90, startY + 5);
    pdf.text('DETALLE / ACCIÓN', 125, startY + 5);
    
    return startY + 8;
  };

  y = drawTableHeader(y);

  if (sortedLogs.length === 0) {
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('No hay registros de auditoría para exportar.', 15, y + 15);
  }

  sortedLogs.forEach((log, i) => {
    // Set font before measurement to get accurate line wrapping
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Clean string of emojis for jsPDF Helvetica support
    const cleanDetails = (log.details || 'N/A').replace(/➡️/g, '->');
    
    // The details text can be long, so we substring it or do basic multi-line
    const detailsLines = pdf.splitTextToSize(cleanDetails, 155);
    let entryHeight = 6 + (detailsLines.length * 4); // basic dynamic height calculation
    
    if (y + entryHeight > 190) { // Check bounds for landscape
      pdf.addPage();
      y = 35;
      itemsOnPage = 0;
      y = drawTableHeader(y);
    }
    
    // Alternating background
    if (i % 2 === 0) {
       pdf.setFillColor(248, 250, 252); // slate-50
       pdf.rect(10, y, pageWidth - 20, entryHeight, 'F');
    }

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(8);
    
    // Date
    pdf.setFont('helvetica', 'bold');
    pdf.text(format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'), 15, y + 6);
    
    // User
    pdf.setFont('helvetica', 'normal');
    pdf.text((log.user || 'N/A').substring(0, 20), 50, y + 6);
    
    // Info collection
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.text((log.collection || 'General').toUpperCase().substring(0, 15), 90, y + 6);
    
    // Details
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'normal');
    pdf.text(detailsLines, 125, y + 6);
    
    y += entryHeight;
    itemsOnPage++;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    // Header
    pdf.setDrawColor(71, 85, 105);
    pdf.setLineWidth(0.5);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, 10, pageWidth - 20, 20, 4, 4, 'FD');

    if (logoImg) {
       const logoW = 45;
       const aspect = logoImg.height / logoImg.width;
       const logoH = logoW * aspect;
       pdf.addImage(logoImg, 'PNG', 15, 20 - logoH / 2, logoW, logoH); 
    }

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`REPORTE DE AUDITORÍA Y REGISTROS`, 65, 18);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')} por ${userName}`, 65, 24);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${sortedLogs.length} Registros`, pageWidth - 40, 22);

    // Footer Page Number
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 15, 200, { align: 'right' });
  }

  pdf.save(`auditoria_${format(new Date(), 'ddMMyyyy_HHmmss')}.pdf`);
};
