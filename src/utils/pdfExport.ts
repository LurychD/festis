import { jsPDF } from 'jspdf';
import { startOfDay, endOfDay, format } from 'date-fns';
import { Festival, FestivalStatus } from '../types';
import { parseFestivalDate } from './helpers';
const logoUrl = '/images/logo.png';

export interface PDFExportOptions {
  pageSize: 'a4' | 'a3' | 'legal';
  orientation: 'p' | 'l';
  sortBy: 'normal' | 'estado' | 'fecha';
  includeObservations: boolean;
  includeStatusHistory?: boolean;
  onlyPendingToSubmit?: boolean;
}

const isDeadlineOpen = (deadlineStr: string | undefined | null): boolean => {
  if (!deadlineStr) return false;
  const parsedDeadline = parseFestivalDate(deadlineStr);
  if (!parsedDeadline) return false;
  const todayStart = startOfDay(new Date());
  const deadlineEnd = endOfDay(parsedDeadline);
  return deadlineEnd >= todayStart;
};

export const exportPDF = async (festivals: Festival[], userName: string, options?: PDFExportOptions) => {
  const pageSize = options?.pageSize || 'a4';
  const orientation = options?.orientation || 'p';
  const includeObs = options ? options.includeObservations : true;

  let processedFestivals = [...festivals];
  if (options?.onlyPendingToSubmit) {
    processedFestivals = processedFestivals.filter(f => {
      const isPendingStatus = f.status === FestivalStatus.POR_ENVIAR || 
                              f.status === FestivalStatus.PROXIMAMENTE || 
                              f.status === FestivalStatus.EN_DUDA ||
                              f.status === FestivalStatus.EN_REVISION;
      if (!isPendingStatus) return false;
      return isDeadlineOpen(f.deadline);
    });
  }

  const pdf = new jsPDF(orientation, 'mm', pageSize);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 20;

  // Helper for colors
  const getStatusPdfColor = (status: FestivalStatus): {bg: [number, number, number], text: [number, number, number]} => {
    switch(status) {
      case FestivalStatus.POR_ENVIAR: return { bg: [254, 226, 226], text: [185, 28, 28] };
      case FestivalStatus.PROXIMAMENTE: return { bg: [250, 232, 255], text: [162, 28, 175] };
      case FestivalStatus.EN_REVISION: return { bg: [255, 237, 213], text: [194, 65, 12] };
      case FestivalStatus.SELECCIONADO: return { bg: [224, 242, 254], text: [3, 105, 161] };
      case FestivalStatus.NO_SELECCIONADO: return { bg: [255, 228, 230], text: [190, 18, 60] };
      case FestivalStatus.PROYECTADO: return { bg: [224, 231, 255], text: [67, 56, 202] };
      case FestivalStatus.GANADO: return { bg: [254, 249, 195], text: [161, 98, 7] };
      case FestivalStatus.EN_DUDA: return { bg: [237, 233, 254], text: [109, 40, 217] };
      case FestivalStatus.DESCALIFICADO: return { bg: [226, 232, 240], text: [51, 65, 85] };
      default: return { bg: [241, 245, 249], text: [71, 85, 105] };
    }
  };

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

  // Compute stats
  const totals = processedFestivals.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statsText = [
    `${processedFestivals.length} Total`,
    totals[FestivalStatus.GANADO] ? `(${totals[FestivalStatus.GANADO]}) Ganados` : '',
    totals[FestivalStatus.SELECCIONADO] ? `(${totals[FestivalStatus.SELECCIONADO]}) Seleccionados` : '',
    totals[FestivalStatus.PROYECTADO] ? `(${totals[FestivalStatus.PROYECTADO]}) Proyectados` : '',
    totals[FestivalStatus.EN_REVISION] ? `(${totals[FestivalStatus.EN_REVISION]}) En Revisión` : '',
    totals[FestivalStatus.PROXIMAMENTE] ? `(${totals[FestivalStatus.PROXIMAMENTE]}) Próximamente` : '',
    totals[FestivalStatus.EN_DUDA] ? `(${totals[FestivalStatus.EN_DUDA]}) En Duda` : '',
    totals[FestivalStatus.POR_ENVIAR] ? `(${totals[FestivalStatus.POR_ENVIAR]}) Por Enviar` : '',
    totals[FestivalStatus.NO_SELECCIONADO] ? `(${totals[FestivalStatus.NO_SELECCIONADO]}) No Seleccionados` : '',
    totals[FestivalStatus.DESCALIFICADO] ? `(${totals[FestivalStatus.DESCALIFICADO]}) Descalificados` : '',
  ].filter(Boolean).join('  |  ');

  y = 35;
  let itemsOnPage = 0;
  
  // Exact sorting requirement
  const statusOrderArray = [
     FestivalStatus.POR_ENVIAR,
     FestivalStatus.EN_REVISION,
     FestivalStatus.SELECCIONADO,
     FestivalStatus.PROYECTADO,
     FestivalStatus.GANADO,
     FestivalStatus.PROXIMAMENTE,
      FestivalStatus.EN_DUDA,
     FestivalStatus.NO_SELECCIONADO,
     FestivalStatus.DESCALIFICADO
  ];
  let sortedFestivals = [...processedFestivals];
  
  const sortBy = options?.sortBy || 'normal';
  if (sortBy === 'normal' || sortBy === 'estado') {
    sortedFestivals.sort((a,b) => statusOrderArray.indexOf(a.status) - statusOrderArray.indexOf(b.status));
  } else if (sortBy === 'fecha') {
    sortedFestivals.sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    });
  }

  // Helper to draw pill
  const drawPill = (label: string, value: string, px: number, py: number, width: number) => {
     pdf.setDrawColor(203, 213, 225); // slate-300 light outline
     pdf.roundedRect(px, py - 3, width, 5, 2, 2, 'S'); // Outline only

     pdf.setFontSize(5);
     pdf.setFont('helvetica', 'bold');
     pdf.setTextColor(100, 116, 139);
     pdf.text(label, px + 2, py);

     pdf.setFont('helvetica', 'normal');
     pdf.setTextColor(51, 71, 86);
     
     const labelWidth = pdf.getTextWidth(label);
     const availableWidth = width - 4 - labelWidth;
     
     let displayValue = value;
     if (pdf.getTextWidth(displayValue) > availableWidth) {
       while (displayValue.length > 0 && pdf.getTextWidth(displayValue + '...') > availableWidth) {
         displayValue = displayValue.slice(0, -1);
       }
       displayValue = displayValue + '...';
     }
     
     pdf.text(displayValue, px + 2 + labelWidth + 1, py);
  };

  sortedFestivals.forEach((f, i) => {
    const hasObs = includeObs && f.observations;
    const hasHistory = (options?.includeStatusHistory !== false) && f.statusHistory && f.statusHistory.length > 0;
    
    let entryHeight = 16;
    if (hasObs) entryHeight += 5;
    if (hasHistory) entryHeight += 5;
    
    if (y + entryHeight > pageHeight - 12) {
      pdf.addPage();
      y = 35;
      itemsOnPage = 0;
    }

    const colors = getStatusPdfColor(f.status);
    
    // Draw card background
    pdf.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    pdf.roundedRect(10, y, pageWidth - 20, entryHeight, 3, 3, 'F'); // Rounder borders

    // Draw left accent bar (keeping it slightly inside to maintain roundness, or just standard rect on the edge)
    pdf.setFillColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.roundedRect(10, y, 4, entryHeight, 1.5, 1.5, 'F');
    pdf.rect(12, y, 2, entryHeight, 'F');

    // TITLE
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const titleStr = `${i + 1}. ${f.name.toUpperCase()}`.substring(0, 60);
    pdf.text(titleStr, 17, y + 4);
    const titleWidth = pdf.getTextWidth(titleStr);
    
    // TYPE
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    const typeStartX = 17 + titleWidth + 3;
    pdf.text(`${f.type || 'S/D'}`, typeStartX, y + 4);

    // COUNTRY
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    const typeWidth = pdf.getTextWidth(f.type || 'S/D');
    pdf.text(`| ${f.country || 'S/D'}`, typeStartX + typeWidth + 9, y + 4);

    // STATUS (Moved to top right edge)
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    const statusVal = f.status.toUpperCase();
    const statusWidth = pdf.getTextWidth(statusVal);
    const rightMargin = pageWidth - 15;
    const estadoLabelX = rightMargin - statusWidth - 14;
    pdf.setTextColor(100, 116, 139);
    pdf.text(`ESTADO:`, estadoLabelX, y + 4);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(statusVal, rightMargin - statusWidth, y + 4);

    // PILLS (Row 2) - Categoría, Plataforma, Fee
    drawPill('CAT:', (f.category || 'N/A').substring(0, 25), 17, y + 9, 50);
    drawPill('PLAT:', (f.platform || 'N/A').substring(0, 20), 70, y + 9, 45);
    drawPill('FEE:', f.price || 'Gratis', 118, y + 9, 25);
    
    if (f.link) {
       pdf.setFontSize(5);
       pdf.setTextColor(0, 0, 255);
       pdf.textWithLink('🔗 Link', 147, y + 9, { url: f.link });
       pdf.setTextColor(100, 116, 139);
    }

    // PILLS (Row 3) - News, Nomination, Projection
    drawPill('NOTICIA:', f.newsDate || 'N/A', 17, y + 14, 35);
    drawPill('NOMINACIÓN:', (f.nomination || 'N/A').substring(0, 20), 55, y + 14, 45);
    
    const projStr = `${f.projectionDate || ''} ${f.projectionLocation || ''}`.trim();
    if (projStr) {
       drawPill('PROY:', f.projectionDate || 'N/A', 103, y + 14, 35);
       if (f.projectionLocation) {
           pdf.setFontSize(5);
           pdf.setTextColor(0, 0, 255);
           pdf.textWithLink('Lugar de proyección', 140, y + 14, { url: `https://maps.google.com/?q=${encodeURIComponent(f.projectionLocation)}`});
           pdf.setTextColor(100, 116, 139);
       }
    }

    let currentRowY = y + 19;

    // OBSERVATIONS (Optional Row 4)
    if (hasObs) {
       drawPill('OBS:', f.observations!, 17, currentRowY, 140); 
       currentRowY += 5;
    }

    // STATUS HISTORY (Optional Row 5)
    if (hasHistory) {
       const historyTrace = f.statusHistory!
         .map((h) => {
            const dt = h.timestamp ? format(new Date(h.timestamp), 'dd/MM') : '';
            return `${h.status}${dt ? ` (${dt})` : ''}${h.note ? ` [${h.note}]` : ''}`;
         })
         .join(' → ');
       drawPill('TRAZABILIDAD:', historyTrace, 17, currentRowY, 140);
    }
    
    // Draw CIERRE pill aligned to the right
    const bottomY = entryHeight >= 21 ? y + entryHeight - 2 : y + 14;
    drawPill('CIERRE:', f.deadline || 'S/D', rightMargin - 35, bottomY, 35);

    y += (entryHeight + 2);
    itemsOnPage++;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    // Header
    pdf.setDrawColor(233, 30, 99);
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
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    const headerTitle = options?.onlyPendingToSubmit
      ? `INFORME DE CONVOCATORIAS ABIERTAS`
      : `INFORME DE DISTRIBUCIÓN DE FESTIVALES`;
    pdf.text(headerTitle, 65, 16);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')} por ${userName}`, 65, 21);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text(statsText, 65, 26, { maxWidth: pageWidth - 75 });

    // Footer Page Number
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 15, pageHeight - 7, { align: 'right' });
  }

  pdf.save(`cardigan_reporte_${format(new Date(), 'ddMMyyyy_HHmmss')}.pdf`);
};
