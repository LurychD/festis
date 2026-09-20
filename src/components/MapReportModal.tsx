import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { X, FileDown, Loader2, Map as MapIcon } from 'lucide-react';
import { Festival, FestivalStatus } from '../types';
import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import * as topojsonClient from 'topojson-client';

const formatFestDate = (dStr?: string) => {
    if (!dStr) return '';
    try {
        const d = parseISO(dStr);
        if (isNaN(d.getTime())) return dStr;
        if (dStr.includes('T')) {
            return format(d, 'dd/MM/yyyy HH:mm') + ' hs';
        } else {
            return format(d, 'dd/MM/yyyy');
        }
    } catch {
       return dStr;
    }
};

interface MapReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  festivals: Festival[];
  userName: string;
}

export const MapReportModal: React.FC<MapReportModalProps> = ({ isOpen, onClose, festivals, userName }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('Mundo');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countriesList, setCountriesList] = useState<string[]>([]);
  const [worldGeoJson, setWorldGeoJson] = useState<any>(null);
  const [statesGeoJson, setStatesGeoJson] = useState<any>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isOpen && !worldGeoJson) {
      setLoading(true);
      fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        .then(r => r.json())
        .then(data => {
           setWorldGeoJson(data);
           const names = Array.from(new Set(data.features.map((f: any) => f.properties.name).filter(Boolean))).sort() as string[];
           setCountriesList(['Mundo', ...names]);
           setLoading(false);
        })
        .catch(err => {
           console.error(err);
           setErrorMsg('Error cargando datos del mapa mundial.');
           setLoading(false);
        });
    }
  }, [isOpen, worldGeoJson]);

  useEffect(() => {
    if (!worldGeoJson || !isOpen || !selectedCountry) return;
    
    if (selectedCountry === 'Mundo') {
       setStatesGeoJson(null);
       return;
    }

    const targetFeature = worldGeoJson.features.find((f: any) => 
       f.properties.name.toLowerCase() === selectedCountry.toLowerCase()
    );
    if (!targetFeature || !targetFeature.id) {
       setStatesGeoJson(null);
       return;
    }

    const fetchStates = async () => {
        try {
            const r = await fetch(`https://restcountries.com/v3.1/alpha/${targetFeature.id}`);
            if (!r.ok) return;
            const j = await r.json();
            const code2 = j[0].cca2.toLowerCase();

            const hr = await fetch(`https://code.highcharts.com/mapdata/countries/${code2}/${code2}-all.topo.json`);
            if (!hr.ok) {
               setStatesGeoJson(null);
               return;
            }
            const topo = await hr.json();
            const objName = Object.keys(topo.objects)[0];
            const featureFn = (topojsonClient as any).feature || (topojsonClient as any).default?.feature;
            if (!featureFn) {
                console.error("topojson.feature is not available", topojsonClient);
                setStatesGeoJson(null);
                return;
            }
            const geojson = featureFn(topo, topo.objects[objName] as any);
            setStatesGeoJson(geojson);
        } catch (e) {
            console.warn("Failed to load states boundaries", e);
            setStatesGeoJson(null);
        }
    };
    fetchStates();
  }, [selectedCountry, worldGeoJson, isOpen]);

  const countryFests = useMemo(() => {
    if (!worldGeoJson || !selectedCountry) return [];
    
    let fests = [];
    if (selectedCountry === 'Mundo') {
        fests = festivals.filter(f => {
            if (f.status === FestivalStatus.POR_ENVIAR || f.status === FestivalStatus.NO_SELECCIONADO) return false;
            if (!f.projectionLat || !f.projectionLng || !f.projectionLocation) return false;
            return true;
        });
    } else {
        const targetFeature = worldGeoJson.features.find((f: any) => 
           f.properties.name.toLowerCase() === selectedCountry.toLowerCase()
        );

        if (!targetFeature) return [];
        
        fests = festivals.filter(f => {
           if (f.status === FestivalStatus.POR_ENVIAR || f.status === FestivalStatus.NO_SELECCIONADO) return false;
           if (!f.projectionLat || !f.projectionLng || !f.projectionLocation) return false;
           
           // Primary check using geographical bounds
           const isGeographicallyInside = d3.geoContains(targetFeature, [f.projectionLng, f.projectionLat]);
           
           // Fallback checks using country name (e.g. "Argentina") or 3-letter ISO code (e.g. "ARG")
           const countryField = f.country || '';
           const nameMatch = countryField.toLowerCase().includes(selectedCountry.toLowerCase());
           const codeMatch = targetFeature.id && countryField.toUpperCase().includes(targetFeature.id.toUpperCase());
           
           return isGeographicallyInside || nameMatch || codeMatch;
        });
    }

    return fests.sort((a, b) => (a.country || '').localeCompare(b.country || '') || a.name.localeCompare(b.name));
  }, [worldGeoJson, selectedCountry, festivals]);

  useEffect(() => {
    if (worldGeoJson && selectedCountry && isOpen) {
       drawMap();
    }
  }, [worldGeoJson, selectedCountry, isOpen, countryFests, statesGeoJson]);

  const drawMap = () => {
    if (!worldGeoJson || !svgRef.current) return;
    
    const width = 800;
    const height = 800;
    let targetFeature: any = null;
    let projection: d3.GeoProjection;

    if (selectedCountry === 'Mundo') {
        projection = d3.geoNaturalEarth1().fitExtent([[0, 0], [width, height]], { type: 'FeatureCollection', features: worldGeoJson.features } as any);
    } else {
        targetFeature = worldGeoJson.features.find((f: any) => 
           f.properties.name.toLowerCase() === selectedCountry.toLowerCase()
        );

        if (!targetFeature) {
           setErrorMsg('País no encontrado en el mapa base.');
           return;
        }
        projection = d3.geoMercator().fitExtent([[50, 50], [width - 50, height - 50]], targetFeature);
    }
    
    setErrorMsg('');

    const svg = d3.select(svgRef.current);
    
    svg.selectAll("*").remove();

    const path = d3.geoPath().projection(projection);

    svg.append("rect")
       .attr("width", width)
       .attr("height", height)
       .attr("fill", "#f8fafc");

    const countriesWithFests = new Set<string>();
    if (selectedCountry === 'Mundo') {
        countryFests.forEach(f => {
            const feature = worldGeoJson.features.find((feature: any) => 
                d3.geoContains(feature, [f.projectionLng!, f.projectionLat!])
            );
            if (feature) {
                countriesWithFests.add(feature.properties.name.toLowerCase());
            }
        });
    }

    // All countries
    svg.append("g")
       .selectAll("path")
       .data(worldGeoJson.features)
       .enter()
       .append("path")
       .attr("d", path as any)
       .attr("fill", (d: any) => {
           if (selectedCountry === 'Mundo') {
               return countriesWithFests.has(d.properties.name.toLowerCase()) ? "#fce4ec" : "#e2e8f0";
           }
           if (d.properties.name.toLowerCase() === selectedCountry.toLowerCase()) {
              return "#fce4ec"; // pastel pink for selected country
           }
           return "#e2e8f0"; // slate-200 for neighbors
       })
       .style("stroke", "#ffffff")
       .style("stroke-width", 1.5)
       .style("opacity", (d: any) => {
           if (selectedCountry === 'Mundo') {
               return countriesWithFests.has(d.properties.name.toLowerCase()) ? 1 : 0.8;
           }
           return d.properties.name.toLowerCase() === selectedCountry.toLowerCase() ? 1 : 0.8;
       });

    // States boundaries map
    if (statesGeoJson && selectedCountry !== 'Mundo') {
       svg.append("g")
          .selectAll("path")
          .data(statesGeoJson.features)
          .enter()
          .append("path")
          .attr("d", path as any)
          .attr("fill", "transparent")
          .style("stroke", "rgba(233, 30, 99, 0.35)") // subtle pink highlight matching brand
          .style("stroke-width", 1)
          .style("pointer-events", "none");
    }

    const markers = svg.append("g");

    countryFests.forEach((fest, i) => {
       const coords = projection([fest.projectionLng!, fest.projectionLat!]);
       if (coords) {
          if (fest.laurel && selectedCountry !== 'Mundo') {
             const markerRadius = 24; // Larger circle for laurel
             // Marker background circle
             markers.append("circle")
                .attr("cx", coords[0])
                .attr("cy", coords[1])
                .attr("r", markerRadius)
                .attr("fill", fest.laurelBg === 'white' ? '#ffffff' : fest.laurelBg === 'black' ? '#000000' : '#ffffff')
                .attr("stroke", "#e91e63")
                .attr("stroke-width", 2.5);

             // Draw laurel inside the circle
             markers.append("image")
                .attr("href", fest.laurel)
                .attr("x", coords[0] - markerRadius + 4)
                .attr("y", coords[1] - markerRadius + 4)
                .attr("width", markerRadius * 2 - 8)
                .attr("height", markerRadius * 2 - 8)
                .attr("preserveAspectRatio", "xMidYMid meet");

             // Draw small number badge
             markers.append("circle")
                .attr("cx", coords[0] + markerRadius - 6)
                .attr("cy", coords[1] - markerRadius + 6)
                .attr("r", 9)
                .attr("fill", "#e91e63")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 1.5);

             markers.append("text")
                .attr("x", coords[0] + markerRadius - 6)
                .attr("y", coords[1] - markerRadius + 9.5)
                .text(i + 1)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .attr("fill", "#ffffff");
          } else {
             markers.append("circle")
                .attr("cx", coords[0])
                .attr("cy", coords[1])
                .attr("r", 12)
                .attr("fill", "#e91e63")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2.5);

             markers.append("text")
                .attr("x", coords[0])
                .attr("y", coords[1] + 4)
                .text(i + 1)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("fill", "#ffffff");
          }
       }
    });
  };

  const handleExportPDF = async () => {
    if (!svgRef.current) return;
    try {
      setLoading(true);
      
      const svgElement = svgRef.current;
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Convert all image hrefs to base64 before serializing to ensure they render on Canvas
      const images = clone.querySelectorAll('image');
      for (let i = 0; i < images.length; i++) {
        const imgNode = images[i];
        const href = imgNode.getAttribute('href') || imgNode.getAttribute('xlink:href');
        
        if (href && !href.startsWith('data:')) {
           try {
              // Use proxy to get around CORS issues with Firebase storage images
              let b64 = "";
              try {
                  const proxyUrl = `/api/proxy-image`;
                  const proxyRes = await fetch(proxyUrl, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ url: href })
                  });
                  
                  if (!proxyRes.ok) {
                     throw new Error(`Proxy error: ${proxyRes.status}`);
                  }
                  
                  const proxyJson = await proxyRes.json();
                  if (proxyJson.dataUrl) {
                     b64 = proxyJson.dataUrl;
                  } else {
                     throw new Error("No dataUrl in proxy response");
                  }
              } catch (proxyErr) {
                  console.warn("Proxy failed, falling back to direct fetch", proxyErr);
                  const res = await fetch(href, { mode: 'cors', cache: 'no-cache' });
                  const blob = await res.blob();
                  b64 = await new Promise<string>((resolve) => {
                     const reader = new FileReader();
                     reader.onloadend = () => resolve(reader.result as string);
                     reader.readAsDataURL(blob);
                  });
              }

              imgNode.setAttribute('href', b64);
              if (imgNode.hasAttribute('xlink:href')) {
                  imgNode.setAttribute('xlink:href', b64);
              }
           } catch (e) {
              console.error('Failed to convert svg image to base64:', href, e);
           }
        }
      }

      // Add namespaces required for some renderers
      if (!clone.getAttribute('xmlns')) {
         clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      if (!clone.getAttribute('xmlns:xlink')) {
         clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      }

      const svgData = new XMLSerializer().serializeToString(clone);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      const TARGET_DIM = 2400; // 3x scale to prevent pixelation
      
      const logoImg = new Image();
      await new Promise<void>((resolve, reject) => {
         logoImg.onload = () => resolve();
         logoImg.onerror = reject;
         logoImg.src = '/images/logo.png';
      }).catch(e => console.warn('Could not load logo for PDF', e));

      await new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = TARGET_DIM; 
          canvas.height = TARGET_DIM; 
          if (ctx) {
             ctx.fillStyle = "#fff";
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             ctx.drawImage(img, 0, 0, TARGET_DIM, TARGET_DIM);
          }
          resolve(null);
        };
        img.onerror = reject;
        img.src = url;
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      URL.revokeObjectURL(url);
      
      const doc = new jsPDF({
         orientation: 'landscape',
         unit: 'mm',
         format: 'a4'
      });

      const startPDFRender = () => {
          const now = new Date();
          const generatedDateStr = format(now, 'dd/MM/yyyy HH:mm');

          let logoWidth = 0;
          if (logoImg.complete && logoImg.naturalWidth) {
              const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
              const h = 10;
              logoWidth = h * aspect;
          }

          const drawPageDecorations = (isMundoCover: boolean) => {
              if (isMundoCover) {
                  doc.addImage(imgData, 'PNG', 20, -25, 257, 257);
              } else if (selectedCountry !== 'Mundo') {
                  doc.addImage(imgData, 'PNG', 140, 30, 150, 150);
              }

              if (logoWidth > 0) {
                  doc.addImage(logoImg as any, 'PNG', 15, 12, logoWidth, 10);
              }

              const baseX = 15 + logoWidth + (logoWidth ? 5 : 0);

              doc.setTextColor(30, 41, 59); // slate-800
              doc.setFontSize(20);
              doc.setFont("helvetica", "bold");
              doc.text(`Proyecciones en `, baseX, 20);
              
              const titleWidth = doc.getTextWidth(`Proyecciones en `);
              doc.setTextColor(233, 30, 99); // pink-500
              doc.text(selectedCountry === 'Mundo' ? 'el Mundo' : selectedCountry, baseX + titleWidth, 20);

              if (!isMundoCover) {
                  doc.setFontSize(9);
                  doc.setFont("helvetica", "normal");
                  doc.setTextColor(100, 116, 139);
                  doc.text(`Generado: ${generatedDateStr} hs • Por: ${userName}`, 15, 30);
              }
          };

          let isMundoCover = selectedCountry === 'Mundo';
          drawPageDecorations(isMundoCover);

          if (isMundoCover) {
              doc.addPage();
              isMundoCover = false;
              drawPageDecorations(isMundoCover);
          }

          let yOffset = 40;
          let leftCol = true;
          
          countryFests.forEach((fest, i) => {
             if (yOffset > 185) {
                 if (selectedCountry === 'Mundo' && leftCol) {
                     leftCol = false;
                     yOffset = 40;
                 } else {
                     doc.addPage();
                     drawPageDecorations(false);
                     yOffset = 40;
                     leftCol = true;
                 }
             }
             
             let xOffset = 15;
             let colWidth = 120;
             if (selectedCountry === 'Mundo') {
                 colWidth = 130;
                 xOffset = leftCol ? 15 : 152;
             }
             
             // Box
             doc.setFillColor(255, 255, 255);
             doc.setDrawColor(226, 232, 240); // slate-200
             doc.roundedRect(xOffset, yOffset, colWidth, 14, 2, 2, 'FD'); 
             
             // Circle marker
             doc.setFillColor(233, 30, 99); // pink
             doc.circle(xOffset + 5, yOffset + 7, 3.5, 'F');
             doc.setTextColor(255, 255, 255);
             doc.setFontSize(8);
             doc.setFont("helvetica", "bold");
             doc.text(`${i + 1}`, xOffset + 5, yOffset + 8.5, { align: 'center' });
             
             // Details
             doc.setFontSize(10);
             doc.setFont("helvetica", "bold");
             doc.setTextColor(30, 41, 59);
             doc.text(fest.name, xOffset + 11, yOffset + 6.5);

             const titleWidth = doc.getTextWidth(fest.name);
             doc.setTextColor(77, 77, 77);
             doc.setFontSize(8);
             doc.setFont("helvetica", "normal");
             doc.text(` - ${fest.country}`, xOffset + 11 + titleWidth, yOffset + 6.5);
             
             doc.setTextColor(100, 116, 139);
             doc.setFontSize(8);
             doc.setFont("helvetica", "normal");
             let detailsStr = `${fest.category || 'N/A'} • ${fest.status || 'N/A'}`;
             if (fest.projectionDate) {
                 detailsStr += ` • ${formatFestDate(fest.projectionDate)}`;
             }
             doc.text(detailsStr, xOffset + 11, yOffset + 11.5);

             yOffset += 18;
          });
          
          if (countryFests.length === 0) {
              doc.setTextColor(100, 116, 139);
              doc.setFontSize(10);
              doc.text("No hay festivales registrados en esta ubicación.", 15, 50);
          }
      };
      
      startPDFRender();
      doc.save(`Mapa_${selectedCountry.replace(" ", "_")}_${new Date().getTime()}.pdf`);
    } catch(err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al generar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[95vh] sm:h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#e91e63]">
                 <MapIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">
                 Informe de Mapa
              </h2>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
             <X className="h-5 w-5" />
           </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
           <div className="flex-1 max-w-sm">
             <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Seleccionar Región / País</label>
             <select 
               value={selectedCountry}
               onChange={(e) => setSelectedCountry(e.target.value)}
               className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-pink-500"
             >
               {countriesList.map((c, idx) => (
                 <option key={`${c}-${idx}`} value={c}>{c}</option>
               ))}
             </select>
           </div>
           
           <div className="pt-5 flex items-center gap-3">
              <button 
                 onClick={handleExportPDF}
                 disabled={loading || !!errorMsg || !worldGeoJson}
                 className="flex items-center gap-2 bg-[#e91e63] text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-pink-700 transition disabled:opacity-50"
              >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                 Descargar PDF
              </button>
           </div>
        </div>

        <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex flex-col md:flex-row gap-4 min-h-0">
           {loading && !worldGeoJson && (
              <div className="w-full flex justify-center items-center text-slate-400 flex-col py-10">
                 <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#e91e63]" />
                 <span className="text-xs uppercase font-bold tracking-widest">Cargando mapa base...</span>
              </div>
           )}
           {errorMsg && (
              <div className="w-full flex justify-center items-center text-red-500 font-bold uppercase tracking-widest text-xs py-10">
                  {errorMsg}
              </div>
           )}
           
           {!loading && !errorMsg && worldGeoJson && (
               <>
                  <div className="w-full md:w-1/3 min-h-[150px] md:min-h-0 md:h-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
                     <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                         <h3 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Festivales</h3>
                         <span className="text-[10px] font-bold bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">{countryFests.length}</span>
                     </div>
                     <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                         {countryFests.map((fest, idx) => (
                              <div key={`${fest.id}-${idx}`} className="p-3 border border-slate-100 rounded-xl shadow-sm hover:border-pink-200 transition-colors bg-white flex items-center gap-3 relative">
                                  <div className="w-6 h-6 rounded-full bg-[#e91e63] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                                      {idx + 1}
                                  </div>
                                  <div className="min-w-0 flex-1 pr-2">
                                      <h4 className="text-[11px] font-bold text-slate-800 truncate">{fest.name}</h4>
                                      <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium truncate">{fest.category || 'N/A'} • {fest.status}</p>
                                      {fest.projectionDate && <p className="text-[10px] text-slate-400 font-medium mt-1">{formatFestDate(fest.projectionDate)}</p>}
                                  </div>
                              </div>
                         ))}
                         {countryFests.length === 0 && (
                             <p className="text-[11px] text-slate-400 text-center py-10 font-medium">No hay coordenadas en esta región.</p>
                         )}
                     </div>
                  </div>
                  <div className="w-full md:w-2/3 h-64 md:h-full shrink-0 bg-slate-50 rounded-2xl shadow-inner border border-slate-200 overflow-hidden flex items-center justify-center relative">
                     <div className="absolute inset-0 bg-white pointer-events-none opacity-50"></div>
                     <svg ref={svgRef} viewBox="0 0 800 800" className="w-full h-full max-h-full aspect-square z-10"></svg>
                  </div>
               </>
           )}
        </div>
      </div>
    </div>,
    document.body
  );
};
