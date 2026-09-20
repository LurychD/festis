import { jsPDF } from 'jspdf';
import { format, parseISO, isValid, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Festival, AuditLog, FestivalStatus } from '../types';
import { parseFestivalDate } from './helpers';

export interface IntelligentReportOptions {
  pageSize: 'a4' | 'a3' | 'legal';
  orientation: 'p' | 'l';
  dateFrom: string;
  dateTo: string;
}

const logoUrl = '/images/logo.png';

const removeAccents = (str: string | undefined | null) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const formatDateArg = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const parsed = parseISO(dateStr);
  if (isValid(parsed)) {
    if (dateStr.includes('T') || dateStr.includes(':')) {
      return format(parsed, 'dd/MM/yyyy HH:mm');
    }
    return format(parsed, 'dd/MM/yyyy');
  }
  return dateStr;
};

export const generateIntelligentReportPDF = async (
  festivals: Festival[],
  auditLogs: AuditLog[],
  userName: string,
  options: IntelligentReportOptions
) => {
  const pageSize = options.pageSize || 'a4';
  const orientation = options.orientation || 'p';
  
  const pdf = new jsPDF(orientation, 'mm', pageSize);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 35;

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

  const drawHeader = (pageNumber: number) => {
    pdf.setDrawColor(79, 70, 229);
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
    pdf.text(removeAccents(`INFORME A DETALLE - HITOS DE DISTRIBUCION`), 65, 17);
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    let periodText = 'Periodo: Historico completo';
    if (options.dateFrom || options.dateTo) {
      periodText = `Periodo: ${formatDateArg(options.dateFrom) || 'Inicio'} al ${formatDateArg(options.dateTo) || 'Final'}`;
    }
    pdf.text(removeAccents(`${periodText} | Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')} por ${userName}`), 65, 23);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Pag. ${pageNumber}`, pageWidth - 25, 23);
  };

  let currentSection = { title: '', bg: [255,255,255] as [number,number,number], text: [0,0,0] as [number,number,number], page: 1 };

  const checkPageBreak = (neededSpace: number, headerJustStarted = false) => {
    if (y + neededSpace > pageHeight - 15) {
      pdf.addPage();
      drawHeader(pdf.getNumberOfPages());
      y = 40;
      if (currentSection.title && !headerJustStarted) {
         currentSection.page++;
         const displayTitle = `${currentSection.title} (${currentSection.page})`;
         y += 5;
         pdf.setFillColor(currentSection.bg[0], currentSection.bg[1], currentSection.bg[2]);
         pdf.roundedRect(10, y, pageWidth - 20, 8, 2, 2, 'F');
         pdf.setTextColor(currentSection.text[0], currentSection.text[1], currentSection.text[2]);
         pdf.setFont('helvetica', 'bold');
         pdf.setFontSize(9);
         pdf.text(removeAccents(`${displayTitle.toUpperCase()}`), 15, y + 5.5);
         y += 12;
      }
    }
  };

  drawHeader(1);

  const drawSectionTitle = (title: string, bgColor: [number, number, number], textColor: [number, number, number]) => {
    currentSection = { title, bg: bgColor, text: textColor, page: 1 };
    checkPageBreak(15, true);
    y += 5;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.roundedRect(10, y, pageWidth - 20, 8, 2, 2, 'F');
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    // Explicitly add (1) to the first header
    pdf.text(removeAccents(`${title.toUpperCase()} (1)`), 15, y + 5.5);
    y += 12;
  };

  const drawListItem = (title: string, subtitle: string, detailXPos: number = 105, hyperlinkUrl?: string, hyperlinkText?: string) => {
    checkPageBreak(10);
    
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    const shortTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
    pdf.text(removeAccents(`- ${shortTitle}`), 15, y);
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    
    const availableWidth = pageWidth - detailXPos - 15;
    const splitSubtitle = pdf.splitTextToSize(removeAccents(subtitle), availableWidth);
    
    pdf.text(splitSubtitle, detailXPos, y);
    
    if (hyperlinkUrl && hyperlinkText) {
        // Find position for link (at the end of subtitle height)
        const linkY = y + ((splitSubtitle.length - 1) * 4);
        const subW = pdf.getTextWidth(splitSubtitle[splitSubtitle.length - 1] + " ");
        pdf.setTextColor(0, 0, 255);
        // textWithLink exists on jsPDF instance
        (pdf as any).textWithLink(`[ ${hyperlinkText} ]`, detailXPos + subW + 2, linkY, { url: hyperlinkUrl });
    }
    
    y += (splitSubtitle.length * 4) + 2;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(15, y, pageWidth - 15, y);
    y += 4;
  };

  const drawEmptyState = (msg: string) => {
    checkPageBreak(8);
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.text(removeAccents(msg), 15, y);
    y += 8;
  };

  type Transition = { timestamp: string, festName: string, newStatus: string, oldStatus?: string, note?: string };
  let allTransitions: Transition[] = [];

  console.log("Total audit logs received:", auditLogs.length);
  auditLogs.forEach(log => {
      if (!log.details) return;
      
      // Pattern 1: Quick status change
      const quickMatch = log.details.match(/ha cambiado el estado de '(.*?)' a ([^.]*)/);
      if (quickMatch) {
          const noteMatch = log.details.match(/Nota:\s*(.*)/);
          allTransitions.push({
              timestamp: log.timestamp,
              festName: quickMatch[1].trim(),
              newStatus: quickMatch[2].trim(),
              note: noteMatch ? noteMatch[1].trim() : undefined
          });
          return;
      }
      
      // Pattern 3: Created a festival
      const createMatch = log.details.match(/ha registrado el festival '(.*?)'/);
      if (createMatch) {
          allTransitions.push({
              timestamp: log.timestamp,
              festName: createMatch[1].trim(),
              newStatus: "Registrado"
          });
          return;
      }
      
      // Pattern 4: Deleted a festival
      const deleteMatch = log.details.match(/ha eliminado el festival '(.*?)'/);
      if (deleteMatch) {
          allTransitions.push({
              timestamp: log.timestamp,
              festName: deleteMatch[1].trim(),
              newStatus: "Eliminado"
          });
          return;
      }
      
      // Pattern 2: Modal edit status change
      if (log.details.includes('Se ha actualizado la informaci') && log.details.includes('Estado:')) {
          const nameMatch = log.details.match(/la informaci.n de '(.*?)'\. Cambios/);
          const statusMatch = log.details.match(/Estado: "(.*?)" -> "(.*?)"/);
          if (nameMatch && statusMatch) {
              allTransitions.push({
                  timestamp: log.timestamp,
                  festName: nameMatch[1].trim(),
                  oldStatus: statusMatch[1].trim(),
                  newStatus: statusMatch[2].trim()
              });
          }
          return;
      }
  });

  // Supplement transitions from each festival's statusHistory
  festivals.forEach((f) => {
    if (f.statusHistory && f.statusHistory.length > 0) {
      f.statusHistory.forEach((sh) => {
        if (!sh.timestamp) return;
        const exists = allTransitions.some(
          (t) =>
            t.festName.toLowerCase() === f.name.toLowerCase() &&
            t.newStatus === sh.status &&
            Math.abs(new Date(t.timestamp).getTime() - new Date(sh.timestamp).getTime()) < 10000
        );
        if (!exists) {
          allTransitions.push({
            timestamp: sh.timestamp,
            festName: f.name,
            newStatus: sh.status,
            oldStatus: sh.previousStatus,
            note: sh.note
          });
        }
      });
    }
  });

  if (options.dateFrom && options.dateTo) {
      const fromDate = startOfDay(parseISO(options.dateFrom));
      const toDate = endOfDay(parseISO(options.dateTo));
      if (isValid(fromDate) && isValid(toDate)) {
          allTransitions = allTransitions.filter(trans => {
             const logDate = new Date(trans.timestamp);
             return isWithinInterval(logDate, { start: fromDate, end: toDate });
          });
      }
  }

  const fromDate = options.dateFrom ? startOfDay(parseISO(options.dateFrom)) : null;
  const toDate = options.dateTo ? endOfDay(parseISO(options.dateTo)) : null;

  type MilestoneItem = {
      festName: string;
      timestamp: string;
      newStatus: string;
      category?: string;
  };

  const parseIdTimestamp = (id: string): Date | null => {
      if (/^\d{13}$/.test(id)) {
          const d = new Date(parseInt(id, 10));
          if (isValid(d)) return d;
      }
      return null;
  };

  const inscripcionesSet = new Map<string, MilestoneItem>();
  const seleccionesSet = new Map<string, MilestoneItem>();
  const proyeccionesSet = new Map<string, MilestoneItem>();
  const premiosSet = new Map<string, MilestoneItem>();
  const rechazadosSet = new Map<string, MilestoneItem>();
  const curaduriaSet = new Map<string, MilestoneItem>();

  // 1. Process audit logs transitions
  allTransitions.forEach(trans => {
      const key = trans.festName.toLowerCase();
      const mappedFest = festivals.find(f => f.name.toLowerCase() === key);
      const cat = mappedFest?.category || 'Sin Categoría';
      
      const item: MilestoneItem = {
          festName: trans.festName,
          timestamp: trans.timestamp,
          newStatus: trans.newStatus,
          category: cat
      };
      
      const statusL = trans.newStatus.toLowerCase();
      if (statusL === 'en revision') {
          if (!trans.oldStatus || ['por enviar', 'en duda'].includes(trans.oldStatus.toLowerCase())) {
              inscripcionesSet.set(key, item);
          }
      } else if (statusL === 'seleccionado') {
          seleccionesSet.set(key, item);
      } else if (statusL === 'proyectado') {
          proyeccionesSet.set(key, item);
      } else if (statusL === 'ganado') {
          premiosSet.set(key, item);
      } else if (['no seleccionado', 'descalificado', 'eliminado'].includes(statusL)) {
          rechazadosSet.set(key, item);
      } else if (['por enviar', 'proximamente', 'en duda', 'registrado'].includes(statusL)) {
          curaduriaSet.set(key, item);
      }
  });

  // 2. Process current festivals hybrid fallback
  if (fromDate && toDate && isValid(fromDate) && isValid(toDate)) {
      festivals.forEach(f => {
          const key = f.name.toLowerCase();
          const cat = f.category || 'Sin Categoría';
          
          const dateInRange = (dateStr: string | undefined): Date | null => {
              if (!dateStr) return null;
              const d = parseFestivalDate(dateStr);
              if (d && isWithinInterval(d, { start: fromDate, end: toDate })) {
                  return d;
              }
              return null;
          };

          // Check projection date
          const projD = dateInRange(f.projectionDate);
          if (projD) {
              if (!proyeccionesSet.has(key)) {
                  proyeccionesSet.set(key, {
                      festName: f.name,
                      timestamp: f.projectionDate!,
                      newStatus: 'Proyectado',
                      category: cat
                  });
              }
          }

          // Check news date
          const newsD = dateInRange(f.newsDate);
          if (newsD) {
              const statusL = f.status.toLowerCase();
              if (f.status === FestivalStatus.SELECCIONADO || f.status === FestivalStatus.GANADO || f.status === FestivalStatus.PROYECTADO) {
                  if (!seleccionesSet.has(key)) {
                      seleccionesSet.set(key, {
                          festName: f.name,
                          timestamp: f.newsDate!,
                          newStatus: 'Seleccionado',
                          category: cat
                      });
                  }
              }
              if (f.status === FestivalStatus.GANADO) {
                  if (!premiosSet.has(key)) {
                      premiosSet.set(key, {
                          festName: f.name,
                          timestamp: f.newsDate!,
                          newStatus: 'Ganado',
                          category: cat
                      });
                  }
              }
              if (f.status === FestivalStatus.NO_SELECCIONADO || f.status === FestivalStatus.DESCALIFICADO) {
                  if (!rechazadosSet.has(key)) {
                      rechazadosSet.set(key, {
                          festName: f.name,
                          timestamp: f.newsDate!,
                          newStatus: f.status,
                          category: cat
                      });
                  }
              }
          }

          // Check creation/registration date from festival id or deadline
          const idD = parseIdTimestamp(f.id);
          const isCreatedInRange = idD && isWithinInterval(idD, { start: fromDate, end: toDate });
          
          const deadD = dateInRange(f.deadline);
          const isActiveSubmission = [FestivalStatus.EN_REVISION, FestivalStatus.SELECCIONADO, FestivalStatus.PROYECTADO, FestivalStatus.GANADO, FestivalStatus.NO_SELECCIONADO, FestivalStatus.DESCALIFICADO].includes(f.status);
          
          if (isActiveSubmission) {
              if (deadD || isCreatedInRange) {
                  if (!inscripcionesSet.has(key)) {
                      inscripcionesSet.set(key, {
                          festName: f.name,
                          timestamp: f.deadline || (idD ? idD.toISOString() : fromDate.toISOString()),
                          newStatus: 'En Revision',
                          category: cat
                      });
                  }
              }
          }

          // Check Curaduría / Draft states
          const isDraftState = [FestivalStatus.POR_ENVIAR, FestivalStatus.PROXIMAMENTE, FestivalStatus.EN_DUDA].includes(f.status);
          if (isDraftState) {
              if (isCreatedInRange || deadD) {
                  if (!curaduriaSet.has(key)) {
                      curaduriaSet.set(key, {
                          festName: f.name,
                          timestamp: f.deadline || (idD ? idD.toISOString() : fromDate.toISOString()),
                          newStatus: f.status,
                          category: cat
                      });
                  }
              }
          }
      });
  }

  // 3. Category Counts calculation
  type CategoryCount = {
      inscripciones: number;
      selecciones: number;
      proyecciones: number;
      premios: number;
      rechazos: number;
  };
  const categoryCountsMap = new Map<string, CategoryCount>();

  const getOrCreateCategoryCount = (catName: string): CategoryCount => {
      const normalized = catName.trim() || 'Sin Categoría';
      if (!categoryCountsMap.has(normalized)) {
          categoryCountsMap.set(normalized, {
              inscripciones: 0,
              selecciones: 0,
              proyecciones: 0,
              premios: 0,
              rechazos: 0
          });
      }
      return categoryCountsMap.get(normalized)!;
  };

  inscripcionesSet.forEach(item => {
      const c = getOrCreateCategoryCount(item.category || 'Sin Categoría');
      c.inscripciones++;
  });
  seleccionesSet.forEach(item => {
      const c = getOrCreateCategoryCount(item.category || 'Sin Categoría');
      c.selecciones++;
  });
  proyeccionesSet.forEach(item => {
      const c = getOrCreateCategoryCount(item.category || 'Sin Categoría');
      c.proyecciones++;
  });
  premiosSet.forEach(item => {
      const c = getOrCreateCategoryCount(item.category || 'Sin Categoría');
      c.premios++;
  });
  rechazadosSet.forEach(item => {
      const c = getOrCreateCategoryCount(item.category || 'Sin Categoría');
      c.rechazos++;
  });

  const sortByTimestampDesc = (a: MilestoneItem, b: MilestoneItem) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  };

  const inscripciones = Array.from(inscripcionesSet.values()).sort(sortByTimestampDesc);
  const selecciones = Array.from(seleccionesSet.values()).sort(sortByTimestampDesc);
  const proyecciones = Array.from(proyeccionesSet.values()).sort(sortByTimestampDesc);
  const premios = Array.from(premiosSet.values()).sort(sortByTimestampDesc);
  const rechazados = Array.from(rechazadosSet.values()).sort(sortByTimestampDesc);
  const curaduriaAll = Array.from(curaduriaSet.values()).sort(sortByTimestampDesc);

  const convocatoriasAbiertasSet = new Map<string, MilestoneItem>();
  if (fromDate && toDate && isValid(fromDate) && isValid(toDate)) {
      festivals.forEach(f => {
          if (f.deadline) {
              const parsedDead = parseFestivalDate(f.deadline);
              if (parsedDead && isWithinInterval(parsedDead, { start: fromDate, end: toDate })) {
                  const isUnresolved = f.status === FestivalStatus.POR_ENVIAR || f.status === FestivalStatus.PROXIMAMENTE || f.status === FestivalStatus.EN_DUDA || f.status === FestivalStatus.EN_REVISION;
                  if (isUnresolved) {
                      convocatoriasAbiertasSet.set(f.name.toLowerCase(), {
                          festName: f.name,
                          timestamp: f.deadline,
                          newStatus: f.status,
                          category: f.category || 'Sin Categoría'
                      });
                  }
              }
          }
      });
  }
  const convocatoriasAbiertas = Array.from(convocatoriasAbiertasSet.values()).sort(sortByTimestampDesc);

  // --- DRAW SECTIONS ---

  // Category summary section first
  if (categoryCountsMap.size > 0) {
      drawSectionTitle('Resumen por Categorias', [243, 244, 246], [31, 41, 55]); // dark gray/slate
      categoryCountsMap.forEach((counts, catName) => {
          checkPageBreak(18);
          pdf.setFillColor(249, 250, 251);
          pdf.roundedRect(15, y, pageWidth - 30, 8, 1, 1, 'F');
          
          pdf.setTextColor(17, 24, 39);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.text(removeAccents(catName.toUpperCase()), 18, y + 5.5);
          y += 8;
          
          const metricsStr = `Inscripciones: ${counts.inscripciones}  |  Selecciones: ${counts.selecciones}  |  Proyecciones: ${counts.proyecciones}  |  Premios: ${counts.premios}  |  Rechazos: ${counts.rechazos}`;
          pdf.setTextColor(75, 85, 99);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.text(removeAccents(metricsStr), 22, y + 4);
          
          y += 6;
          pdf.setDrawColor(243, 244, 246);
          pdf.line(15, y, pageWidth - 15, y);
          y += 3;
      });
      y += 5;
  }

  // 1. Inscripciones
  drawSectionTitle('Inscripciones Realizadas', [237, 233, 254], [109, 40, 217]); // violet
  if (inscripciones.length) {
    inscripciones.forEach(f => drawListItem(f.festName, `Fecha: ${formatDateArg(f.timestamp)}${f.category ? ' | Categoria: ' + f.category : ''}`));
  } else {
    drawEmptyState("No se registraron nuevas inscripciones.");
  }

  // 2. Selecciones Oficiales
  drawSectionTitle('Selecciones Oficiales', [224, 242, 254], [3, 105, 161]); // sky
  if (selecciones.length) {
    selecciones.forEach(f => {
        const catStr = f.category ? ` | Categoria: ${f.category}` : '';
        drawListItem(f.festName, `Fecha: ${formatDateArg(f.timestamp)}${catStr}`);
    });
  } else {
    drawEmptyState("No se registraron nuevas selecciones.");
  }

  // 3. Proyecciones
  drawSectionTitle('Proyecciones Confirmadas', [220, 252, 231], [21, 128, 61]); // green
  if (proyecciones.length) {
    proyecciones.forEach(f => {
        const mappedFest = festivals.find(fest => fest.name.toLowerCase() === f.festName.toLowerCase());
        const locationUrl = mappedFest?.projectionLocation ? `https://maps.google.com/?q=${encodeURIComponent(mappedFest.projectionLocation)}` : undefined;
        const locationText = mappedFest?.projectionLocation ? "Lugar de proyeccion" : undefined;
        const catStr = f.category ? ` | Categoria: ${f.category}` : '';
        drawListItem(f.festName, `Proyectado el: ${formatDateArg(mappedFest?.projectionDate || f.timestamp)}${catStr}`, 105, locationUrl, locationText);
    });
  } else {
    drawEmptyState("No se registraron nuevas proyecciones.");
  }

  // 4. Premios
  drawSectionTitle('Premios y Nominaciones', [254, 243, 199], [180, 83, 9]); // amber
  if (premios.length) {
    premios.forEach(f => {
        const catStr = f.category ? ` | Categoria: ${f.category}` : '';
        drawListItem(f.festName, `Obtenido el: ${formatDateArg(f.timestamp)}${catStr}`);
    });
  } else {
    drawEmptyState("No hubo premios en este periodo.");
  }

  // 5. Curaduria y Aperturas
  drawSectionTitle('Aperturas y Curaduria', [241, 245, 249], [71, 85, 105]); // slate
  if (curaduriaAll.length) {
    curaduriaAll.forEach(f => {
        const catStr = f.category ? ` | Categoria: ${f.category}` : '';
        drawListItem(f.festName, `Marcado como ${f.newStatus} el ${formatDateArg(f.timestamp)}${catStr}`);
    });
  } else {
    drawEmptyState("No hubo aperturas ni marcadores de curaduria.");
  }

  // 6. Rechazados
  drawSectionTitle('Festivales Descartados / Rechazos', [254, 226, 226], [185, 28, 28]); // red
  if (rechazados.length) {
    rechazados.forEach(f => {
        const catStr = f.category ? ` | Categoria: ${f.category}` : '';
        drawListItem(f.festName, `Descartado el: ${formatDateArg(f.timestamp)} - ${f.newStatus}${catStr}`);
    });
  } else {
    drawEmptyState("No hubo descartes ni rechazos en este periodo.");
  }

  // 7. Convocatorias que estuvieron abiertas
  if (fromDate && toDate && isValid(fromDate) && isValid(toDate)) {
    drawSectionTitle('Convocatorias Abiertas en el Periodo', [255, 237, 213], [194, 65, 12]); // orange
    if (convocatoriasAbiertas.length) {
      convocatoriasAbiertas.forEach(f => {
          const catStr = f.category ? ` | Categoria: ${f.category}` : '';
          drawListItem(f.festName, `Vigente al: ${formatDateArg(f.timestamp)} - ${f.newStatus}${catStr}`);
      });
    } else {
      drawEmptyState("No hubo convocatorias con cierres destacables en este periodo.");
    }
  }

  // 8. Historial y Trazabilidad de Cambios con Notas
  drawSectionTitle('Historial y Trazabilidad de Estados', [243, 244, 246], [31, 41, 55]); // slate
  if (allTransitions.length) {
    const sortedTransitions = [...allTransitions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    sortedTransitions.slice(0, 35).forEach(t => {
      const noteStr = t.note ? ` | Nota: ${t.note}` : '';
      const transitionStr = t.oldStatus ? `${t.oldStatus} -> ${t.newStatus}` : t.newStatus;
      drawListItem(t.festName, `Fecha: ${formatDateArg(t.timestamp)} | Estado: ${transitionStr}${noteStr}`);
    });
  } else {
    drawEmptyState("No hay registros de trazabilidad en el periodo seleccionado.");
  }

  pdf.save(`informe_distribucion_hitos_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

