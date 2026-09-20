import { jsPDF } from 'jspdf';
import { Festival, FestivalStatus } from '../types';
import { formatDisplayDate } from './helpers';

// Helper to extract a numeric price from a string (e.g. "$5 USD" -> 5)
const parsePrice = (priceStr?: string): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const exportStatsPDF = async (rawFestivals: Festival[], userName: string) => {
  const festivals = (rawFestivals || []).filter((f) => f.includeInStats !== false);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // ~297mm

  // Compute stats from active festivals
  const totalFests = festivals.length;

  // Submissions (anything that is sent, i.e., not draft/not open for future submission)
  const submissions = festivals.filter(f => 
    f.status !== FestivalStatus.POR_ENVIAR && 
    f.status !== FestivalStatus.PROXIMAMENTE && 
    f.status !== FestivalStatus.EN_DUDA
  );
  const totalSubmissions = submissions.length;

  // Selections
  const selections = festivals.filter(f => 
    f.status === FestivalStatus.SELECCIONADO || 
    f.status === FestivalStatus.PROYECTADO || 
    f.status === FestivalStatus.GANADO
  );
  const totalSelections = selections.length;

  // Wins
  const wins = festivals.filter(f => f.status === FestivalStatus.GANADO);
  const totalWins = wins.length;

  // Rates
  const selectionRate = totalSubmissions > 0 ? (totalSelections / totalSubmissions) * 100 : 0;
  const winRate = totalSelections > 0 ? (totalWins / totalSelections) * 100 : 0;

  // Financial metrics
  let totalCost = 0;
  let paidCount = 0;
  submissions.forEach(f => {
    const cost = parsePrice(f.price);
    if (cost > 0) {
      totalCost += cost;
      paidCount++;
    }
  });
  const avgCost = totalSubmissions > 0 ? totalCost / totalSubmissions : 0;

  // Platform Distribution
  const platformStats: { [name: string]: { submitted: number; selected: number } } = {};
  submissions.forEach(f => {
    const plat = f.platform || 'Directo / Propio';
    if (!platformStats[plat]) {
      platformStats[plat] = { submitted: 0, selected: 0 };
    }
    platformStats[plat].submitted++;
    if (f.status === FestivalStatus.SELECCIONADO || f.status === FestivalStatus.PROYECTADO || f.status === FestivalStatus.GANADO) {
      platformStats[plat].selected++;
    }
  });

  // Category Distribution
  const categoryStats: { [name: string]: { submitted: number; selected: number } } = {};
  submissions.forEach(f => {
    const cat = f.category || 'Sin Categoría';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { submitted: 0, selected: 0 };
    }
    categoryStats[cat].submitted++;
    if (f.status === FestivalStatus.SELECCIONADO || f.status === FestivalStatus.PROYECTADO || f.status === FestivalStatus.GANADO) {
      categoryStats[cat].selected++;
    }
  });

  // Country Distribution (Group by raw country field)
  const countryStats: { [name: string]: number } = {};
  submissions.forEach(f => {
    let c = f.country || 'No Especificado';
    // Clean up to keep just the country name if it's "City, Country"
    if (c.includes(',')) {
      c = c.split(',').pop()!.trim();
    }
    countryStats[c] = (countryStats[c] || 0) + 1;
  });
  const sortedCountries = Object.entries(countryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5

  // Draw Header
  const drawHeader = () => {
    // Elegant Indigo / Slate top highlight
    pdf.setFillColor(79, 70, 229); // indigo-600
    pdf.rect(10, 10, pageWidth - 20, 2, 'F');

    // Title
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11); // Slightly smaller to comfortably fit WIP badge
    const titleText = 'INFORME ESTADÍSTICO DE DISTRIBUCIÓN Y RENDIMIENTO';
    pdf.text(titleText, 15, 22);

    const titleW = pdf.getTextWidth(titleText);
    const badgeX = 15 + titleW + 3;

    // Draw solid orange/gold WIP badge
    pdf.setFillColor(254, 243, 199); // amber-100
    pdf.setDrawColor(245, 158, 11); // amber-500
    pdf.setLineWidth(0.35);
    pdf.roundedRect(badgeX, 17.5, 10, 5, 1, 1, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(180, 83, 9); // amber-800
    pdf.text('WIP', badgeX + 5, 21.2, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`Auditoría analítica generada por: ${userName} | Fecha de generación: ${formatDisplayDate(new Date().toISOString()).split(' - ')[0]}`, 15, 27);

    // Decorative subtitle line
    pdf.setDrawColor(241, 245, 249); // slate-100
    pdf.setLineWidth(0.5);
    pdf.line(15, 30, pageWidth - 15, 30);
  };

  drawHeader();

  // LEFT COLUMN (x = 15, w = 85)
  // RIGHT COLUMN (x = 110, w = 85)
  const colW = 87;
  const leftX = 15;
  const rightX = 108;
  let currentY = 38;

  // Left Column - Executive summary KPIs
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.5);
  pdf.rect(leftX, currentY, colW, 70, 'FD');

  pdf.setFillColor(79, 70, 229); // indigo-600
  pdf.rect(leftX, currentY, colW, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('MÉTRICAS CLAVE DE CONVOCATORIAS', leftX + 4, currentY + 4.2);

  // KPIs Rows
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  
  let rowY = currentY + 12;
  const drawKPINum = (label: string, value: string | number, desc: string, yPos: number) => {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text(label, leftX + 4, yPos);

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(String(value), leftX + colW - 4, yPos, { align: 'right' });

    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(desc, leftX + 4, yPos + 4);
  };

  drawKPINum('Festivales Registrados', totalFests, 'Total acumulado en base de datos', rowY);
  rowY += 11;
  drawKPINum('Postulaciones Enviadas', totalSubmissions, 'Convocatorias procesadas y despachadas', rowY);
  rowY += 11;
  drawKPINum('Selecciones Oficiales', totalSelections, 'Obras nominadas o proyectadas oficialmente', rowY);
  rowY += 11;
  drawKPINum('Tasa de Selección', `${selectionRate.toFixed(1)}%`, 'Porcentaje de éxito sobre envíos', rowY);
  rowY += 11;
  drawKPINum('Premios Ganados (Laureles Oro)', totalWins, 'Porcentaje de victorias: ' + winRate.toFixed(1) + '%', rowY);

  // Left Column - Financial Statistics
  const finY = currentY + 74;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(leftX, finY, colW, 35, 'FD');

  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.rect(leftX, finY, colW, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('INVERSIÓN Y COSTOS DE DISTRIBUCIÓN', leftX + 4, finY + 4.2);

  drawKPINum('Presupuesto Total Estimado', `$${totalCost.toLocaleString('es-AR', { minimumFractionDigits: 1 })} USD`, `Calculado sobre ${paidCount} postulaciones de pago`, finY + 12);
  drawKPINum('Costo Promedio por Convocatoria', `$${avgCost.toFixed(1)} USD`, 'Cargos de inscripción promediados', finY + 23);

  // Right Column - Platform performance
  pdf.setFillColor(258, 250, 252); // slate-50
  pdf.rect(rightX, currentY, colW, 52, 'FD');

  pdf.setFillColor(16, 185, 129); // emerald-500
  pdf.rect(rightX, currentY, colW, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('RENDIMIENTO DE PLATAFORMAS', rightX + 4, currentY + 4.2);

  // Render Platform Table Header
  let tableY = currentY + 11;
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('PLATAFORMA', rightX + 4, tableY);
  pdf.text('ENVÍOS', rightX + 38, tableY, { align: 'right' });
  pdf.text('SELEC.', rightX + 54, tableY, { align: 'right' });
  pdf.text('EFECTIVIDAD', rightX + 83, tableY, { align: 'right' });

  // Draw separator line
  pdf.setDrawColor(226, 232, 240);
  pdf.line(rightX + 4, tableY + 1.5, rightX + colW - 4, tableY + 1.5);

  tableY += 5;
  const platsArr = Object.entries(platformStats).sort((a, b) => b[1].submitted - a[1].submitted);
  if (platsArr.length === 0) {
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.text('No hay postulaciones registradas.', rightX + 4, tableY + 6);
  } else {
    platsArr.slice(0, 5).forEach(([platName, pData]) => {
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      const truncPlat = platName.length > 18 ? platName.substring(0, 16) + '...' : platName;
      pdf.text(truncPlat.toUpperCase(), rightX + 4, tableY);

      pdf.setFont('helvetica', 'normal');
      pdf.text(String(pData.submitted), rightX + 38, tableY, { align: 'right' });
      pdf.text(String(pData.selected), rightX + 54, tableY, { align: 'right' });

      const eff = pData.submitted > 0 ? (pData.selected / pData.submitted) * 100 : 0;
      pdf.setFont('helvetica', 'bold');
      if (eff > 30) {
        pdf.setTextColor(16, 185, 129); // emerald-500
      } else if (eff > 0) {
        pdf.setTextColor(79, 70, 229);  // indigo-600
      } else {
        pdf.setTextColor(148, 163, 184); // slate-400
      }
      pdf.text(`${eff.toFixed(0)}%`, rightX + 83, tableY, { align: 'right' });

      // Separator line
      pdf.setDrawColor(241, 245, 249);
      pdf.line(rightX + 4, tableY + 1.5, rightX + colW - 4, tableY + 1.5);
      tableY += 6.5;
    });
  }

  // Right Column - Top destination countries
  const countryY = currentY + 56;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(rightX, countryY, colW, 53, 'FD');

  pdf.setFillColor(212, 175, 55); // gold-500
  pdf.rect(rightX, countryY, colW, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('TOP PAÍSES DE DESTINO (MÁS ENVIADOS)', rightX + 4, countryY + 4.2);

  let countryRowY = countryY + 11;
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('PAÍS', rightX + 4, countryRowY);
  pdf.text('CANTIDAD DE ENVÍOS', rightX + colW - 4, countryRowY, { align: 'right' });

  pdf.setDrawColor(226, 232, 240);
  pdf.line(rightX + 4, countryRowY + 1.5, rightX + colW - 4, countryRowY + 1.5);

  countryRowY += 5;
  if (sortedCountries.length === 0) {
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.text('No hay ubicaciones registradas.', rightX + 4, countryRowY + 6);
  } else {
    sortedCountries.forEach(([countryName, cCount]) => {
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(countryName.toUpperCase(), rightX + 4, countryRowY);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${cCount} Convocatoria${cCount > 1 ? 's' : ''}`, rightX + colW - 4, countryRowY, { align: 'right' });

      pdf.setDrawColor(241, 245, 249);
      pdf.line(rightX + 4, countryRowY + 1.5, rightX + colW - 4, countryRowY + 1.5);
      countryRowY += 6.5;
    });
  }

  // BOTTOM ROW - Full Width Category Stats
  const botY = currentY + 113;
  const fullW = pageWidth - 30;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(leftX, botY, fullW, 45, 'FD');

  pdf.setFillColor(79, 70, 229); // indigo-600
  pdf.rect(leftX, botY, fullW, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('RENDIMIENTO SEGÚN GÉNERO / CATEGORÍA', leftX + 4, botY + 4.2);

  let catRowY = botY + 11;
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('GÉNERO / CATEGORÍA', leftX + 4, catRowY);
  pdf.text('ENVIADOS', leftX + 80, catRowY, { align: 'right' });
  pdf.text('SELECCIONADOS', leftX + 120, catRowY, { align: 'right' });
  pdf.text('PORCENTAJE DE ÉXITO', leftX + fullW - 4, catRowY, { align: 'right' });

  pdf.setDrawColor(226, 232, 240);
  pdf.line(leftX + 4, catRowY + 1.5, leftX + fullW - 4, catRowY + 1.5);

  catRowY += 5;
  const catsArr = Object.entries(categoryStats).sort((a, b) => b[1].submitted - a[1].submitted);
  if (catsArr.length === 0) {
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.text('No hay categorías registradas en los festivales enviados.', leftX + 4, catRowY + 6);
  } else {
    catsArr.slice(0, 4).forEach(([catName, cData]) => {
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(catName.toUpperCase(), leftX + 4, catRowY);

      pdf.setFont('helvetica', 'normal');
      pdf.text(String(cData.submitted), leftX + 80, catRowY, { align: 'right' });
      pdf.text(String(cData.selected), leftX + 120, catRowY, { align: 'right' });

      const eff = cData.submitted > 0 ? (cData.selected / cData.submitted) * 100 : 0;
      pdf.setFont('helvetica', 'bold');
      if (eff > 30) {
        pdf.setTextColor(16, 185, 129); // emerald-500
      } else if (eff > 0) {
        pdf.setTextColor(79, 70, 229);  // indigo-600
      } else {
        pdf.setTextColor(148, 163, 184); // slate-400
      }
      pdf.text(`${eff.toFixed(1)}%`, leftX + fullW - 4, catRowY, { align: 'right' });

      pdf.setDrawColor(241, 245, 249);
      pdf.line(leftX + 4, catRowY + 1.5, leftX + fullW - 4, catRowY + 1.5);
      catRowY += 6.5;
    });
  }

  // BOTTOM NOTE
  const noteY = botY + 48;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Nota: Este informe procesa métricas puras y promedios reales calculados de forma autónoma basándose en el historial de carga registrado en la plataforma.', leftX, noteY);

  pdf.save(`informe_estadisticas_distribucion_${Date.now()}.pdf`);
};
