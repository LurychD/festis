/**
 * Módulo de persistencia y procesamiento cliente para Firebase Storage.
 * Configurado para almacenar assets bajo la jerarquía canónica /projects/{projectId}/.
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../firebase';
import imageCompression from 'browser-image-compression';

/**
 * Sube un archivo a Firebase Storage asegurando la pertenencia al proyecto activo y aplicando compresión cliente.
 */
export function uploadFileToStorage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string>;
export function uploadFileToStorage(
  file: File,
  projectId: string,
  relativeOrFullPath: string,
  onProgress?: (progress: number) => void
): Promise<string>;
export async function uploadFileToStorage(
  file: File,
  arg2: string,
  arg3?: string | ((progress: number) => void),
  arg4?: (progress: number) => void
): Promise<string> {
  let projectId: string;
  let relativeOrFullPath: string;
  let onProgress: ((progress: number) => void) | undefined;

  if (typeof arg3 === 'string') {
    projectId = arg2;
    relativeOrFullPath = arg3;
    onProgress = arg4;
  } else {
    relativeOrFullPath = arg2;
    onProgress = typeof arg3 === 'function' ? arg3 : undefined;
    projectId = (typeof window !== 'undefined' && (localStorage.getItem('festis_active_project_id') || localStorage.getItem('active_project_id'))) || 'default_project';
  }

  if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
    projectId = 'default_project';
  }

  if (!storage) {
    throw new Error('Firebase Storage no se encuentra inicializado.');
  }

  // 1. Verificación previa de sesión y token de autenticación
  if (!auth.currentUser) {
    if (typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }
  }

  if (!auth.currentUser) {
    throw new Error('Sesión no detectada: debe iniciar sesión antes de transferir archivos a Storage.');
  }

  // 2. Forzar refresco de token para asegurar un bearer token fresco y válido en la solicitud
  try {
    await auth.currentUser.getIdToken(true);
  } catch (tokenErr) {
    console.warn('[STORAGE WARN] No se pudo renovar token, continuando con credencial actual:', tokenErr);
  }

  // Normalizar la ruta para garantizar el prefijo canónico projects/{projectId}/
  let finalPath = relativeOrFullPath.trim();
  if (!finalPath.startsWith(`projects/${projectId}/`)) {
    // Si inicia con '/' lo removemos
    const cleanSubPath = finalPath.replace(/^\/+/, '');
    finalPath = `projects/${projectId}/${cleanSubPath}`;
  }

  let fileToUpload: File = file;

  // Compresión en el cliente para imágenes mediante HTML5 Canvas / WebWorker
  if (file.type.startsWith('image/')) {
    const isPosterOrStill = finalPath.toLowerCase().includes('poster') || finalPath.toLowerCase().includes('stills');
    if (!isPosterOrStill) {
      try {
        const options = {
          maxSizeMB: 1, // Límite de 1MB
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: 'image/webp', // Conversión a WebP optimizado
        };
        fileToUpload = await imageCompression(file, options);
      } catch (compressionError) {
        console.warn('Compresión cliente no disponible o fallida, subiendo archivo original:', compressionError);
      }
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const fileRef = ref(storage, finalPath);
      const metadata = { contentType: fileToUpload.type || 'image/webp' };
      const uploadTask = uploadBytesResumable(fileRef, fileToUpload, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        async (error) => {
          console.warn('[STORAGE] Subida directa a Firebase Storage denegada (' + (error.code || error.message) + '). Activando almacenamiento estático local...');
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64Data = (reader.result as string).split(',')[1];
                const response = await fetch('/api/storage/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    path: finalPath,
                    base64Data,
                    contentType: fileToUpload.type || 'image/webp',
                  }),
                });
                if (!response.ok) {
                  throw new Error(`Fallo en el servidor al guardar el archivo (${response.status})`);
                }
                const data = await response.json();
                if (onProgress) onProgress(100);
                resolve(data.url);
              } catch (fallbackError) {
                console.error('[STORAGE FALLBACK ERROR]:', fallbackError);
                reject(error);
              }
            };
            reader.readAsDataURL(fileToUpload);
          } catch (readerError) {
            console.error('[STORAGE READER ERROR]:', readerError);
            reject(error);
          }
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (urlError) {
            console.error('Error al obtener downloadURL de Storage:', urlError);
            reject(urlError);
          }
        }
      );
    } catch (immediateError) {
      console.warn('[STORAGE] Error síncrono al iniciar subida, recurriendo a almacenamiento local:', immediateError);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const response = await fetch('/api/storage/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                path: finalPath,
                base64Data,
                contentType: fileToUpload.type || 'image/webp',
              }),
            });
            if (!response.ok) throw new Error('Error al guardar archivo.');
            const data = await response.json();
            if (onProgress) onProgress(100);
            resolve(data.url);
          } catch (err) {
            reject(immediateError);
          }
        };
        reader.readAsDataURL(fileToUpload);
      } catch (e) {
        reject(immediateError);
      }
    }
  });
};

/**
 * Sube el ícono del proyecto: projects/{projectId}/icon/{timestamp}_{fileName}
 */
export const uploadProjectIcon = async (
  file: File,
  projectId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `icon/${Date.now()}_${sanitizedName}`;
  return uploadFileToStorage(file, projectId, path, onProgress);
};

/**
 * Sube imagen de fondo o recurso de tema: projects/{projectId}/theme/{timestamp}_{fileName}
 */
export const uploadProjectThemeFile = async (
  file: File,
  projectId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `theme/${Date.now()}_${sanitizedName}`;
  return uploadFileToStorage(file, projectId, path, onProgress);
};

/**
 * Sube laureles de festivales: projects/{projectId}/laureles/{timestamp}_{fileName}
 */
export const uploadProjectLaurel = async (
  file: File,
  projectId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `laureles/${Date.now()}_${sanitizedName}`;
  return uploadFileToStorage(file, projectId, path, onProgress);
};

/**
 * Sube recursos de galería: projects/{projectId}/gallery/{categoryId}/{timestamp}_{fileName}
 */
export const uploadProjectGalleryItem = async (
  file: File,
  projectId: string,
  categoryId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanCat = categoryId ? categoryId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'general';
  const path = `gallery/${cleanCat}/${Date.now()}_${sanitizedName}`;
  return uploadFileToStorage(file, projectId, path, onProgress);
};

/**
 * Sube archivos de ficha técnica: projects/{projectId}/film_data/{field}_{timestamp}
 */
export const uploadProjectFilmDataFile = async (
  file: File,
  projectId: string,
  field: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const cleanField = field.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `film_data/${cleanField}_${Date.now()}`;
  return uploadFileToStorage(file, projectId, path, onProgress);
};

/**
 * Elimina un archivo de Firebase Storage dada su URL o referencia.
 */
export const deleteFileFromStorage = async (fileUrlOrPath: string): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase Storage no se encuentra inicializado.');
  }

  try {
    const fileRef = ref(storage, fileUrlOrPath);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn('Aviso: No se pudo eliminar el archivo en Storage o ya fue borrado previamente:', error);
  }
};
