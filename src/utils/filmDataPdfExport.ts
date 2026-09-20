import { jsPDF } from 'jspdf';
import { FilmData } from '../types';

const logoUrl = '/images/logo.png';
const bgUrl = '/images/insert01_Fondo.png';

const loadRotatedImg = (url: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        // Compress as JPEG for reasonable PDF size
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

const loadImg = async (url: string): Promise<HTMLImageElement | null> => {
  return new Promise(async (resolve) => {
    const tryProxy = async () => {
       try {
           const proxyRes = await fetch(`/api/proxy-image`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ url })
           });
           if (proxyRes.ok) {
              const resJson = await proxyRes.json();
              if (resJson.dataUrl) {
                 const newImg = new Image();
                 newImg.src = resJson.dataUrl;
                 newImg.onload = () => resolve(newImg);
                 newImg.onerror = () => resolve(null);
                 return;
              }
           }
       } catch (e) {
          console.warn("Proxy failed for", url, e);
       }
       resolve(null);
    };

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => {
       // if it fails, try proxy!
       tryProxy();
    };
  });
};

export const exportFilmDataPDF = async (data: FilmData) => {
  const rotatedBg = await loadRotatedImg(bgUrl);
  const logoImg = await loadImg(logoUrl);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth(); // ~210
  const pageHeight = pdf.internal.pageSize.getHeight(); // ~297
  
  let currentY = 15;
  const marginX = 25;
  const contentWidth = pageWidth - marginX * 2;
  
  const addBackground = () => {
    if (rotatedBg) {
      pdf.addImage(rotatedBg, 'JPEG', 0, 0, pageWidth, pageHeight);
    }
  };

  const drawLogo = () => {
    if (logoImg) {
      // Even larger logo
      const logoW = 150;
      const aspect = logoImg.height / logoImg.width;
      const logoH = logoW * aspect;
      pdf.addImage(logoImg, 'PNG', (pageWidth - logoW) / 2, currentY, logoW, logoH);
      currentY += logoH + 10; // some spacing
    } else {
      currentY += 20;
    }
  };
  
  const checkPageBreak = (needed: number) => {
    if (currentY + needed > pageHeight - 20) {
      pdf.addPage();
      currentY = 20;
      addBackground();
      return true;
    }
    return false;
  };

  // Build first page
  addBackground();
  drawLogo();


  const drawKV = (label: string, value: string, useFullWidth = false, centered = false) => {
    if (!value || value.trim() === '') return;
    
    // Calculate height
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    
    // Label can be inline if short and text is short, but for cleaner docs let's stack or use inline 
    // depending on useFullWidth flag or just inline with word wrap.
    
    if (useFullWidth) {
      checkPageBreak(10);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(14, 61, 82); // #0E3D52
      if (centered) {
        pdf.text(label.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
      } else {
        pdf.text(label.toUpperCase(), marginX, currentY);
      }
      currentY += 6;
      
      pdf.setFont('times', 'normal');
      pdf.setTextColor(14, 61, 82); // #0E3D52
      
      // Calculate paragraphs to prevent orphaned words
      const paragraphs = value.split('\n');
      for (const p of paragraphs) {
         if (!p.trim()) {
           currentY += 4;
           checkPageBreak(10);
           continue;
         }
         const pLines = pdf.splitTextToSize(p, contentWidth);
         for (let i = 0; i < pLines.length; i++) {
           if (checkPageBreak(10)) {
             // Redraw background if we just flipped page (the pagebreak adds background automatically)
           }
           if (centered) {
             pdf.text(pLines[i], pageWidth / 2, currentY, { align: 'center' });
           } else {
             pdf.text(pLines[i], marginX, currentY);
           }
           currentY += 5;
         }
         currentY += 2; // Paragraph spacing
      }
      currentY += 4;
    } else {
      const labelW = pdf.getTextWidth(label + ": ");
      const valW = contentWidth - labelW;
      
      pdf.setFont('times', 'normal');
      pdf.setTextColor(14, 61, 82); // #0E3D52
      const valLines = pdf.splitTextToSize(value, valW);
      const ht = valLines.length * 5;
      
      checkPageBreak(Math.max(10, ht + 2));
      
      pdf.setFont('times', 'bold');
      pdf.setTextColor(14, 61, 82); // #0E3D52
      pdf.text(label + ": ", marginX, currentY);
      
      pdf.setFont('times', 'normal');
      pdf.setTextColor(14, 61, 82); // #0E3D52
      pdf.text(valLines, marginX + labelW, currentY);
      
      currentY += ht + 4;
    }
  };

  const drawSectionTitle = (title: string) => {
    checkPageBreak(15);
    currentY += 5;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(14, 61, 82); // #0E3D52
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
    
    // underline
    pdf.setDrawColor(14, 61, 82); // #0E3D52
    pdf.setLineWidth(0.3);
    pdf.line((pageWidth - titleWidth) / 2 - 5, currentY + 2, (pageWidth + titleWidth) / 2 + 5, currentY + 2);
    
    currentY += 12;
  };

  // -- LOGLINE & SINOPSIS --
  if (data.history.logline || data.history.synopsis) {
    if (data.history.logline) drawKV("Logline", data.history.logline, true, true);
    if (data.history.synopsis) drawKV("Sinopsis", data.history.synopsis, true, true);
  }

  const drawKVPair = (label: string, value: string, alternate: boolean) => {
    if (!value || value.trim() === '') return;
    
    // Evaluate height needed
    const labelW = 40;
    const padding = 3;
    const valW = contentWidth - labelW - padding * 3;
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    const valLines = pdf.splitTextToSize(value, valW);
    const rowHeight = Math.max(10, valLines.length * 5 + padding * 2);
    
    checkPageBreak(rowHeight);
    
    // Draw borders
    pdf.setDrawColor(14, 61, 82); // #0E3D52 border
    pdf.setLineWidth(0.2);
    pdf.rect(marginX, currentY, contentWidth, rowHeight, 'S');
    pdf.line(marginX + labelW + padding, currentY, marginX + labelW + padding, currentY + rowHeight);
    
    pdf.setFont('times', 'bold');
    pdf.setTextColor(14, 61, 82);
    pdf.text(label.toUpperCase(), marginX + padding, currentY + 6);
    
    pdf.setFont('times', 'normal');
    pdf.setTextColor(14, 61, 82);
    pdf.text(valLines, marginX + labelW + padding * 2, currentY + 6);
    
    currentY += rowHeight;
  };

  const drawTechSpecsTable = () => {
    const specsMap = [
      {k: "Director/a", v: data.techSpecs.director},
      {k: "País", v: data.techSpecs.country},
      {k: "Duración", v: data.techSpecs.duration},
      {k: "Formato", v: data.techSpecs.format},
      {k: "Completado en", v: data.techSpecs.date},
      {k: "Género", v: data.techSpecs.genre},
      {k: "Técnica", v: data.techSpecs.technique},
      {k: "Música", v: data.techSpecs.music},
      {k: "Clasificación", v: data.techSpecs.rating},
      {k: "Production", v: data.techSpecs.producedWithin}
    ].filter(item => item.v && item.v.trim() !== '');

    if (specsMap.length === 0) return;

    drawSectionTitle("Ficha Técnica");
    specsMap.forEach((spec, index) => {
      drawKVPair(spec.k, spec.v, index % 2 !== 0);
    });
  };

  drawTechSpecsTable();

  // Page 2: Biography, Credits, Contact
  if (data.biography || (data.credits && data.credits.length > 0) || (data.contactInfo && data.contactInfo.length > 0)) {
    pdf.addPage();
    currentY = 20;
    addBackground();
  }

  if (data.biography) {
    drawSectionTitle("Biografía del Director");
    drawKV("Biografía", data.biography, true);
  }

  if (data.credits && data.credits.length > 0) {
    drawSectionTitle("Créditos");
    data.credits.forEach(c => {
      if (c.role || c.name) {
        drawKV(c.role || "Crédito", c.name + (c.social ? ` (${c.social})` : ''));
      }
    });
  }

  if (data.contactInfo && data.contactInfo.length > 0) {
    drawSectionTitle("Datos de Contacto");
    data.contactInfo.forEach(c => {
      checkPageBreak(20);
      if (c.title) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(14, 61, 82);
        pdf.text(c.title.toUpperCase(), marginX, currentY);
        currentY += 6;
      }
      
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      c.lines.forEach(line => {
        if (!line.value && !line.label) return;
        drawKV(line.label || "Info", line.value || (line.isLink ? line.linkUrl || '' : ''));
      });
      currentY += 4;
    });
  }

  // Draw bottom institution logos
  if (data.bottomLogos && data.bottomLogos.length > 0) {
    const bottomImages = await Promise.all(data.bottomLogos.map(url => loadImg(url)));
    const validLogos = bottomImages.filter(img => img !== null);
    
    if (validLogos.length > 0) {
      checkPageBreak(40); // ensure space for logos
      
      // Place logos below the content with reasonable spacing and not forced to the bottom,
      // avoiding extra empty pages when space is tight.
      let logosY = currentY + 5;
      
      const maxWidthPerLogo = contentWidth / validLogos.length - 10;
      const targetHeight = 25; // uniform height
      
      let totalWidth = 0;
      const dimensions = validLogos.map(img => {
        const aspect = img!.width / img!.height;
        const w = Math.min(targetHeight * aspect, maxWidthPerLogo);
        totalWidth += w;
        return { w, h: Math.min(targetHeight, w / aspect) };
      });
      
      const spacing = validLogos.length > 1 ? (contentWidth - totalWidth) / (validLogos.length - 1) : 0;
      let currX = validLogos.length === 1 ? pageWidth / 2 - dimensions[0].w / 2 : marginX;
      
      validLogos.forEach((img, idx) => {
        const { w, h } = dimensions[idx];
        pdf.addImage(img!, 'PNG', currX, logosY + (targetHeight - h) / 2, w, h);
        currX += w + Math.min(spacing, 20); // space them nicely
      });
      currentY = logosY + targetHeight + 10;
    }
  }

  // Save PDF
  const cleanTitle = (data.techSpecs.title || 'documento').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  pdf.save(`${cleanTitle}_presentacion.pdf`);
};
