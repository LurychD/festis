import React, { useState, useEffect } from 'react';
import { SocialPost, Festival, Task, GalleryItem } from '../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Hash, Image as ImageIcon, Link, Music, CheckSquare, Edit3, Trash2, LayoutGrid, Plus, X, Video, CalendarIcon, List } from 'lucide-react';
import { formatDisplayDate } from '../../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { DriveFolderExplorer } from './DriveFolderExplorer';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

interface SocialMediaBoardProps {
  posts: SocialPost[];
  setPosts: (posts: SocialPost[]) => void;
  festivals: Festival[];
  tasks: Task[];
  gallery: GalleryItem[];
  userName: string;
  isAuthorized: boolean;
  showToast: (msg: string) => void;
  setConfirmConfig: (config: any) => void;
}

export const SocialMediaBoard: React.FC<SocialMediaBoardProps> = ({
  posts, setPosts, festivals, tasks, gallery, userName, isAuthorized, showToast, setConfirmConfig
}) => {
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [showDrive, setShowDrive] = useState(false);
  const [viewMode, setViewMode] = useState<'expanded' | 'compact'>('expanded');


  useEffect(() => {
    if (editingPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [editingPost]);
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'pending': return 'Pendiente';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  const getStatusColor = (status: SocialPost['status']) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: SocialPost['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'text': return <Edit3 className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      case 'music': return <Music className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !isAuthorized) return;
    
    const { source, destination } = result;
    const sortedPosts = [...posts].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Divide posts into columns
    const draftPosts = sortedPosts.filter(p => p.status === 'draft');
    const pendingPosts = sortedPosts.filter(p => p.status === 'pending');
    const publishedPosts = sortedPosts.filter(p => p.status === 'published');
    
    const getList = (id: string) => id === 'social-draft' ? draftPosts : (id === 'social-pending' ? pendingPosts : publishedPosts);
    
    const sourceList = getList(source.droppableId);
    const destList = getList(destination.droppableId);
    
    const [movedItem] = sourceList.splice(source.index, 1);
    
    if (source.droppableId !== destination.droppableId) {
       movedItem.status = destination.droppableId === 'social-published' ? 'published' : (destination.droppableId === 'social-pending' ? 'pending' : 'draft');
    }
    
    destList.splice(destination.index, 0, movedItem);
    
    // Combine and update orders
    const combined = [...draftPosts, ...pendingPosts, ...publishedPosts].map((p, index) => ({
      ...p,
      order: index
    }));
    
    setPosts(combined);
  };

  const handleAddNew = () => {
    const newPost: SocialPost = {
      id: "post_" + Date.now().toString(),
      type: 'text',
      content: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdBy: userName,
      order: -1
    };
    
    const updatedPosts = [newPost, ...posts].map((p, index) => ({
      ...p,
      order: index
    }));
    
    setPosts(updatedPosts);
    setEditingPost(newPost);
  };

  const handleSaveEdit = (edited: SocialPost) => {
    if (!(edited.content || "").trim() && !edited.mediaUrl) {
      showToast("Debe incluir contenido visual o de texto.");
      return;
    }
    setPosts(posts.map(p => p.id === edited.id ? edited : p));
    setEditingPost(null);
    showToast("Post actualizado");
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthorized) {
       showToast("No tienes permiso para subir archivos.");
       return;
    }

    const uploadToFirebase = async (blob: Blob, type: 'image' | 'video', filename: string) => {
      showToast("Subiendo archivo...");
      const storageRef = ref(storage, `social_media/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, '')}`);
      try {
        const uploadTask = await uploadBytesResumable(storageRef, blob);
        const downloadUrl = await getDownloadURL(uploadTask.ref);
        setEditingPost({ ...editingPost!, type, mediaUrl: downloadUrl });
        showToast("Archivo subido con éxito");
      } catch (error) {
        showToast("Error al subir archivo");
        console.error("Firebase storage error:", error);
      }
    };

    if (file.type.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) { 
        showToast("El video es demasiado grande (máximo 100MB).");
        return;
      }
      uploadToFirebase(file, 'video', file.name);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1080;
          let scaleSize = 1;
          if (img.width > MAX_WIDTH) {
             scaleSize = MAX_WIDTH / img.width;
          }
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              uploadToFirebase(blob, 'image', file.name);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const sortedList = [...posts].sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderDroppable = (id: string, title: string, items: SocialPost[]) => (
    <Droppable droppableId={id} direction={viewMode === 'expanded' ? "vertical" : "horizontal"}>
      {(provided, snapshot) => (
        <div className="mb-10">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            {title} <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{items.length}</span>
          </h3>
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`transition bg-slate-50/50 p-4 rounded-3xl min-h-[120px] ${snapshot.isDraggingOver ? 'bg-sky-50' : ''} ${viewMode === 'expanded' 
              ? "grid grid-cols-1 md:grid-cols-2 gap-6 items-start" 
              : "grid grid-cols-1 md:grid-cols-2 gap-3 items-start"
            }`}
          >
            {items.map((post, index) => (
              <Draggable isDragDisabled={!isAuthorized} key={`${post.id}-${index}`} draggableId={post.id || `post-${index}`} index={index}>
                {(provided, snapshot) => {
                  const isCompact = viewMode === 'compact';
                  const baseClasses = isCompact 
                    ? 'p-3 rounded-2xl min-h-[80px] border-2' 
                    : 'p-5 rounded-[2rem] shadow-sm border-[3px] min-h-[160px]';
                    
                  return (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`break-inside-avoid ${baseClasses} flex flex-col group relative transition-all ${
                       snapshot.isDragging ? 'border-sky-400 shadow-2xl scale-105 rotate-2 z-50' : 
                       post.status === 'published' ? 'border-emerald-200 hover:border-emerald-400' :
                       post.status === 'pending' ? 'border-amber-100 hover:border-amber-300' :
                       'border-slate-100 hover:border-slate-300'
                    } ${post.status === 'published' && post.scheduledDate && new Date(post.scheduledDate).getTime() < new Date().getTime() ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                      backgroundColor: post.status === 'published' ? '#ecfdf5' : (post.color || '#ffffff')
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                           {...provided.dragHandleProps}
                           className={`bg-sky-50 text-sky-600 rounded-xl cursor-grab active:cursor-grabbing hover:bg-sky-100 transition-colors ${isCompact ? 'p-1.5' : 'p-2'}`}
                           title="Mantén click aquí para arrastrar"
                        >
                          <LayoutGrid className={isCompact ? "h-3 w-3" : "h-4 w-4"} />
                        </div>
                        <span className={`rounded-full font-black uppercase tracking-widest border ${getStatusColor(post.status)} ${isCompact ? 'px-2 py-0.5 text-[8px]' : 'px-3 py-1 text-[10px]'}`}>
                          {getStatusLabel(post.status)}
                        </span>
                      </div>
                      {!isCompact && post.scheduledDate && (
                         <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 border-2 border-red-200 px-3 py-1.5 rounded-xl shadow-sm">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(post.scheduledDate), "HH:mm dd/MM")}
                         </div>
                      )}
                    </div>

                    {/* MEDIA RENDER */}
                    {!isCompact && post.mediaUrl && (
                       <div className="mb-4 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center relative">
                          {post.type === 'image' && (
                             <img src={post.mediaUrl} alt="Preview" className="w-full h-auto max-h-48 object-cover" />
                          )}
                          {post.type === 'video' && (
                             <video src={post.mediaUrl} controls className="w-full h-auto max-h-48 object-cover" />
                          )}
                          {post.type === 'music' && (
                             <div className="p-4 w-full flex items-center gap-3">
                                <div className="bg-sky-100 p-3 rounded-full text-sky-600"><Music className="h-6 w-6" /></div>
                                <a href={post.mediaUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-sky-600 hover:underline break-all truncate">
                                   Escuchar Pista
                                </a>
                             </div>
                          )}
                          {post.type === 'link' && (
                             <div className="w-full">
                                {(() => {
                                    const url = post.mediaUrl || "";
                                    let embedUrl = "";
                                    let isEmbeddable = false;
                                    
                                    try {
                                      if (url.includes('instagram.com/')) {
                                          embedUrl = url.split('?')[0].replace(/\/$/, '') + '/embed';
                                          isEmbeddable = true;
                                      } else if (url.includes('youtube.com/watch?v=')) {
                                          const videoId = new URL(url).searchParams.get('v');
                                          embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                          isEmbeddable = true;
                                      } else if (url.includes('youtu.be/')) {
                                          const videoId = url.split('youtu.be/')[1].split('?')[0];
                                          embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                          isEmbeddable = true;
                                      } else if (url.includes('spotify.com/')) {
                                          embedUrl = url.replace('spotify.com/', 'spotify.com/embed/');
                                          isEmbeddable = true;
                                      }
                                    } catch (e) {
                                      isEmbeddable = false;
                                    }
                                    
                                    return isEmbeddable ? (
                                       <iframe 
                                          src={embedUrl} 
                                          className="w-full aspect-square border-0 bg-white" 
                                          allowFullScreen 
                                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                          loading="lazy"
                                       />
                                    ) : (
                                       <div className="p-4 w-full flex items-center gap-3">
                                         <div className="bg-sky-100 p-3 rounded-full text-sky-600 shrink-0"><Link className="h-6 w-6" /></div>
                                         <a href={post.mediaUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-sky-600 hover:underline break-all">
                                            {post.mediaUrl}
                                         </a>
                                       </div>
                                    );
                                })()}
                             </div>
                          )}
                       </div>
                    )}
                    
                    {(post.content || isCompact) && (
                       <div className={`flex flex-col flex-1 ${isCompact ? 'mb-2 justify-center' : 'mb-4'}`}>
                         {post.content && (
                           <p className={`text-slate-700 font-medium whitespace-pre-wrap select-none pointer-events-none w-full ${
                             isCompact ? 'text-[10px] line-clamp-3 leading-snug' : 'text-sm leading-relaxed' 
                           }`}>
                             {post.content}
                           </p>
                         )}
                         {isCompact && !post.content && post.type !== 'text' && (
                           <div className="flex items-center gap-2 justify-center py-2 text-sky-600/50">
                             {getTypeIcon(post.type)}
                           </div>
                         )}
                       </div>
                    )}
                    
                    {!isCompact && (
                      <div className="flex flex-col gap-1 mb-4">
                         {post.associatedFestivalId && festivals.find(f => f.id === post.associatedFestivalId) && (
                            <div className="text-[10px] font-bold text-pink-600 bg-pink-50 rounded-lg px-2 py-1 inline-flex items-center gap-1 w-max truncate max-w-full">
                               🎬 <span className="truncate">{festivals.find(f => f.id === post.associatedFestivalId)?.name}</span>
                            </div>
                         )}
                         {post.associatedTaskId && tasks.find(t => t.id === post.associatedTaskId) && (
                            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-lg px-2 py-1 inline-flex items-center gap-1 w-max truncate max-w-full">
                               ✅ <span className="truncate">{tasks.find(t => t.id === post.associatedTaskId)?.title}</span>
                            </div>
                         )}
                      </div>
                    )}
                    
                    <div className={`mt-auto border-t border-sky-50 flex items-center justify-between opacity-50 group-hover:opacity-100 transition ${isCompact ? 'pt-2' : 'pt-3'}`}>
                      {!isCompact && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatDisplayDate(post.createdAt)}
                        </span>
                      )}
                      {isCompact && <span className="flex-1" />}
                      {isAuthorized && (
                        <div className={`flex relative z-50 ${isCompact ? 'gap-1' : 'gap-2'}`}>
                           <button
                             onPointerDown={(e) => e.stopPropagation()}
                             onMouseDown={(e) => e.stopPropagation()}
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingPost(post);
                             }}
                             className={`text-sky-400 hover:text-sky-600 transition bg-sky-50 rounded-lg cursor-pointer pointer-events-auto ${isCompact ? 'p-1' : 'p-1.5'}`}
                             title="Editar"
                           >
                              <Edit3 className="h-3 w-3" />
                           </button>
                           <button
                             onPointerDown={(e) => e.stopPropagation()}
                             onMouseDown={(e) => e.stopPropagation()}
                             onClick={(e) => {
                               e.stopPropagation();
                               setConfirmConfig({
                                 isOpen: true,
                                 title: "¿Eliminar este item de la pizarra?",
                                 onConfirm: () => {
                                   setPosts(posts.filter(p => p.id !== post.id));
                                   showToast("Eliminado");
                                 }
                               });
                             }}
                             className={`text-red-400 hover:text-red-600 transition bg-red-50 rounded-lg cursor-pointer pointer-events-auto ${isCompact ? 'p-1' : 'p-1.5'}`}
                             title="Eliminar"
                           >
                             <Trash2 className="h-3 w-3" />
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
               }}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {items.length === 0 && !editingPost && (
              <div className="col-span-full flex flex-col items-center justify-center py-6 bg-white/50 border-2 border-dashed border-sky-200 rounded-[2rem]">
                <LayoutGrid className="h-8 w-8 text-sky-200 mb-2" />
                <h3 className="text-xs font-black text-sky-800/40 uppercase tracking-tight">Vacío</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black tracking-widest uppercase text-sky-800">
          Pizarra Activa
        </h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setViewMode(viewMode === 'expanded' ? 'compact' : 'expanded')}
            className="p-2 border-2 border-sky-100 rounded-xl bg-white text-sky-500 hover:text-sky-700 hover:bg-sky-50 transition"
            title={viewMode === 'expanded' ? "Vista Compacta" : "Vista Expandida"}
          >
            {viewMode === 'expanded' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </button>
          {isAuthorized && (
            <button
              onClick={handleAddNew}
              className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-sky-700 transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Añadir 
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingPost && (
          <motion.div
            key="social-post-editor-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white p-6 rounded-[2rem] shadow-2xl border border-sky-100 flex flex-col lg:flex-row gap-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setEditingPost(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors z-50 block lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>

            <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 pb-2 border-b border-sky-50">
              {(['text', 'image', 'video', 'link', 'music', 'task'] as SocialPost['type'][]).map((type, idx) => (
                <button
                  key={`${type}-${idx}`}
                  onClick={() => setEditingPost({ ...editingPost, type })}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 shrink-0 ${
                    editingPost.type === type 
                      ? 'bg-sky-600 text-white shadow-md' 
                      : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                  }`}
                >
                  {getTypeIcon(type)} {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <textarea
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    placeholder="Escribe el copy o descripción..."
                    className="w-full h-32 p-4 bg-sky-50/50 border-2 border-sky-100 rounded-2xl focus:border-sky-400 focus:outline-none resize-none text-slate-700 font-medium"
                  />
               </div>
               
               <div className="flex flex-col gap-3">
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Estado</label>
                     <select 
                       className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none text-xs font-bold text-slate-700"
                       value={editingPost.status}
                       onChange={e => setEditingPost({...editingPost, status: e.target.value as SocialPost['status']})}
                     >
                       <option value="draft">Borrador</option>
                       <option value="pending">Pendiente</option>
                       <option value="published">Publicado</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Deadline</label>
                     <input 
                        type="datetime-local"
                        className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none text-xs font-bold text-slate-700"
                        value={editingPost.scheduledDate ? (editingPost.scheduledDate.includes('Z') ? new Date(new Date(editingPost.scheduledDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0,16) : editingPost.scheduledDate) : ""}
                        onChange={e => setEditingPost({...editingPost, scheduledDate: e.target.value ? e.target.value : undefined})}
                     />
                   </div>
                 </div>

                 {editingPost.type !== 'text' && editingPost.type !== 'task' && (
                    <div className="border-t border-sky-50 pt-3">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Recurso (URL o Galería)</label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setShowDrive(prev => !prev)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${showDrive ? 'bg-sky-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                          >
                            Google Drive
                          </button>
                          {(editingPost.type === 'image' || editingPost.type === 'video') && (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase transition"
                            >
                              Subir Local
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload}
                        accept={editingPost.type === 'image' ? 'image/*' : editingPost.type === 'video' ? 'video/*' : undefined}
                        className="hidden" 
                      />
                      
                      {showDrive && (
                        <div className="mb-3">
                           <DriveFolderExplorer onSelectFile={(url) => {
                              setEditingPost({...editingPost, mediaUrl: url});
                              setShowDrive(false);
                           }} />
                        </div>
                      )}

                      {(editingPost.type === 'image' || editingPost.type === 'video') ? (
                         <div className="flex gap-2 mb-2">
                           <select
                             className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none text-xs font-bold text-slate-700"
                             value=""
                             onChange={e => e.target.value && setEditingPost({...editingPost, mediaUrl: e.target.value})}
                           >
                             <option value="">-- Seleccionar de Galería --</option>
                             {gallery.filter(g => g.type === editingPost.type).map((g, idx) => (
                                <option key={`${g.id}-${idx}`} value={g.url}>{g.name}</option>
                             ))}
                           </select>
                         </div>
                      ) : null}
                      
                      <input 
                         type="text"
                         className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none text-xs font-bold text-slate-700"
                         placeholder={`URL del ${editingPost.type}...`}
                         value={editingPost.mediaUrl || ""}
                         onChange={e => setEditingPost({...editingPost, mediaUrl: e.target.value})}
                      />
                    </div>
                 )}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Festival (Opcional)</label>
                  <select 
                     className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none text-xs font-bold text-slate-700"
                     value={editingPost.associatedFestivalId || ""}
                     onChange={e => setEditingPost({...editingPost, associatedFestivalId: e.target.value})}
                  >
                     <option value="">-- Ninguno --</option>
                     {festivals.map((f, idx) => (
                        <option key={`sm-fest-opt-${f.id}-${idx}`} value={f.id}>{f.name}</option>
                     ))}
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Tarea (Opcional)</label>
                  <select 
                     className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none text-xs font-bold text-slate-700"
                     value={editingPost.associatedTaskId || ""}
                     onChange={e => setEditingPost({...editingPost, associatedTaskId: e.target.value})}
                  >
                     <option value="">-- Ninguna --</option>
                     {tasks.map((t, idx) => (
                        <option key={`sm-task-opt-${t.id || 't'}-${idx}`} value={t.id}>{t.title}</option>
                     ))}
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Color (Tarjeta)</label>
                  <div className="flex flex-col gap-2">
                     <div className="flex flex-wrap gap-2 items-center">
                        {[ 
                          "#ffffff", // Blanco
                          "#fefce8", // Amarillo súper claro
                          "#fdf2f8", // Rosa súper claro
                          "#f0fdf4", // Verde súper claro
                          "#eff6ff", // Azul súper claro
                          "#f5f3ff", // Violeta súper claro
                          "#fff7ed"  // Naranja súper claro
                        ].map((colorHex, idx) => (
                          <button
                            key={`c1-${colorHex}-${idx}`}
                            onClick={() => setEditingPost({...editingPost, color: colorHex})}
                            className={`w-6 h-6 rounded-full border-2 transition-all shadow-sm ${
                               (editingPost.color || '#ffffff') === colorHex 
                                 ? 'border-sky-500 scale-110' 
                                 : 'border-slate-200 hover:scale-105'
                            }`}
                            style={{ backgroundColor: colorHex }}
                            title={colorHex}
                          />
                        ))}
                     </div>
                     <div className="flex flex-wrap gap-2 items-center">
                        {[ 
                          "#fef08a", // Amarillo pastel saturado
                          "#fbcfe8", // Rosa pastel saturado
                          "#bbf7d0", // Verde pastel saturado
                          "#bfdbfe", // Azul pastel saturado
                          "#ddd6fe", // Violeta pastel saturado
                          "#fed7aa", // Naranja pastel saturado
                          "#e2e8f0"  // Gris pastel
                        ].map((colorHex, idx) => (
                          <button
                            key={`c2-${colorHex}-${idx}`}
                            onClick={() => setEditingPost({...editingPost, color: colorHex})}
                            className={`w-6 h-6 rounded-full border-2 transition-all shadow-sm ${
                               (editingPost.color || '#ffffff') === colorHex 
                                 ? 'border-sky-500 scale-110' 
                                 : 'border-slate-200 hover:scale-105'
                            }`}
                            style={{ backgroundColor: colorHex }}
                            title={colorHex}
                          />
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingPost(null)}
                className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveEdit(editingPost)}
                className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-sky-600 text-white hover:bg-sky-700 shadow-md transition"
              >
                Guardar
              </button>
            </div>
            </div>
            {/* End of Left Side */}

            <div className="hidden lg:flex flex-col w-12 shrink-0 relative">
              <button
                onClick={() => setEditingPost(null)}
                className="absolute -top-2 right-4 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors z-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col gap-8">
          {renderDroppable('social-pending', 'Pendientes', sortedList.filter(p => p.status === 'pending'))}
          {renderDroppable('social-draft', 'Borradores', sortedList.filter(p => p.status === 'draft'))}
          {renderDroppable('social-published', 'Publicados', sortedList.filter(p => p.status === 'published'))}
        </div>
      </DragDropContext>
    </div>
  );
};

