import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Festival, FestivalStatus } from '../types';
import { formatDisplayDate } from './helpers';

const logoUrl = '/images/logo.png';

export const exportProjectionsPDF = async (festivals: Festival[], userName: string) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fitting
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  const projectionsList = festivals.filter(f => f.projectionDate || f.status === FestivalStatus.PROYECTADO || f.status === FestivalStatus.GANADO);

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
    pdf.setFillColor(245, 158, 11); // amber-500
    pdf.rect(10, startY, pageWidth - 20, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    pdf.text('FESTIVAL', 15, startY + 5);
    pdf.text('FECHA', 75, startY + 5);
    pdf.text('LOCACIÓN', 105, startY + 5);
    pdf.text('CATEGORÍA', 165, startY + 5);
    pdf.text('NOMINACIÓN / PREMIO', 215, startY + 5);
    
    return startY + 8;
  };

  y = drawTableHeader(y);

  if (projectionsList.length === 0) {
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('No hay proyecciones registradas para exportar.', 15, y + 15);
  }

  projectionsList.forEach((f, i) => {
    let entryHeight = 10;
    
    if (y + entryHeight > 190) { // Check bounds for landscape
      pdf.addPage();
      y = 35;
      itemsOnPage = 0;
      y = drawTableHeader(y);
    }
    
    // Alternating background
    if (i % 2 === 0) {
       pdf.setFillColor(254, 252, 232); // amber-50
       pdf.rect(10, y, pageWidth - 20, entryHeight, 'F');
    }

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(f.name.substring(0, 45), 15, y + 6);
    
    pdf.setFont('helvetica', 'normal');
    const displayDate = f.projectionDate ? formatDisplayDate(f.projectionDate).split(' - ')[0] : 'A confirmar';
    pdf.text(displayDate, 75, y + 6);
    
    const locText = (f.projectionLocation || 'A confirmar').substring(0, 40);
    if (f.projectionLocation) {
        pdf.setTextColor(59, 130, 246); // text-blue-500
        pdf.textWithLink(locText, 105, y + 6, { url: `https://maps.google.com/?q=${encodeURIComponent(f.projectionLocation)}` });
    } else {
        pdf.text(locText, 105, y + 6);
    }
    
    pdf.setTextColor(30, 41, 59);
    pdf.text((f.category || 'N/A').substring(0, 30), 165, y + 6);
    
    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.text((f.nomination || 'N/A').substring(0, 45), 215, y + 6);
    
    y += entryHeight;
    itemsOnPage++;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    // Header
    pdf.setDrawColor(245, 158, 11);
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
    pdf.text(`REPORTE DE PROYECCIONES DE FESTIVALES`, 65, 18);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')} por ${userName}`, 65, 24);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(245, 158, 11);
    pdf.text(`${projectionsList.length} Proyecciones Registradas`, pageWidth - 60, 22);

    // Footer Page Number
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 15, 200, { align: 'right' });
  }

  pdf.save(`proyecciones_${format(new Date(), 'ddMMyyyy_HHmmss')}.pdf`);
};
