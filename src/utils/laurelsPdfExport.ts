import { jsPDF } from 'jspdf';
import { Festival, FestivalStatus } from '../types';
import { formatDisplayDate } from './helpers';

interface CompressedLaurel {
  dataUrl: string;
  aspect: number;
}

// Helper to load images safely for jsPDF
const loadImg = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (url.startsWith('http')) {
        fetch(`/api/proxy-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json?.dataUrl) {
            const proxyImg = new Image();
            proxyImg.src = json.dataUrl;
            proxyImg.onload = () => resolve(proxyImg);
            proxyImg.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        })
        .catch(() => resolve(null));
      } else {
        resolve(null);
      }
    };
  });
};

// Canvas image compression to shrink raw base64 data and speed up rendering
const compressImage = (img: HTMLImageElement, maxW = 220): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxW) {
        height = (maxW / width) * height;
        width = maxW;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Use PNG to preserve transparency for laurels
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (e) {
      console.error("Error compressing image, fallback to original", e);
      resolve(img.src);
    }
  });
};

// Loader + Compressor combined
const loadAndCompressImgWithAspect = (url: string): Promise<CompressedLaurel | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    const handleLoadedImg = async (loadedImg: HTMLImageElement) => {
      const aspect = (loadedImg.width && loadedImg.height) ? (loadedImg.width / loadedImg.height) : 1.333;
      const compressedDataUrl = await compressImage(loadedImg, 240);
      resolve({ dataUrl: compressedDataUrl, aspect });
    };

    img.onload = () => handleLoadedImg(img);
    img.onerror = () => {
      if (url.startsWith('http')) {
        fetch(`/api/proxy-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json?.dataUrl) {
            const proxyImg = new Image();
            proxyImg.src = json.dataUrl;
            proxyImg.onload = () => handleLoadedImg(proxyImg);
            proxyImg.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        })
        .catch(() => resolve(null));
      } else {
        resolve(null);
      }
    };
  });
};

/**
 * Generates an extremely sophisticated, highly detailed, professional vector laurel wreath
 * on an offline HTML5 Canvas and returns a base64 PNG data URL.
 * This guarantees pristine visual rendering offline with 0% chance of CORS or network failures.
 */
