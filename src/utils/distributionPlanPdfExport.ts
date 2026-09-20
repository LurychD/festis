import { jsPDF } from "jspdf";
import { DistributionPlan, Festival, FestivalStatus } from "../types";

export interface DistributionPlanPDFOptions {
  pageSize?: "a4" | "legal";
  orientation?: "p" | "l";
  includeNotes?: boolean;
  includeObservations?: boolean;
  reportType?: "institucion" | "interno";
  customNotes?: string;
}

/**
 * Formatea una fecha ISO o string a formato DD/MM/AA
 */
const formatDDMMAA = (dateStr?: string | null): string => {
  if (!dateStr || dateStr === "Por definir") return "Por definir";
  try {
    // Si ya viene con formato DD/MM/YYYY o YYYY-MM-DD
    const parts = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const d = new Date(parts.includes("-") ? parts + "T12:00:00Z" : parts);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = String(d.getUTCFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr || "Por definir";
  }
};

export const exportDistributionPlanPDF = async (
  plan: DistributionPlan,
  festivalsList: Festival[],
  userName: string,
  options?: DistributionPlanPDFOptions
): Promise<void> => {
  const pageSize = options?.pageSize || "a4";
  const orientation = options?.orientation || "p";
  const includeNotes = options?.includeNotes !== false;
  const reportType = options?.reportType || "institucion";
  const isInstitucion = reportType === "institucion";

  const pdf = new jsPDF(orientation, "mm", pageSize);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = 16;

  // Cargar logotipo del cortometraje o app
  let logoImg: HTMLImageElement | null = null;
  let logoRatio = 1;
  try {
    logoImg = new Image();
    logoImg.crossOrigin = "Anonymous";
    logoImg.src = "/images/logo.png";
    await new Promise((resolve) => {
      logoImg!.onload = () => {
        if (logoImg && logoImg.naturalWidth && logoImg.naturalHeight) {
          logoRatio = logoImg.naturalWidth / logoImg.naturalHeight;
        }
        resolve(null);
      };
      logoImg!.onerror = () => resolve(null);
    });
  } catch {
    logoImg = null;
  }

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      pdf.addPage();
      y = 16;
      drawHeaderWatermark();
    }
  };

  const drawHeaderWatermark = () => {
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(140, 140, 140);
    const refText = isInstitucion
      ? `PLAN DE DISTRIBUCIÓN AUDIOVISUAL | ${plan.institucionNombre ? plan.institucionNombre.toUpperCase() + " | " : ""}REF: ${plan.id.substring(0, 14).toUpperCase()}`
      : `DOSSIER DE DISTRIBUCIÓN (USO INTERNO) | REF: ${plan.id.substring(0, 14).toUpperCase()}`;
    pdf.text(refText, margin, 10);
    pdf.setDrawColor(225, 230, 235);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 11.5, pageWidth - margin, 11.5);
  };

  // Dibujar cintillo inicial
  drawHeaderWatermark();

  // 1. Encabezado Principal Institucional con aspecto de logo corregido
  if (logoImg) {
    try {
      // Máximo espacio para el logo: 36mm ancho x 16mm alto manteniendo proporción
      const maxW = 36;
      const maxH = 16;
      let drawW = maxH * logoRatio;
      let drawH = maxH;
      if (drawW > maxW) {
        drawW = maxW;
        drawH = maxW / logoRatio;
      }
      const logoY = y + (maxH - drawH) / 2;

      pdf.addImage(logoImg, "PNG", margin, logoY, drawW, drawH);

      const titleX = margin + drawW + 5;
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(20, 25, 35);
      pdf.text(
        isInstitucion ? "PLAN DE DISTRIBUCIÓN AUDIOVISUAL" : "PLAN DE DISTRIBUCIÓN (CONTROL INTERNO)",
        titleX,
        y + 5.5
      );

      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(225, 29, 72); // Rose 600
      pdf.text(plan.nombre, titleX, y + 11.5);

      if (isInstitucion && plan.institucionNombre) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Presentado ante: ${plan.institucionNombre}`, titleX, y + 16);
      }

      y += Math.max(drawH + 4, 18);
    } catch {
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(20, 25, 35);
      pdf.text("PLAN DE DISTRIBUCIÓN AUDIOVISUAL", margin, y + 5);

      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(225, 29, 72);
      pdf.text(plan.nombre, margin, y + 11);
      y += 18;
    }
  } else {
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(20, 25, 35);
    pdf.text("PLAN DE DISTRIBUCIÓN AUDIOVISUAL", margin, y + 5);

    pdf.setFontSize(10.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(225, 29, 72);
    pdf.text(plan.nombre, margin, y + 11);
    y += 18;
  }

  // 2. Ficha Técnica / Banner de Datos del Plan
  checkPageBreak(34);
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  
  const boxHeight = isInstitucion ? 28 : 34;
  pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

  const col1X = margin + 4;
  const col2X = margin + contentWidth / 2;
  const startBoxY = y + 6;

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 116, 139);

  if (isInstitucion) {
    // BANNER OFICIAL PARA LA INSTITUCIÓN REGULADORA
    // Columna 1
    pdf.text("ORGANISMO REGULADOR:", col1X, startBoxY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 41, 59);
    pdf.text(plan.institucionNombre || "Institución Reguladora", col1X + 44, startBoxY);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("PRESUPUESTO:", col1X, startBoxY + 7);
    pdf.setTextColor(15, 23, 42);
    pdf.text(
      `$ ${plan.presupuestoEstimado?.toLocaleString("es-AR") || "0"} ARS`,
      col1X + 44,
      startBoxY + 7
    );

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("FECHA DE EMISIÓN:", col1X, startBoxY + 14);
    pdf.setTextColor(30, 41, 59);
    pdf.text(new Date().toLocaleDateString("es-AR"), col1X + 44, startBoxY + 14);

    // Columna 2
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("EMITIDO POR:", col2X, startBoxY);
    pdf.setTextColor(30, 41, 59);
    pdf.text(userName || "Equipo de Producción", col2X + 44, startBoxY);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("CANTIDAD DE FESTIVALES:", col2X, startBoxY + 7);
    pdf.setTextColor(15, 23, 42);
    // Solo un número entero limpio, sin discriminar borradores de catálogo
    pdf.text(
      `${festivalsList.length} festivales propuestos`,
      col2X + 44,
      startBoxY + 7
    );

    if (plan.fechaResolucion) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(100, 116, 139);
      pdf.text("PLAZO RESOLUCIÓN:", col2X, startBoxY + 14);
      pdf.setTextColor(30, 41, 59);
      pdf.text(new Date(plan.fechaResolucion).toLocaleDateString("es-AR"), col2X + 44, startBoxY + 14);
    }
  } else {
    // BANNER PARA USO INTERNO (CON TODOS LOS DETALLES)
    // Columna 1
    pdf.text("ORGANISMO REGULADOR:", col1X, startBoxY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 41, 59);
    pdf.text(plan.institucionNombre || "Institución Reguladora", col1X + 44, startBoxY);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("ESTADO DEL EXPEDIENTE:", col1X, startBoxY + 6.5);
    pdf.setTextColor(30, 41, 59);
    const estadoLabel =
      plan.estado === "aprobado"
        ? "APROBADO FORMALMENTE"
        : plan.estado === "en_revision" || plan.estado === "pendiente"
        ? "EN REVISIÓN TÉCNICA"
        : plan.estado === "no_aprobado"
        ? "NO APROBADO"
        : plan.estado === "archivado"
        ? "ARCHIVADO"
        : "BORRADOR EN FORMULACIÓN";
    pdf.text(estadoLabel, col1X + 44, startBoxY + 6.5);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("PRESUPUESTO ESTIMADO:", col1X, startBoxY + 13);
    pdf.setTextColor(15, 23, 42);
    pdf.text(
      `$ ${plan.presupuestoEstimado?.toLocaleString("es-AR") || "0"} ARS`,
      col1X + 44,
      startBoxY + 13
    );

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("PLAZO RESOLUCIÓN:", col1X, startBoxY + 19.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(
      plan.fechaResolucion
        ? new Date(plan.fechaResolucion).toLocaleDateString("es-AR")
        : "No especificado",
      col1X + 44,
      startBoxY + 19.5
    );

    // Columna 2
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("FECHA DE EMISIÓN:", col2X, startBoxY);
    pdf.setTextColor(30, 41, 59);
    pdf.text(new Date().toLocaleDateString("es-AR"), col2X + 42, startBoxY);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("EMITIDO POR:", col2X, startBoxY + 6.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(userName || "Equipo de Producción", col2X + 42, startBoxY + 6.5);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("FESTIVALES POSTULADOS:", col2X, startBoxY + 13);
    pdf.setTextColor(30, 41, 59);
    const draftCount = plan.festivalesBorrador?.length || 0;
    const preexistingCount = plan.festivalesIds?.length || 0;
    pdf.text(
      `${festivalsList.length} (${draftCount} borradores, ${preexistingCount} catálogo)`,
      col2X + 42,
      startBoxY + 13
    );

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("ID DE REFERENCIA:", col2X, startBoxY + 19.5);
    pdf.setFont("courier", "bold");
    pdf.setTextColor(71, 85, 105);
    pdf.text(plan.id.substring(0, 20), col2X + 42, startBoxY + 19.5);
  }

  y += boxHeight + 5;

  // 3. Sección de Notas Personalizadas del Reporte (Opcional)
  const customNotesText = options?.customNotes?.trim() || "";
  if (customNotesText.length > 0) {
    checkPageBreak(25);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 41, 59); // Slate 800
    pdf.text("NOTAS:", margin, y);
    y += 3.5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);

    const splitNotes = pdf.splitTextToSize(customNotesText, contentWidth - 6);
    const notesBoxHeight = Math.min(splitNotes.length * 3.6 + 5, 55);

    pdf.setFillColor(248, 250, 252); // Slate 50
    pdf.setDrawColor(226, 232, 240); // Slate 200
    pdf.roundedRect(margin, y, contentWidth, notesBoxHeight, 1.5, 1.5, "FD");

    pdf.text(splitNotes, margin + 3, y + 4);
    y += notesBoxHeight + 5;
  } else if (!isInstitucion && includeNotes && plan.notas && plan.notas.trim().length > 0) {
    // Si es minuta interna y el usuario activó incluir notas del plan
    checkPageBreak(25);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(180, 83, 9); // Amber 700
    pdf.text("BASES, NOTAS Y REQUISITOS DE LA CONVOCATORIA:", margin, y);
    y += 3.5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);

    const splitNotes = pdf.splitTextToSize(plan.notas.trim(), contentWidth - 6);
    const notesBoxHeight = Math.min(splitNotes.length * 3.6 + 5, 40);

    pdf.setFillColor(254, 252, 232); // Amber 50
    pdf.setDrawColor(253, 230, 138); // Amber 200
    pdf.roundedRect(margin, y, contentWidth, notesBoxHeight, 1.5, 1.5, "FD");

    pdf.text(splitNotes.slice(0, 8), margin + 3, y + 4);
    y += notesBoxHeight + 5;
  }

  // 4. Tabla de Festivales Postulados
  checkPageBreak(22);
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text(`NÓMINA DE FESTIVALES POSTULADOS (${festivalsList.length})`, margin, y);
  y += 4.5;

  // Encabezado de la Tabla
  const headerHeight = 7;
  pdf.setFillColor(30, 41, 59); // Slate 800
  pdf.rect(margin, y, contentWidth, headerHeight, "F");

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);

  const includeObservations = options?.includeObservations !== false;

  if (isInstitucion) {
    // COLUMNAS OFICIALES INSTITUCIÓN:
    // Si includeObservations es true:
    // # (6mm) | NOMBRE FESTIVAL (27%) | PAÍS (16%) | CIERRE (10%) | COSTO (11%) | LINK (16%) | OBSERVACIONES (restante)
    // Si includeObservations es false:
    // # (6mm) | NOMBRE FESTIVAL (35%) | PAÍS (20%) | CIERRE (11%) | COSTO (12%) | LINK (restante ~22%)
    const wNum = 6;
    const wNombre = includeObservations ? contentWidth * 0.27 : contentWidth * 0.35;
    const wPais = includeObservations ? contentWidth * 0.16 : contentWidth * 0.20;
    const wCierre = includeObservations ? contentWidth * 0.10 : contentWidth * 0.11;
    const wCosto = includeObservations ? contentWidth * 0.11 : contentWidth * 0.12;
    const wLink = includeObservations ? contentWidth * 0.16 : contentWidth - (wNum + wNombre + wPais + wCierre + wCosto);
    const wObs = includeObservations ? contentWidth - (wNum + wNombre + wPais + wCierre + wCosto + wLink) : 0;

    let curX = margin + 1.5;
    pdf.text("#", curX, y + 4.8);
    curX += wNum;
    pdf.text("NOMBRE FESTIVAL", curX, y + 4.8);
    curX += wNombre;
    pdf.text("PAÍS", curX, y + 4.8);
    curX += wPais;
    pdf.text("CIERRE", curX, y + 4.8);
    curX += wCierre;
    pdf.text("COSTO", curX, y + 4.8);
    curX += wCosto;
    pdf.text("LINK INSCRIPCIÓN", curX, y + 4.8);
    curX += wLink;
    if (includeObservations) {
      pdf.text("OBSERVACIONES", curX, y + 4.8);
    }

    y += headerHeight;

    // Filas para Institución con altura dinámica multilínea (sin cortes ni desbordes)
    festivalsList.forEach((fest, idx) => {
      // 1. Preparar líneas para cada celda respetando su ancho de columna
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      const nameLines = pdf.splitTextToSize(fest.name, wNombre - 2.5);

      pdf.setFont("helvetica", "normal");
      const countryLines = pdf.splitTextToSize(fest.country || "-", wPais - 2.5);
      const cierreLines = [formatDDMMAA(fest.deadline)];

      const feeText = fest.fee ? `$ ${fest.fee}` : fest.price || "Sin costo";
      const costoLines = pdf.splitTextToSize(feeText, wCosto - 2.5);

      const rawUrl = fest.link || (fest as any).submissionLink || "";
      let displayUrl = "-";
      let linkLines: string[] = ["-"];
      if (rawUrl) {
        displayUrl = rawUrl.replace(/^https?:\/\/(www\.)?/, "");
        linkLines = pdf.splitTextToSize(displayUrl, wLink - 2.5);
      }

      const rawObs = fest.observations || (fest as any).observaciones || (fest as any).notes || "-";
      const obsLines = includeObservations ? pdf.splitTextToSize(rawObs, wObs - 2.5) : [];

      // Calcular la cantidad máxima de renglones necesarios en esta fila
      const linesCounts = [
        nameLines.length,
        countryLines.length,
        costoLines.length,
        linkLines.length,
      ];
      if (includeObservations) {
        linesCounts.push(obsLines.length);
      }
      const maxLinesCount = Math.max(...linesCounts, 1);

      const lineStep = 3.3; // altura en mm por línea de texto
      const topPad = 4.2;   // separación superior del texto
      const bottomPad = 2.5;
      const rowHeight = Math.max(8.5, maxLinesCount * lineStep + bottomPad);

      // Salto de página preventivo con la altura exacta de la fila
      checkPageBreak(rowHeight + 2);

      // Fondo alternado de la fila y bordes
      if (idx % 2 === 0) {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(248, 250, 252);
      }
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, y, contentWidth, rowHeight, "FD");

      let cellX = margin + 1.5;

      // 1. #
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text(String(idx + 1), cellX, y + topPad);
      cellX += wNum;

      // 2. Nombre Festival (multilínea completo, sin truncar)
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text(nameLines, cellX, y + topPad);
      cellX += wNombre;

      // 3. País (multilínea completo)
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 41, 59);
      pdf.text(countryLines, cellX, y + topPad);
      cellX += wPais;

      // 4. Cierre (formato estricto DD/MM/AA)
      pdf.text(cierreLines, cellX, y + topPad);
      cellX += wCierre;

      // 5. Costo
      pdf.setFont("helvetica", "bold");
      pdf.text(costoLines, cellX, y + topPad);
      cellX += wCosto;

      // 6. Link de Inscripción (multilínea clickeable si es url)
      pdf.setFont("helvetica", "normal");
      if (rawUrl && rawUrl.startsWith("http")) {
        pdf.setTextColor(2, 132, 199); // Sky 600
        for (let l = 0; l < linkLines.length; l++) {
          pdf.textWithLink(linkLines[l], cellX, y + topPad + (l * lineStep), { url: rawUrl });
        }
      } else {
        pdf.setTextColor(100, 116, 139);
        pdf.text(linkLines, cellX, y + topPad);
      }
      cellX += wLink;

      // 7. Observaciones (multilínea condicional)
      if (includeObservations) {
        pdf.setTextColor(71, 85, 105);
        pdf.text(obsLines, cellX, y + topPad);
      }

      y += rowHeight;
    });

  } else {
    // COLUMNAS PARA USO INTERNO
    const wNum = 7;
    const wNombre = contentWidth * 0.33;
    const wPais = contentWidth * 0.16;
    const wDeadline = contentWidth * 0.15;
    const wFee = contentWidth * 0.12;
    const wEstado = contentWidth * 0.17;

    let curX = margin + 2;
    pdf.text("#", curX, y + 4.8);
    curX += wNum;
    pdf.text("FESTIVAL Y PROCEDENCIA", curX, y + 4.8);
    curX += wNombre;
    pdf.text("PAÍS / SEDE", curX, y + 4.8);
    curX += wPais;
    pdf.text("CIERRE", curX, y + 4.8);
    curX += wDeadline;
    pdf.text("COSTO / FEE", curX, y + 4.8);
    curX += wFee;
    pdf.text("ESTADO POSTULACIÓN", curX, y + 4.8);

    y += headerHeight;

    festivalsList.forEach((fest, idx) => {
      const isDraft = Boolean(fest.esBorradorPlan);

      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      const nameLines = pdf.splitTextToSize(fest.name, wNombre - 3);

      pdf.setFont("helvetica", "normal");
      const countryLines = pdf.splitTextToSize(fest.country || "-", wPais - 3);
      const deadlineLines = [formatDDMMAA(fest.deadline)];

      const feeText = fest.fee ? `$ ${fest.fee}` : fest.price || "Gratis";
      const feeLines = pdf.splitTextToSize(feeText, wFee - 3);

      const statusText = fest.status || "Por enviar";
      const statusLines = pdf.splitTextToSize(statusText, wEstado - 3);

      // Calculamos maxLines considerando el tag de procedencia que ocupa 1 línea extra
      const maxLinesCount = Math.max(
        nameLines.length + 1,
        countryLines.length,
        feeLines.length,
        statusLines.length,
        1
      );

      const lineStep = 3.3;
      const topPad = 4.2;
      const rowHeight = Math.max(10, maxLinesCount * lineStep + 2.5);

      checkPageBreak(rowHeight + 2);

      if (idx % 2 === 0) {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(248, 250, 252);
      }
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, y, contentWidth, rowHeight, "FD");

      let cellX = margin + 2;

      // 1. Número
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text(String(idx + 1), cellX, y + topPad);
      cellX += wNum;

      // 2. Nombre y Tag de procedencia
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text(nameLines, cellX, y + topPad);

      const tagY = y + topPad + (nameLines.length * lineStep);
      pdf.setFontSize(6.5);
      if (isDraft) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(180, 83, 9); // Amber
        pdf.text("[BORRADOR DE PLAN]", cellX, tagY);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(71, 85, 105);
        pdf.text("[CATÁLOGO OFICIAL]", cellX, tagY);
      }
      cellX += wNombre;

      // 3. País
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 41, 59);
      pdf.text(countryLines, cellX, y + topPad);
      cellX += wPais;

      // 4. Deadline (formato DD/MM/AA)
      pdf.text(deadlineLines, cellX, y + topPad);
      cellX += wDeadline;

      // 5. Fee
      pdf.setFont("helvetica", "bold");
      pdf.text(feeLines, cellX, y + topPad);
      cellX += wFee;

      // 6. Estado de postulación
      pdf.setFont("helvetica", "bold");
      if (fest.status === FestivalStatus.SELECCIONADO || fest.status === FestivalStatus.GANADO) {
        pdf.setTextColor(5, 150, 105); // Emerald
      } else if (fest.status === FestivalStatus.NO_SELECCIONADO || fest.status === FestivalStatus.DESCALIFICADO) {
        pdf.setTextColor(225, 29, 72); // Rose
      } else if (fest.status === FestivalStatus.EN_REVISION) {
        pdf.setTextColor(2, 132, 199); // Sky
      } else {
        pdf.setTextColor(71, 85, 105); // Slate
      }
      pdf.text(statusLines, cellX, y + topPad);

      y += rowHeight;
    });
  }

  // 5. Pie de página formal en todas las páginas generadas
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(140, 150, 160);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    const footerLeft = isInstitucion
      ? `Plan de Distribución Oficial: ${plan.nombre} | ${plan.institucionNombre || "Organismo Regulador"}`
      : `Minuta de Distribución (Uso Interno): ${plan.nombre} | ${plan.institucionNombre || ""}`;

    pdf.text(footerLeft, margin, pageHeight - 7);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 7);
  }

  // Descarga automática en navegador
  const sanitizedPlanName = plan.nombre
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 30);
  const filePrefix = isInstitucion ? "plan_distribucion_oficial" : "minuta_distribucion_interna";
  pdf.save(`${filePrefix}_${sanitizedPlanName}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
