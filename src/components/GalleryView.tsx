import React, { useState, useMemo, useEffect } from 'react';
import { Upload, X, Trash2, Image as ImageIcon, ChevronDown, ChevronRight, ChevronLeft, Folder, ZoomIn, ZoomOut, Download, Maximize, Eye, EyeOff } from 'lucide-react';
import { GalleryItem, Festival, FilmData } from '../types';
import { uploadFileToStorage, deleteFileFromStorage } from '../utils/storageHelpers';

const CATEGORIES = [
  { id: 'stills', label: 'Stills' },
  { id: 'posters', label: 'Posters' },
  { id: 'logos', label: 'Logos' },
  { id: 'laureles', label: 'Laureles' },
  { id: 'otros', label: 'Otros' }
];

export const GalleryView = ({ 
  gallery, 
  setGallery,
  festivals = [],
  filmData = [],
  showAlert,
  isAuthorized 
}: { 
  gallery: GalleryItem[]; 
  setGallery: (g: GalleryItem[]) => void;
  festivals?: Festival[];
  filmData?: FilmData[];
  showAlert: (msg: string) => void;
  isAuthorized: boolean;
}) => {
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)));
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<'black' | 'white' | 'transparent'>('black');
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialDistance(dist);
    } else if (e.touches.length === 1) {
       setIsDragging(true);
       setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleChange = dist / initialDistance;
      setZoom((z) => Math.min(Math.max(0.5, z * scaleChange), 4));
      setInitialDistance(dist);
    } else if (e.touches.length === 1 && isDragging) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => {
    setInitialDistance(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const computedItems = useMemo(() => {
    const computed: (GalleryItem & { readOnly?: boolean })[] = [...gallery];
    
    // Extraer Laureles de festivals
    festivals.forEach(f => {
      if (f.laurel) {
        computed.push({
          id: `laurel_fest_${f.id}`,
          url: f.laurel,
          type: 'image',
          name: `Laurel - ${f.name}`,
          createdAt: new Date().toISOString(), // won't use it much
          category: 'laureles',
          readOnly: true
        });
      }
    });

    // Extraer Logos y Posters de filmData
    filmData.forEach(f => {
      if (f.logoUrl || f.logoBase64) {
        computed.push({
          id: `logo_main_${f.id}`,
          url: (f.logoUrl || f.logoBase64) as string,
          type: 'image',
          name: `Logo Principal - ${f.techSpecs?.title || 'Film'}`,
          createdAt: new Date().toISOString(),
          category: 'logos',
          readOnly: true
        });
      }
      if (f.posterUrl) {
        computed.push({
          id: `poster_main_${f.id}`,
          url: f.posterUrl,
          type: 'image',
          name: `Poster - ${f.techSpecs?.title || 'Film'}`,
          createdAt: new Date().toISOString(),
          category: 'posters',
          readOnly: true
        });
      }
      f.bottomLogos?.forEach((logoUrl, idx) => {
        computed.push({
          id: `logo_bottom_${f.id}_${idx}`,
          url: logoUrl,
          type: 'image',
          name: `Logo Extra - ${f.techSpecs?.title || 'Film'}`,
          createdAt: new Date().toISOString(),
          category: 'logos',
          readOnly: true
        });
      });
    });

    return computed;
  }, [gallery, festivals, filmData]);

  const currentIndex = computedItems.findIndex(item => item.id === selectedImage?.id);
  
  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
       setSelectedImage(computedItems[currentIndex - 1]);
       setZoom(1);
       setPan({ x: 0, y: 0 });
    }
  };
  
  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex < computedItems.length - 1 && currentIndex !== -1) {
       setSelectedImage(computedItems[currentIndex + 1]);
       setZoom(1);
       setPan({ x: 0, y: 0 });
    }
  };

  const toggleCategory = (catId: string) => {
    const next = new Set(openCategories);
    if (next.has(catId)) {
      next.delete(catId);
    } else {
      next.add(catId);
    }
    setOpenCategories(next);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    if (!isAuthorized) {
       showAlert("No tienes permisos para subir imágenes.");
       return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategory(categoryId);
    try {
      const url = await uploadFileToStorage(file, `gallery/${categoryId}/${Date.now()}_${file.name}`, setProgress);
      const newItem: GalleryItem = {
        id: Date.now().toString(),
        url,
        type: 'image',
        name: file.name,
        createdAt: new Date().toISOString(),
        category: categoryId
      };
      setGallery([...gallery, newItem]);
      showAlert("¡Imagen subida exitosamente!");
    } catch (err: any) {
      console.error(err);
      showAlert(`Error: ${err.message || 'Error al subir la imagen'}`);
    } finally {
      setUploadingCategory(null);
      setProgress(0);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteRequest = (id: string, readOnly?: boolean) => {
    if (readOnly) {
       showAlert("Esta imagen proviene de otra sección. Edítala allí.");
       return;
    }
    if (!isAuthorized) {
       showAlert("No tienes permisos.");
       return;
    }
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      const itemToDelete = gallery.find(g => g.id === confirmDeleteId);
      if (itemToDelete && itemToDelete.url) {
        await deleteFileFromStorage(itemToDelete.url);
      }
      setGallery(gallery.filter(g => g.id !== confirmDeleteId));
      showAlert("Imagen eliminada");
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-fuchsia-600" /> GALERÍA
        </h2>
      </div>

      {CATEGORIES.map((category, catIdx) => {
        const isOpen = openCategories.has(category.id);
        const isUploading = uploadingCategory === category.id;
        // Group items that belong to this category, handling old items that lack a category
        const categoryItems = computedItems.filter(item => 
          item.category === category.id || (!item.category && category.id === 'otros')
        );

        return (
          <div key={`gal-cat-${category.id}-${catIdx}`} className="border border-white/40 rounded-xl bg-white/40 backdrop-blur-md shadow-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/20 cursor-pointer hover:bg-white/40 transition" onClick={() => toggleCategory(category.id)}>
              <div className="flex items-center gap-3">
                <button type="button" className="text-slate-600 p-1 hover:bg-white rounded-full transition">
                  {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-fuchsia-600" />
                  <h3 className="font-black text-slate-800 tracking-wide uppercase text-sm">{category.label}</h3>
                  <span className="bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full text-xs font-black shadow-sm">
                    {categoryItems.length}
                  </span>
                </div>
              </div>
              
              {isAuthorized && (
                <div className="relative z-10" onClick={e => e.stopPropagation()}>
                   <input type="file" accept="image/*" className="hidden" id={`gallery-upload-${category.id}`} onChange={(e) => handleUpload(e, category.id)} disabled={uploadingCategory !== null}/>
                   <label htmlFor={`gallery-upload-${category.id}`} className="flex items-center gap-2 bg-white/80 backdrop-blur text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-fuchsia-100 hover:text-fuchsia-700 transition cursor-pointer disabled:opacity-50 border border-white">
                     <Upload className="h-3 w-3" />
                     {isUploading ? `Subiendo... ${Math.round(progress)}%` : 'Subir'}
                   </label>
                </div>
              )}
            </div>

            {isOpen && (
              <div className="p-4 border-t border-white/30">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryItems.map((item, idx) => (
                    <div key={`gal-item-${item.id || 'i'}-${idx}`} onClick={() => { setSelectedImage(item); setZoom(1); setPan({ x: 0, y: 0 }); }} className="relative group rounded-xl overflow-hidden shadow-sm border border-white/50 bg-white/20 aspect-square flex items-center justify-center backdrop-blur-sm cursor-pointer hover:border-fuchsia-300 transition-colors">
                      <img src={item.url} alt={item.name} className="w-full h-full object-contain p-2" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                        <p className="text-white text-[10px] truncate max-w-full font-medium">
                           {item.name} {item.readOnly && <span className="opacity-50 ml-1">(App)</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                  {categoryItems.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-500">
                       <ImageIcon className="h-8 w-8 mx-auto mb-3 opacity-30" />
                       <p className="font-bold text-sm">No hay imágenes en esta sección</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {selectedImage && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-colors ${bgMode === 'black' ? 'bg-black/90 backdrop-blur-sm' : bgMode === 'white' ? 'bg-white' : ''}`} style={bgMode === 'transparent' ? { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpath d='M0 0h8v8H0zm8 8h8v8H8z' fill='%23ccc'/%3E%3Cpath d='M8 0h8v8H8zm-8 8h8v8H0z' fill='%23eee'/%3E%3C/svg%3E")` } : {}} onClick={() => { setSelectedImage(null); setPan({ x: 0, y: 0 }); }}>
          {/* Toolbar */}
          {showUI ? (
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 max-w-[calc(100vw-1rem)] flex items-center gap-3 sm:gap-6 z-[110] bg-black/40 px-3 sm:px-4 py-2 rounded-full backdrop-blur-md overflow-x-auto [&::-webkit-scrollbar]:hidden" onClick={e => e.stopPropagation()}>
               <div className="flex items-center gap-2 mr-1 sm:mr-2 border-r border-white/20 pr-3 sm:pr-6 shrink-0">
                 <button onClick={() => setBgMode('black')} className={`w-5 h-5 rounded-full border border-white/40 shadow-sm ${bgMode === 'black' ? 'ring-2 ring-white scale-110' : ''} bg-black hover:scale-110 transition`} title="Fondo negro"></button>
                 <button onClick={() => setBgMode('white')} className={`w-5 h-5 rounded-full border border-white/40 shadow-sm ${bgMode === 'white' ? 'ring-2 ring-white scale-110' : ''} bg-white hover:scale-110 transition`} title="Fondo blanco"></button>
                 <button onClick={() => setBgMode('transparent')} className={`w-5 h-5 rounded-full border border-white/40 shadow-sm ${bgMode === 'transparent' ? 'ring-2 ring-white scale-110' : ''} hover:scale-110 transition`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M0 0h4v4H0zm4 4h4v4H4z' fill='%23ccc'/%3E%3Cpath d='M4 0h4v4H4zm-4 4h4v4H0z' fill='%23fff'/%3E%3C/svg%3E")` }} title="Fondo transparente"></button>
               </div>
               <button onClick={() => setShowUI(false)} className="text-white hover:text-fuchsia-400 transition shrink-0" title="Ocultar interfaz">
                 <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" />
               </button>
               <a href={selectedImage.url} download target="_blank" rel="noreferrer" className="text-white hover:text-fuchsia-400 transition shrink-0" title="Descargar original">
                 <Download className="h-5 w-5 sm:h-6 sm:w-6" />
               </a>
               <button onClick={() => setZoom(z => Math.min(z + 0.5, 3))} className="text-white hover:text-fuchsia-400 transition shrink-0" title="Acercar">
                 <ZoomIn className="h-5 w-5 sm:h-6 sm:w-6" />
               </button>
               <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="text-white hover:text-fuchsia-400 transition shrink-0" title="Alejar">
                 <ZoomOut className="h-5 w-5 sm:h-6 sm:w-6" />
               </button>
               {isAuthorized && (
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(selectedImage.id, selectedImage.readOnly); setSelectedImage(null); }} className="text-white hover:text-red-400 transition shrink-0" title="Eliminar">
                   <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                 </button>
               )}
               <button onClick={() => { setSelectedImage(null); setZoom(1); setPan({ x: 0, y: 0 }); }} className="text-white hover:text-red-400 transition p-1 bg-white/20 rounded-full ml-1 sm:ml-2 shrink-0" title="Cerrar">
                 <X className="h-5 w-5 sm:h-6 sm:w-6" />
               </button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowUI(true); }}
              className="absolute top-4 right-4 z-[110] text-white hover:text-fuchsia-400 p-3 bg-black/40 rounded-full backdrop-blur-md transition"
              title="Mostrar interfaz"
            >
              <Eye className="h-6 w-6" />
            </button>
          )}
          
          {/* Image Container */}
          <div 
            className="w-full h-full overflow-hidden flex items-center justify-center p-4 touch-none"
            onWheel={(e) => {
               if (e.deltaY !== 0) {
                 e.stopPropagation();
                 setZoom(z => Math.min(Math.max(0.5, z - e.deltaY * 0.005), 4));
               }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
             <img 
                src={selectedImage.url} 
                alt={selectedImage.name} 
                style={{ 
                   transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
                   transition: (initialDistance || isDragging) ? 'none' : 'transform 0.2s ease-out' 
                }}
                className={`max-w-full max-h-full object-contain select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                draggable={false}
                onClick={(e) => {
                   e.stopPropagation();
                   // Avoid double-tap zoom conflict with slow clicks, simple click to zoom if zoom is 1 and not dragged
                   if (zoom === 1 && pan.x === 0 && pan.y === 0 && !isDragging) {
                      setZoom(2);
                   }
                }}
             />
          </div>
          {showUI && (
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none flex flex-col items-center gap-1 z-[110]">
               <p className="text-white font-bold drop-shadow-md bg-black/50 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
                  {selectedImage.name} {selectedImage.readOnly && <span className="opacity-70 font-normal ml-1">(App)</span>}
               </p>
               {selectedImage.createdAt && (
                 <p className="text-white/80 text-sm font-medium drop-shadow-md bg-black/40 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                   Agregada el {new Date(selectedImage.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                 </p>
               )}
            </div>
          )}

          {/* Navigation Controls */}
          {showUI && currentIndex > 0 && (
             <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white bg-black/40 hover:bg-black/60 rounded-full transition z-[110]" 
                title="Anterior"
             >
                <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
             </button>
          )}
          {showUI && currentIndex < computedItems.length - 1 && currentIndex !== -1 && (
             <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }} 
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white bg-black/40 hover:bg-black/60 rounded-full transition z-[110]" 
                title="Siguiente"
             >
                <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
             </button>
          )}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
           <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center transform transition-all" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar imagen?</h3>
              <p className="text-slate-600 mb-6 font-medium text-sm">Esta acción no se puede deshacer.</p>
              
              <div className="flex gap-3">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">
                    Cancelar
                 </button>
                 <button onClick={confirmDelete} className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md shadow-red-200 transition">
                    Eliminar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
