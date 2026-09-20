import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthProvider';
import { FileIcon, ImageIcon, VideoIcon, ExternalLink, RefreshCw } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

interface DriveFolderExplorerProps {
  onSelectFile: (fileUrl: string) => void;
  folderId?: string;
}

export const DriveFolderExplorer: React.FC<DriveFolderExplorerProps> = ({ 
  onSelectFile, 
  folderId = '1z-HLqctvvigM46hX8sqlG5baJ69Tblrc' 
}) => {
  const { accessToken, loginWithGoogle } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const query = `'${folderId}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&orderBy=modifiedTime desc`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
            setError('Sesión expirada o permisos insuficientes.');
            return;
        }
        throw new Error('Error al cargar la carpeta');
      }
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error general al cargar de Drive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchFiles();
    }
  }, [accessToken, folderId]);

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-xs text-slate-500 mb-3 text-center max-w-xs">Necesitas iniciar sesión nuevamente (y aceptar permisos de Drive) para ver los archivos de campañas.</p>
        <button 
          onClick={loginWithGoogle}
          className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition shadow-sm"
        >
          Conectar con Google Drive
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archivos en Drive</h4>
        <button 
           onClick={fetchFiles}
           className="text-slate-400 hover:text-sky-500 transition"
           disabled={loading}
           title="Actualizar"
        >
           <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg text-center">
          {error}
        </div>
      ) : loading && files.length === 0 ? (
        <div className="flex items-center gap-2 justify-center py-6 text-slate-400">
           <RefreshCw className="w-4 h-4 animate-spin" />
           <span className="text-xs font-bold">Cargando carpeta...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="text-xs text-center text-slate-400 font-medium py-4">
           La carpeta compartida está vacía.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {files.map((file, idx) => {
            const isImage = file.mimeType.startsWith('image/');
            const isVideo = file.mimeType.startsWith('video/');
            
            return (
              <div 
                key={`${file.id}-${idx}`}
                onClick={() => {
                   const fileUrl = (isImage || isVideo) 
                     ? `https://drive.google.com/uc?export=view&id=${file.id}` 
                     : (file.webViewLink || '');
                   if (fileUrl) {
                      onSelectFile(fileUrl);
                   }
                }}
                className="group bg-white border border-slate-200 rounded-lg p-2 flex flex-col gap-2 cursor-pointer hover:border-sky-400 hover:shadow-sm transition-all"
              >
                <div className="h-16 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden relative">
                  {file.thumbnailLink ? (
                    <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    isImage ? <ImageIcon className="w-6 h-6 text-slate-300" /> :
                    isVideo ? <VideoIcon className="w-6 h-6 text-slate-300" /> :
                    <FileIcon className="w-6 h-6 text-slate-300" />
                  )}
                  <div className="absolute top-1 right-1 bg-black/40 p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-600 truncate px-1" title={file.name}>
                  {file.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