const generateVectorLaurelPng = (isWinner: boolean): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clear background (perfect transparency)
  ctx.clearRect(0, 0, 400, 300);

  const cx = 200;
  const cy = 145;
  const r = 90;

  // Setup rich metallic or pink gradient
  const grad = ctx.createLinearGradient(50, 40, 350, 260);
  if (isWinner) {
    // Elegant Multi-Stop Gold
    grad.addColorStop(0, '#B45309'); // bronze shadow
    grad.addColorStop(0.25, '#D4AF37'); // metallic gold
    grad.addColorStop(0.45, '#FDE047'); // yellow-300 highlight
    grad.addColorStop(0.65, '#FFFBEB'); // warm cream glow
    grad.addColorStop(0.85, '#F59E0B'); // amber-500 midtone
    grad.addColorStop(1, '#92400E'); // amber-800 deep base
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#78350F'; // warm bronze border
  } else {
    // Cardigan Pink Multi-Stop Gradient
    grad.addColorStop(0, '#9D174D'); // pink-800 shadow
    grad.addColorStop(0.25, '#E91E63'); // cardigan pink
    grad.addColorStop(0.45, '#F472B6'); // pink-400 highlight
    grad.addColorStop(0.65, '#FDF2F8'); // pink-50 warm glow
    grad.addColorStop(0.85, '#EC4899'); // pink-500
    grad.addColorStop(1, '#831843'); // pink-900 deep base
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#831843'; // deep pink border
  }

  // 1. Draw organic curved branches
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.5;
  
  // Left branch arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.52 * Math.PI, 1.48 * Math.PI, false);
  ctx.stroke();

  // Right branch arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.48 * Math.PI, -0.48 * Math.PI, true);
  ctx.stroke();

  // 2. Leaf drawing function for beautiful pointed laurel leaves
  const drawLeaf = (startX: number, startY: number, length: number, angle: number, width: number) => {
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    
    // Halfway along the leaf length
    const midX = startX + length * 0.5 * Math.cos(angle);
    const midY = startY + length * 0.5 * Math.sin(angle);
    
    // Orthogonal vector for thickness
    const perpAngle = angle + Math.PI / 2;
    const dx = Math.cos(perpAngle);
    const dy = Math.sin(perpAngle);

    // Curve control points
    const ctrl1X = midX + width * dx;
    const ctrl1Y = midY + width * dy;
    const ctrl2X = midX - width * dx;
    const ctrl2Y = midY - width * dy;

    // Draw leaf body
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrl1X, ctrl1Y, endX, endY);
    ctx.quadraticCurveTo(ctrl2X, ctrl2Y, startX, startY);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1.35;
    ctx.stroke();

    // Draw realistic leaf vein down the center
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + length * 0.88 * Math.cos(angle), startY + length * 0.88 * Math.sin(angle));
    ctx.lineWidth = 0.85;
    ctx.stroke();
  };

  const leafPairs = 8;
  for (let i = 0; i < leafPairs; i++) {
    const t = i / (leafPairs - 1);
    
    // Left branch coordinates
    const leftAngle = 0.52 * Math.PI + t * 0.94 * Math.PI;
    const lpx = cx + r * Math.cos(leftAngle);
    const lpy = cy + r * Math.sin(leftAngle);
    const leftTangent = leftAngle + Math.PI / 2;

    // Right branch coordinates
    const rightAngle = 0.48 * Math.PI - t * 0.94 * Math.PI;
    const rpx = cx + r * Math.cos(rightAngle);
    const rpy = cy + r * Math.sin(rightAngle);
    const rightTangent = rightAngle - Math.PI / 2;

    // Gradual leaf scale reduction towards the top
    const leafLen = 29 * (1 - t * 0.35);
    const leafWid = 8.5 * (1 - t * 0.35);

    // Left leaves (outer + inner)
    drawLeaf(lpx, lpy, leafLen, leftTangent - 0.45, leafWid);
    drawLeaf(lpx, lpy, leafLen * 0.88, leftTangent + 0.38, leafWid * 0.88);

    // Right leaves (outer + inner)
    drawLeaf(rpx, rpy, leafLen, rightTangent + 0.45, leafWid);
    drawLeaf(rpx, rpy, leafLen * 0.88, rightTangent - 0.38, leafWid * 0.88);
  }

  // 3. Draw premium Ribbon Bow at the bottom center joining the branches
  const rx = cx;
  const ry = cy + r;
  ctx.lineWidth = 2.2;

  // Ribbon loop curves
  // Left loop
  ctx.beginPath();
  ctx.moveTo(rx - 3, ry);
  ctx.bezierCurveTo(rx - 32, ry - 16, rx - 38, ry + 16, rx - 3, ry + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right loop
  ctx.beginPath();
  ctx.moveTo(rx + 3, ry);
  ctx.bezierCurveTo(rx + 32, ry - 16, rx + 38, ry + 16, rx + 3, ry + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ribbon Center knot
  ctx.beginPath();
  ctx.arc(rx, ry, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Hanging Ribbon tails
  // Left tail
  ctx.beginPath();
  ctx.moveTo(rx - 4, ry + 4);
  ctx.bezierCurveTo(rx - 25, ry + 25, rx - 18, ry + 36, rx - 20, ry + 42);
  ctx.quadraticCurveTo(rx - 15, ry + 32, rx - 1, ry + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right tail
  ctx.beginPath();
  ctx.moveTo(rx + 4, ry + 4);
  ctx.bezierCurveTo(rx + 25, ry + 25, rx + 18, ry + 36, rx + 20, ry + 42);
  ctx.quadraticCurveTo(rx + 15, ry + 32, rx + 1, ry + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Crown/Star at the top center
  ctx.beginPath();
  const starY = cy - r - 8;
  const starSize = 9.5;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + starSize * Math.cos(angle);
    const y = starY + starSize * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

export const exportLaurelsPDF = async (festivals: Festival[], userName: string) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // ~297mm

  // Load Cardigan's branding logo
  const logoImgLoaded = await loadImg('/images/logo.png');

  // Filter festivals that are Selected, Projected, or Won
  const laurelsList = festivals.filter(f => 
    f.status === FestivalStatus.SELECCIONADO || 
    f.status === FestivalStatus.PROYECTADO || 
    f.status === FestivalStatus.GANADO
  );

  const drawHeader = (pageNum: number, totalPages: number) => {
    // Top luxury border (gold tone)
    pdf.setFillColor(212, 175, 55); // Metallic Gold #D4AF37
    pdf.rect(10, 10, pageWidth - 20, 1.5, 'F');

    // Title updated to "LAURELES Y SELECCIONES"
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    const titleText = 'LAURELES Y SELECCIONES';
    pdf.text(titleText, 15, 21);

    const titleWidth = pdf.getTextWidth(titleText);
    const logoX = 15 + titleWidth + 4; // 4mm spacing

    if (logoImgLoaded) {
      try {
        const logoH = 6; // height of logo in mm
        const logoW = logoH * (logoImgLoaded.width / logoImgLoaded.height);
        pdf.addImage(logoImgLoaded, 'PNG', logoX, 15.5, logoW, logoH);
      } catch (err) {
        console.error("Error rendering brand logo on laurels PDF", err);
      }
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`Generado por: ${userName} | Fecha: ${formatDisplayDate(new Date().toISOString()).split(' - ')[0]}`, 15, 26);

    // Decorative subtitle line
    pdf.setDrawColor(241, 245, 249); // slate-100
    pdf.setLineWidth(0.5);
    pdf.line(15, 30, pageWidth - 15, 30);

    // Page Number
    pdf.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 15, 21, { align: 'right' });
  };

  const drawEmptyState = () => {
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(15, 45, pageWidth - 30, 80, 'F');
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.rect(15, 45, pageWidth - 30, 80, 'D');

    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('No hay festivales seleccionados, proyectados o ganados', pageWidth / 2, 80, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text('Actualiza el estado de tus postulaciones para que aparezcan automáticamente en este dosier.', pageWidth / 2, 88, { align: 'center' });
  };

  if (laurelsList.length === 0) {
    drawHeader(1, 1);
    drawEmptyState();
    pdf.save(`informe_laureles_y_selecciones_${Date.now()}.pdf`);
    return;
  }

  // Pre-load and compress all custom uploaded laurel images asynchronously
  const loadedLaurels: { [id: string]: CompressedLaurel | null } = {};
  for (const f of laurelsList) {
    if (f.laurel) {
      try {
        loadedLaurels[f.id] = await loadAndCompressImgWithAspect(f.laurel);
      } catch (err) {
        console.error("Error loading laurel for: " + f.name, err);
        loadedLaurels[f.id] = null;
      }
    }
  }

  // Grid constants: 2 columns, 3 rows per page
  const cardW = 85;
  const cardH = 72;
  const colGap = 10;
  const rowGap = 8;
  const startX = 15;
  const startY = 40;
  const cardsPerPage = 6;

  const totalPages = Math.ceil(laurelsList.length / cardsPerPage);

  laurelsList.forEach((f, idx) => {
    const pageIndex = Math.floor(idx / cardsPerPage);
    const itemIndexOnPage = idx % cardsPerPage;

    if (itemIndexOnPage === 0 && pageIndex > 0) {
      pdf.addPage();
    }

    if (itemIndexOnPage === 0) {
      drawHeader(pageIndex + 1, totalPages);
    }

    const col = itemIndexOnPage % 2;
    const row = Math.floor(itemIndexOnPage / 2);

    const x = startX + col * (cardW + colGap);
    const y = startY + row * (cardH + rowGap);

    const isWinner = f.status === FestivalStatus.GANADO;

    // --- CARD CONTAINER ---
    // Background: Pure White
    // Border: Pink Accent #e91e63
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(233, 30, 99);
    pdf.setLineWidth(0.45);
    
    // Elegant rounded card corners (3.5mm radius)
    pdf.roundedRect(x, y, cardW, cardH, 3.5, 3.5, 'FD');

    // Subtle luxury highlight band on top of each card (Gold for winners, Soft pink for selections)
    if (isWinner) {
      pdf.setFillColor(217, 119, 6); // amber-600 gold line
      pdf.rect(x + 8, y + 2.5, cardW - 16, 0.6, 'F');
    } else {
      pdf.setFillColor(244, 143, 177); // soft pink accent line
      pdf.rect(x + 8, y + 2.5, cardW - 16, 0.5, 'F');
    }

    // --- LAUREL IMAGE RENDERING ---
    // The designated laurel bounding box is 44mm Wide x 24mm High
    const maxBoxW = 44;
    const maxBoxH = 24;
    let finalW = maxBoxW;
    let finalH = maxBoxH;
    
    // Choose custom laurel image or our premium dynamic generated vector laurel
    let laurelDataUrl = '';
    let laurelAspect = 1.333; // Default 4:3 aspect ratio of our generator

    const customLaurel = f.laurel ? loadedLaurels[f.id] : null;
    if (customLaurel) {
      laurelDataUrl = customLaurel.dataUrl;
      laurelAspect = customLaurel.aspect;
    } else {
      // Generate highly detailed vector laurel with exact same 4:3 aspect ratio
      laurelDataUrl = generateVectorLaurelPng(isWinner);
      laurelAspect = 1.333;
    }

    // Mathematically preserve aspect ratio perfectly (Never stretch!)
    const boxAspect = maxBoxW / maxBoxH;
    if (laurelAspect > boxAspect) {
      finalW = maxBoxW;
      finalH = maxBoxW / laurelAspect;
    } else {
      finalH = maxBoxH;
      finalW = maxBoxH * laurelAspect;
    }
    
    const laurelX = x + (cardW - finalW) / 2;
    const laurelY = y + 5 + (maxBoxH - finalH) / 2; // Vertically centered within upper zone

    // If laurelBg backdrop configuration is specified, draw a soft decorative backdrop circle
    if (f.laurel && f.laurelBg) {
      if (f.laurelBg === 'white') {
        pdf.setFillColor(248, 250, 252); // slate-50 delicate backdrop
        pdf.ellipse(x + cardW / 2, y + 17, 19, 11, 'F');
      } else if (f.laurelBg === 'black') {
        pdf.setFillColor(15, 23, 42); // slate-900 dark backdrop
        pdf.ellipse(x + cardW / 2, y + 17, 19, 11, 'F');
      }
    }

    // Draw laurel image securely
    try {
      pdf.addImage(laurelDataUrl, 'PNG', laurelX, laurelY, finalW, finalH);
    } catch (e) {
      console.error("Error drawing laurel onto PDF:", e);
      // Fallback star icon in case of severe error
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(isWinner ? 217 : 233, isWinner ? 119 : 30, isWinner ? 6 : 99);
      pdf.text('★', x + cardW / 2, y + 18, { align: 'center' });
    }

    // --- FESTIVAL TYPOGRAPHY (Deep Slate-900 for absolute contrast on white) ---
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);

    const nameLines: string[] = pdf.splitTextToSize(f.name.toUpperCase(), cardW - 10);
    let titleY = y + 36;
    let categoryY = y + 43;
    let countryDateY = y + 48;

    if (nameLines.length > 1) {
      titleY = y + 34;
      pdf.text(nameLines[0], x + cardW / 2, titleY, { align: 'center' });
      const secondLine = nameLines.slice(1).join(' ');
      const truncatedSecond = secondLine.length > 38 ? secondLine.substring(0, 35) + '...' : secondLine;
      pdf.text(truncatedSecond, x + cardW / 2, titleY + 3.8, { align: 'center' });

      // Offset subsequent text groups downwards to prevent overlaps
      categoryY = y + 43.5;
      countryDateY = y + 48.5;
    } else {
      pdf.text(nameLines[0], x + cardW / 2, titleY, { align: 'center' });
    }

    // Category (Slate-600)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(f.category || 'Categoría no especificada', x + cardW / 2, categoryY, { align: 'center' });

    // Country & Date (Slate-500)
    const countryText = f.country ? f.country.toUpperCase() : 'PAÍS NO ESPECIFICADO';
    const dateText = f.projectionDate ? formatDisplayDate(f.projectionDate).split(' - ')[0] : 'Fecha a confirmar';
    pdf.setFont('helvetica', 'medium');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${countryText} • ${dateText}`, x + cardW / 2, countryDateY, { align: 'center' });

    // --- STATUS BADGES ---
    const badgeY = y + 53.5;
    const badgeH = 5.5;
    const badgeW = 55;
    const badgeX = x + (cardW - badgeW) / 2;

    if (isWinner) {
      // Golden Amber Badge
      pdf.setFillColor(254, 243, 199); // amber-100
      pdf.setDrawColor(252, 211, 77); // amber-300
      pdf.setLineWidth(0.35);
      pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');

      pdf.setTextColor(146, 64, 14); // amber-800
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      const nominationText = f.nomination && f.nomination !== 'Ninguna' && f.nomination !== 'Sin confirmar' 
        ? f.nomination 
        : '🏆 PREMIO GANADO';
      const truncNom = nominationText.length > 28 ? nominationText.substring(0, 26) + '...' : nominationText;
      pdf.text(truncNom.toUpperCase(), x + cardW / 2, badgeY + 4, { align: 'center' });
    } else {
      // Pink Badge
      pdf.setFillColor(251, 207, 232); // pink-100
      pdf.setDrawColor(244, 143, 177); // pink-300
      pdf.setLineWidth(0.35);
      pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');

      pdf.setTextColor(194, 24, 91); // pink-800
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      const labelText = f.status === FestivalStatus.PROYECTADO ? 'SELECCIÓN PROYECTADA' : 'SELECCIÓN OFICIAL';
      pdf.text(labelText, x + cardW / 2, badgeY + 4, { align: 'center' });
    }

    // --- FOOTER NOTES / NOMINATIONS ---
    if (f.nomination && f.nomination !== 'Ninguna' && f.nomination !== 'Sin confirmar' && !isWinner) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(6.5);
      pdf.setTextColor(194, 24, 91); // deep pink
      const truncatedDetail = f.nomination.length > 42 ? f.nomination.substring(0, 40) + '...' : f.nomination;
      pdf.text(`Nominación: "${truncatedDetail}"`, x + cardW / 2, y + 66, { align: 'center' });
    } else if (f.observations && f.observations.toLowerCase().includes('laurel')) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105); // slate-600
      const truncatedObs = f.observations.length > 42 ? f.observations.substring(0, 40) + '...' : f.observations;
      pdf.text(`Nota: "${truncatedObs}"`, x + cardW / 2, y + 66, { align: 'center' });
    }
  });

  pdf.save(`informe_laureles_y_selecciones_${Date.now()}.pdf`);
};
