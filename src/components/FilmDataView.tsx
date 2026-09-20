import React, { useState, useRef } from 'react';
import { Film, User, Users, Phone, MapPin, Calendar, Clock, Disc, Activity, AlertCircle, FileText, Edit2, Check, X, Shield, Download, Globe, Languages, Upload, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/helpers';
import { uploadFileToStorage } from '../utils/storageHelpers';
import { FilmData } from '../types';
import { exportFilmDataPDF } from '../utils/filmDataPdfExport';
import { GoogleGenAI } from "@google/genai";

interface Props {
  isAuthorized: boolean;
  filmData: FilmData[];
  setFilmData: (data: any) => void;
  showAlert: (msg: string) => void;
  addAuditLog: (col: string, msg: string) => void;
  userName: string;
}

const DEFAULT_DATA: FilmData = {
  id: 'festis_main',
  logoBase64: '',
  bottomLogos: [],
  history: {
    logline: "Logline de la obra audiovisual.",
    synopsis: "Sinopsis completa del proyecto para dossiers y convocatorias."
  },
  techSpecs: {
    title: "TITULO DEL FILM",
    director: "Director / Autor",
    date: "2026",
    country: "Argentina",
    format: "Cortometraje de Ficción / Animación",
    technique: "Digital / Formato Nativo",
    genre: "Drama / Ficción",
    duration: "10 minutos",
    music: "Música Original",
    rating: "ATP (Apta para Todo Público)",
    producedWithin: "Casa Productora / Institución"
  },
  biography: "Biografía del director o equipo realizador.",
  credits: [
    { role: 'Dirección / Guión', name: 'Nombre Director', social: '@director' },
    { role: 'Producción Ejecutiva', name: 'Nombre Productor', social: '@productor' }
  ],
  contactInfo: [
    {
      title: 'Obra Audiovisual',
      subtitle: '',
      lines: [
        { label: 'Email', value: 'contacto@festis.app', isLink: true }
      ]
    }
  ]
};

export const FilmDataView: React.FC<Props> = ({ isAuthorized, filmData, setFilmData, showAlert, addAuditLog, userName }) => {
  const [activeLang, setActiveLang] = useState<string>(filmData[0]?.lang || 'es');
  const availableLangs = Array.from(new Set([...filmData.map(d => d.lang || 'es'), 'es', 'en', 'fr']));
  
  const currentData = filmData.find(d => (d.lang || 'es') === activeLang) || { ...DEFAULT_DATA, lang: activeLang, id: `festis_${activeLang}`, accentColor: '#a855f7' };
  
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<FilmData>(currentData);
  const [isTranslating, setIsTranslating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const newFilmData = [...filmData];
    const index = newFilmData.findIndex(f => f.id === draft.id);
    if (index >= 0) {
        newFilmData[index] = draft;
    } else {
        newFilmData.push(draft);
    }
    setFilmData(newFilmData);
    setIsEditing(false);
    showAlert("Datos del film actualizados correctamente.");
    addAuditLog('filmData', `${userName} ha editado los datos del film en idioma ${activeLang}.`);
  };

  const handleCancel = () => {
    setDraft(currentData);
    setIsEditing(false);
  };

  const handleDownloadPDF = async () => {
    try {
      showAlert("Generando PDF... Por favor espera");
      await exportFilmDataPDF(draft);
      addAuditLog('filmData', `${userName} descargó los datos en PDF.`);
      showAlert("PDF generado exitosamente");
    } catch (e) {
      console.error(e);
      showAlert("Error generando PDF");
    }
  };

  // ==========================================
  // FUNCIÓN: Traducir Datos del Film
  // ==========================================
  // Esta función se encarga de traducir la información actual del film a un idioma destino
  // utilizando el SDK de Gemini de Google. Mantiene las claves JSON intactas y traduce
  // únicamente los textos correspondientes.
  const translateData = async (targetLanguage: string) => {
      setIsTranslating(true);
      try {
          // Inicializamos el cliente de Google Gen AI con la clave API del entorno
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          // Preparamos el prompt con las instrucciones de traducción y el JSON estructurado
          const prompt = `Translate the following JSON object to ${targetLanguage}. Keep the keys exactly as they are. Translate ONLY the values. Ensure you return valid JSON, and nothing else.
          
          JSON to translate:
          ${JSON.stringify({
              history: draft.history,
              techSpecs: draft.techSpecs,
              biography: draft.biography,
              credits: draft.credits.map(c => ({ role: c.role })),
              contactInfo: draft.contactInfo.map(c => ({ title: c.title, subtitle: c.subtitle, lines: c.lines.map(l => ({ label: l.label })) }))
          })}`;

          // Solicitamos la generación de contenido estructurado a Gemini
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              }
          });
          
          const output = response.text || "";
          if(output) {
              const translated = JSON.parse(output);
              const targetLangId = targetLanguage.toLowerCase().substring(0, 2);
              const newDraft = { ...draft, id: `festis_${targetLangId}`, lang: targetLangId };
              
              newDraft.history = translated.history;
              newDraft.techSpecs = translated.techSpecs;
              newDraft.biography = translated.biography;
              
              if (translated.credits) {
                 translated.credits.forEach((tc: any, i: number) => {
                    if (newDraft.credits[i]) newDraft.credits[i].role = tc.role;
                 });
              }
              
              if (translated.contactInfo) {
                 translated.contactInfo.forEach((tc: any, i: number) => {
                    if (newDraft.contactInfo[i]) {
                       newDraft.contactInfo[i].title = tc.title;
                       newDraft.contactInfo[i].subtitle = tc.subtitle;
                       tc.lines?.forEach((tl: any, j: number) => {
                          if (newDraft.contactInfo[i].lines[j]) newDraft.contactInfo[i].lines[j].label = tl.label;
                       });
                    }
                 });
              }

              setDraft(newDraft);
              setActiveLang(targetLangId);
              showAlert(`Traducido a ${targetLanguage} correctamente. Recuerda guardar.`);
          }
      } catch (error) {
          console.error(error);
          showAlert("Error al traducir.");
      } finally {
          setIsTranslating(false);
      }
  };

  const currentDisplay = isEditing ? draft : currentData;
  const accentColor = currentDisplay.accentColor || '#a855f7';
  const [uploadingField, setUploadingField] = useState<'logo' | 'poster' | null>(null);

  const handleFileUploadToStorage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo' | 'poster'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showAlert("La imagen es demasiado grande. Máximo 5MB.");
      return;
    }

    setUploadingField(field);
    try {
      const url = await uploadFileToStorage(file, `film_data/${draft.id}_${field}_${Date.now()}`);
      if (field === 'logo') {
         setDraft({...draft, logoUrl: url, logoBase64: ''}); // clear base64 if url is set
      } else {
         setDraft({...draft, posterUrl: url});
      }
      showAlert(`Imagen subida correctamente`);
    } catch (err: any) {
      showAlert(`Error al subir: ${err.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert("La imagen es demasiado grande. Máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-32 max-w-5xl mx-auto" id="film-data-view">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="text-center sm:text-left">
           <h2 className="text-4xl font-black tracking-tight uppercase text-slate-800">
              Datos <span style={{ color: accentColor }}>del Film</span>
           </h2>
           <div className="flex items-center gap-3 mt-2">
             <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Especificaciones Técnicas e Información</p>
             <select 
                value={activeLang} 
                onChange={(e) => {
                  if (!isEditing) setActiveLang(e.target.value);
                  else showAlert("Guarda los cambios antes de cambiar de idioma.");
                }}
                className="bg-transparent text-xs font-bold text-slate-600 border border-slate-300 rounded px-2 py-1 outline-none no-print"
             >
               {availableLangs.map((l, idx) => <option key={`${l}-${idx}`} value={l}>{l.toUpperCase()}</option>)}
             </select>
           </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 no-print">
            {isEditing && (
                <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 px-3 py-1 gap-2 shrink-0">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Color:</label>
                   <input 
                     type="color" 
                     value={draft.accentColor || '#a855f7'}
                     onChange={(e) => setDraft({...draft, accentColor: e.target.value})}
                     className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                   />
                </div>
            )}
            {!isEditing && (
               <button onClick={handleDownloadPDF} className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition shadow-lg">
                  <Download className="h-4 w-4" /> Exportar PDF
               </button>
            )}
            
            {isEditing && (
               <div className="flex relative group shrink-0">
                  <button disabled={isTranslating} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-lg disabled:opacity-50">
                     <Languages className="h-4 w-4" /> {isTranslating ? 'Traduciendo...' : 'Traducir'}
                  </button>
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl w-32 p-2 hidden group-hover:flex flex-col z-50">
                     {['English', 'Spanish', 'French'].map((lang, idx) => (
                        <button key={`${lang}-${idx}`} onClick={() => translateData(lang)} className="px-3 py-2 text-xs font-bold text-left hover:bg-slate-50 rounded-lg text-slate-700">
                           {lang}
                        </button>
                     ))}
                  </div>
               </div>
            )}
            
            {isAuthorized && !isEditing && (
              <button onClick={() => { setIsEditing(true); setDraft(currentData); }} className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition shadow-lg relative group">
                <Edit2 className="h-4 w-4" />
                <span className="opacity-0 group-hover:opacity-100 absolute -bottom-8 inset-x-0 flex justify-center w-full">
                  <span className="whitespace-nowrap bg-slate-800 text-white text-[10px] px-2 py-1 rounded">Editar Datos</span>
                </span>
              </button>
            )}

            {isEditing && (
              <>
                <button onClick={handleCancel} className="shrink-0 p-2.5 bg-white text-slate-500 rounded-xl hover:bg-slate-100 transition shadow-sm border border-slate-200">
                  <X className="h-4 w-4" />
                </button>
                <button onClick={handleSave} className="shrink-0 p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition shadow-lg">
                  <Check className="h-4 w-4" />
                </button>
              </>
            )}
        </div>
      </div>

      <div ref={containerRef} className="space-y-6 w-full px-2 sm:px-0">
        
        {/* 1. Logo y Poster del Film */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 border-t-4 flex flex-col items-center justify-center min-h-[160px] relative" style={{ borderTopColor: accentColor }}>
             <h4 className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Logo</h4>
             {isEditing && (
                <label className="absolute top-4 right-4 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition" style={{ color: accentColor }}>
                    <Upload className="h-3 w-3" /> {uploadingField === 'logo' ? '...' : 'Subir'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingField !== null} onChange={(e) => handleFileUploadToStorage(e, 'logo')} />
                </label>
             )}
             {(currentDisplay.logoUrl || currentDisplay.logoBase64) ? (
                <img src={currentDisplay.logoUrl || currentDisplay.logoBase64} alt="Film Logo" className="max-h-32 object-contain mt-4" />
             ) : (
                <div className="text-center mt-4">
                   <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                   <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin Logo</span>
                </div>
             )}
          </div>
          <div className="glass-card p-6 border-t-4 flex flex-col items-center justify-center min-h-[160px] relative" style={{ borderTopColor: accentColor }}>
             <h4 className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Poster Oficial</h4>
             {isEditing && (
                <label className="absolute top-4 right-4 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition" style={{ color: accentColor }}>
                    <Upload className="h-3 w-3" /> {uploadingField === 'poster' ? '...' : 'Subir'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingField !== null} onChange={(e) => handleFileUploadToStorage(e, 'poster')} />
                </label>
             )}
             {currentDisplay.posterUrl ? (
                <img src={currentDisplay.posterUrl} alt="Film Poster" className="max-h-48 object-contain mt-4 rounded shadow-sm" />
             ) : (
                <div className="text-center mt-4">
                   <Film className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                   <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin Poster</span>
                </div>
             )}
          </div>
        </div>

        {/* 2. Historia */}
        <div className="glass-card p-6 border-l-4 w-full" style={{ borderLeftColor: accentColor }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3" style={{ color: accentColor }}>
              <FileText className="h-4 w-4" style={{ color: accentColor }} /> Historia
            </h3>
            
            <div className="mb-6 w-full">
               <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest mb-2" style={{ color: accentColor }}>Logline</h4>
               {isEditing ? (
                  <textarea 
                     value={draft.history.logline}
                     onChange={(e) => setDraft({...draft, history: {...draft.history, logline: e.target.value}})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 h-20"
                  />
               ) : (
                  <p className="text-slate-800 font-medium text-lg leading-relaxed italic border-l-2 border-slate-200 pl-4 py-1 break-words">
                     "{currentDisplay.history.logline}"
                  </p>
               )}
            </div>
            
            <div className="w-full">
               <h4 className="font-bold uppercase text-[10px] tracking-widest mb-2" style={{ color: accentColor }}>Synopsis</h4>
               {isEditing ? (
                  <textarea 
                     value={draft.history.synopsis}
                     onChange={(e) => setDraft({...draft, history: {...draft.history, synopsis: e.target.value}})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 h-32"
                  />
               ) : (
                  <p className="text-slate-700 font-medium leading-relaxed break-words whitespace-pre-line">
                     {currentDisplay.history.synopsis}
                  </p>
               )}
            </div>
        </div>

        {/* 3. Especificaciones Tecnicas */}
        <div className="glass-card p-6 border-l-4 w-full" style={{ borderLeftColor: accentColor }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3" style={{ color: accentColor }}>
              <Film className="h-4 w-4" style={{ color: accentColor }} /> Especificaciones Técnicas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
               {[
                 { key: 'title', label: 'Title', w: 'full' },
                 { key: 'format', label: 'Format', w: 'full' },
                 { key: 'director', label: 'Director/Author', w: 'full' },
                 { key: 'technique', label: 'Technique', w: 'full' },
                 { key: 'date', label: 'Date', w: 'full' },
                 { key: 'genre', label: 'Genre', w: 'full' },
                 { key: 'country', label: 'Country', w: 'full' },
                 { key: 'duration', label: 'Duration', w: 'full' },
                 { key: 'music', label: 'Music', w: 'full' },
                 { key: 'rating', label: 'Rating', w: 'full' },
               ].map((spec, idx) => (
                  <div key={`${spec.key}-${idx}`} className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 pb-2">
                     <span className="font-bold uppercase text-[10px] tracking-widest mb-1 sm:mb-0 shrink-0 sm:w-1/3" style={{ color: accentColor }}>{spec.label}</span>
                     {isEditing ? (
                        <input 
                           type="text"
                           value={(draft.techSpecs as any)[spec.key]}
                           onChange={(e) => setDraft({...draft, techSpecs: {...draft.techSpecs, [spec.key]: e.target.value}})}
                           className="w-full sm:w-2/3 bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-right"
                        />
                     ) : (
                        <span className="font-medium text-slate-700 text-right break-words w-full sm:w-2/3">{(currentDisplay.techSpecs as any)[spec.key]}</span>
                     )}
                  </div>
               ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 w-full">
               <span className="font-bold uppercase text-[10px] tracking-widest block mb-2" style={{ color: accentColor }}>Produced within:</span>
               {isEditing ? (
                  <textarea 
                     value={draft.techSpecs.producedWithin}
                     onChange={(e) => setDraft({...draft, techSpecs: {...draft.techSpecs, producedWithin: e.target.value}})}
                     className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                  />
               ) : (
                  <span className="font-medium text-slate-700 break-words block">{currentDisplay.techSpecs.producedWithin}</span>
               )}
            </div>
        </div>

        {/* 4. Biografias */}
        <div className="glass-card p-6 border-l-4 text-sm w-full" style={{ borderLeftColor: accentColor }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3" style={{ color: accentColor }}>
              <User className="h-4 w-4" style={{ color: accentColor }} /> Biografías
            </h3>
            <div className="w-full">
               {isEditing ? (
                  <textarea 
                     value={draft.biography}
                     onChange={(e) => setDraft({...draft, biography: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 min-h-[150px]"
                  />
               ) : (
                  <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-line break-words">
                     {currentDisplay.biography}
                  </p>
               )}
            </div>
        </div>

        {/* 5. Creditos */}
        <div className="glass-card p-6 border-l-4 text-sm w-full" style={{ borderLeftColor: accentColor }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3" style={{ color: accentColor }}>
              <Users className="h-4 w-4" style={{ color: accentColor }} /> Créditos
            </h3>
            
            <div className="space-y-4 w-full">
               {currentDisplay.credits.map((credit, i) => (
                  <div key={`credit-${credit.name || ''}-${i}`} className="flex flex-col border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                     {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                           <input type="text" placeholder="Name" value={credit.name} onChange={(e) => { const n = [...draft.credits]; n[i].name = e.target.value; setDraft({...draft, credits: n}); }} className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-bold text-slate-800" />
                           <input type="text" placeholder="Role" value={credit.role} onChange={(e) => { const n = [...draft.credits]; n[i].role = e.target.value; setDraft({...draft, credits: n}); }} className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-600" />
                           <div className="flex gap-1">
                               <input type="text" placeholder="Social" value={credit.social} onChange={(e) => { const n = [...draft.credits]; n[i].social = e.target.value; setDraft({...draft, credits: n}); }} className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-amber-600 w-full" />
                               <button onClick={() => { const n = [...draft.credits]; n.splice(i, 1); setDraft({...draft, credits: n}); }} className="p-1.5 bg-red-50 text-red-500 rounded"><Trash2 className="h-4 w-4" /></button>
                           </div>
                        </div>
                     ) : (
                        <>
                           <span className="font-black text-slate-800 block break-words">{credit.name}</span>
                           <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-slate-500 break-words">{credit.role}</span>
                              {credit.social && <span className="text-amber-500 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded break-words">{credit.social}</span>}
                           </div>
                        </>
                     )}
                  </div>
               ))}
               {isEditing && (
                  <button onClick={() => setDraft({...draft, credits: [...draft.credits, {name:'', role:'', social:''}]})} className="w-full py-2 bg-slate-50 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 uppercase tracking-widest">
                     + Añadir Crédito
                  </button>
               )}
            </div>
        </div>

        {/* 6. Informacion de contacto */}
        <div className="glass-card p-6 border-l-4 text-sm w-full" style={{ borderLeftColor: accentColor }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3" style={{ color: accentColor }}>
              <Activity className="h-4 w-4" style={{ color: accentColor }} /> Información de Contacto
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
               {currentDisplay.contactInfo.map((contact, i) => (
                  <div key={`contact-${contact.title || ''}-${i}`} className="bg-slate-50 p-4 rounded-xl">
                     {isEditing ? (
                        <div className="space-y-2 mb-3">
                           <input type="text" placeholder="Title (e.g. Shortfilm)" value={contact.title} onChange={(e) => { const n = [...draft.contactInfo]; n[i].title = e.target.value; setDraft({...draft, contactInfo: n}); }} className="w-full bg-white border border-slate-200 rounded p-1.5 text-[10px] font-black uppercase" />
                           <input type="text" placeholder="Subtitle" value={contact.subtitle} onChange={(e) => { const n = [...draft.contactInfo]; n[i].subtitle = e.target.value; setDraft({...draft, contactInfo: n}); }} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs" />
                        </div>
                     ) : (
                        <div className="mb-3">
                           <h4 className="font-bold uppercase text-[10px] tracking-widest break-words" style={{ color: accentColor }}>{contact.title}</h4>
                           {contact.subtitle && <span className="text-slate-500 font-medium text-[11px] break-words">{contact.subtitle}</span>}
                        </div>
                     )}

                     <ul className="space-y-2">
                        {contact.lines.map((line, j) => (
                           <li key={`contact-${i}-line-${j}`} className="flex flex-col gap-1 w-full relative">
                              {isEditing ? (
                                 <div className="flex gap-1 items-start w-full">
                                    <div className="space-y-1 w-full">
                                       <input type="text" placeholder="Label (e.g. Email)" value={line.label} onChange={(e) => { const n = [...draft.contactInfo]; n[i].lines[j].label = e.target.value; setDraft({...draft, contactInfo: n}); }} className="w-full bg-white border border-slate-200 rounded p-1 text-[10px] font-bold" />
                                       <input type="text" placeholder="Value" value={line.value} onChange={(e) => { const n = [...draft.contactInfo]; n[i].lines[j].value = e.target.value; setDraft({...draft, contactInfo: n}); }} className="w-full bg-white border border-slate-200 rounded p-1 text-xs" />
                                       <label className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase mt-1">
                                           <input type="checkbox" checked={!!line.isLink} onChange={(e) => { const n = [...draft.contactInfo]; n[i].lines[j].isLink = e.target.checked; setDraft({...draft, contactInfo: n}); }} /> is link
                                       </label>
                                    </div>
                                    <button onClick={() => { const n = [...draft.contactInfo]; n[i].lines.splice(j, 1); setDraft({...draft, contactInfo: n}); }} className="p-1 bg-red-50 text-red-500 rounded mt-1 shrink-0"><X className="h-3 w-3" /></button>
                                 </div>
                              ) : (
                                 <div className="flex flex-wrap sm:flex-nowrap gap-1 w-full overflow-hidden">
                                     <span className="font-bold text-[11px] shrink-0" style={{ color: accentColor }}>{line.label}:</span> 
                                     {line.isLink ? (
                                        <a href={line.value.includes('@') ? `mailto:${line.value}` : line.value} className="font-medium hover:underline text-[11px] break-all max-w-full truncate" style={{ color: accentColor }}>{line.value.replace(/https?:\/\//,'')}</a>
                                     ) : (
                                        <span className="text-slate-700 text-[11px] break-words">{line.value}</span>
                                     )}
                                 </div>
                              )}
                           </li>
                        ))}
                     </ul>
                     {isEditing && (
                        <button onClick={() => { const n = [...draft.contactInfo]; n[i].lines.push({label:'', value:''}); setDraft({...draft, contactInfo: n}); }} className="mt-2 w-full py-1.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100">
                           + Línea
                        </button>
                     )}
                     {isEditing && (
                        <button onClick={() => { const n = [...draft.contactInfo]; n.splice(i, 1); setDraft({...draft, contactInfo: n}); }} className="mt-2 w-full py-1.5 bg-red-50 text-red-500 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-red-100">
                           Eliminar Bloque
                        </button>
                     )}
                  </div>
               ))}
               
               {isEditing && (
                  <button onClick={() => setDraft({...draft, contactInfo: [...draft.contactInfo, {title:'Nuevo Bloque', subtitle:'', lines:[]}]})} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center min-h-[150px] text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition uppercase tracking-widest">
                     + Añadir Bloque
                  </button>
               )}
            </div>
        </div>
        
        {/* 7. Logos */}
        <div className="w-full flex-col items-center justify-center pt-8 border-t border-slate-100">
            <h4 className="font-bold uppercase text-[10px] tracking-widest mb-4 text-center" style={{ color: accentColor }}>Apoyos / Instituciones</h4>
            <div className="flex gap-6 justify-center flex-wrap items-center">
               {currentDisplay.bottomLogos.map((logo, idx) => (
                  <div key={`logo-${idx}`} className="relative group">
                     {isEditing && (
                        <button onClick={() => { const n = [...draft.bottomLogos]; n.splice(idx, 1); setDraft({...draft, bottomLogos: n}); }} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition no-print">
                           <X className="h-3 w-3" />
                        </button>
                     )}
                     <img src={logo} alt="Logo" className="h-20 object-contain opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                  </div>
               ))}
               {isEditing && (
                  <label className="h-12 px-4 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] font-bold uppercase text-slate-400 hover:bg-slate-50 cursor-pointer transition">
                     + Logo
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (val) => {
                         setDraft({...draft, bottomLogos: [...draft.bottomLogos, val]});
                     })} />
                  </label>
               )}
            </div>
            {currentDisplay.bottomLogos.length === 0 && !isEditing && (
                <div className="text-center text-slate-400 text-xs italic">Sin logos registrados.</div>
            )}
        </div>

      </div>
    </div>
  );
};
