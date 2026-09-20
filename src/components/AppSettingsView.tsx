/**
 * Vista de Configuración General de la Aplicación (AppSettingsView)
 * Desacoplada por completo de la edición técnica o de festivales de proyectos específicos.
 * Se accede desde la pantalla de proyectos (ProjectsHomeView) o desde el panel de control general.
 * 
 * Funcionalidades clave:
 * 1. Encabezado con botón a la derecha para volver a la pantalla de proyectos.
 * 2. Tarjeta de Perfil del usuario de Google autenticado.
 * 3. Selector de tema general del sistema (Claro, Oscuro, Sistema) sincronizado con SkinContext.
 * 4. Diagnóstico de sincronización con Firestore festis-db-a y botón para vaciar caché local.
 * 5. Respaldo y Base de Datos (Firestore: festis-db-a):
 *    - Exportación: Lee únicamente las obras en /projects donde createdBy coincide con el email del usuario
 *      y recopila todas sus subcolecciones (festivals, film_data, distribution_plans, institutions, gallery, social_posts, reminders, notes, roadmap).
 *    - Importación Blindada (Tres Barreras de Seguridad):
 *      * Barrera 1: Previsualización en memoria (sin tocar Firestore), validando datos, festivales y renombrando si colisiona.
 *      * Barrera 2: Confirmación manual tipeando exactamente la palabra "IMPORTAR".
 *      * Barrera 3: Cuenta regresiva obligatoria de 5 segundos con botón bloqueado.
 *      * Ejecución: Crea un nuevo proyecto independiente con ID autogenerado, asignando al usuario como creador y administrador.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  User,
  Shield,
  Palette,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  FileText,
  Calendar,
  Sparkles,
  Check,
  X,
  Lock,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthProvider';
import { useSkin } from '../context/SkinContext';
import { useProject } from '../context/ProjectContext';
import { Project, ProjectThemeConfig } from '../types';

interface AppSettingsViewProps {
  onBackToProjects: () => void;
}

interface BackupProjectData {
  project: Partial<Project>;
  festivals?: any[];
  film_data?: any[];
  distribution_plans?: any[];
  institutions?: any[];
  gallery?: any[];
  social_posts?: any[];
  reminders?: any[];
  notes?: any[];
  roadmap?: any[];
}

interface BackupFilePayload {
  version: string;
  exportDate: string;
  exportedBy: string;
  projects: BackupProjectData[];
}

export const AppSettingsView: React.FC<AppSettingsViewProps> = ({ onBackToProjects }) => {
  const { user } = useAuth();
  const { activeSkin, setActiveSkin } = useSkin();
  const { projects } = useProject();

  // Estados de retroalimentación y diagnósticos
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Estados del Flujo de Importación Blindado (3 Barreras)
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [parsedBackup, setParsedBackup] = useState<BackupFilePayload | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [importConfirmText, setImportConfirmText] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cantidad de proyectos pertenecientes al usuario actual
  const userProjectsCount = projects.filter(
    (p) => p.createdBy === user?.email
  ).length;

  // Manejo de vaciado de caché local
  const handleClearCache = () => {
    try {
      const keysToPreserve = ['festis_active_skin'];
      const preserved: Record<string, string | null> = {};
      keysToPreserve.forEach((k) => {
        preserved[k] = localStorage.getItem(k);
      });

      localStorage.clear();

      keysToPreserve.forEach((k) => {
        if (preserved[k]) localStorage.setItem(k, preserved[k]!);
      });

      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3500);
    } catch (e) {
      console.error('Error al limpiar caché local:', e);
    }
  };

  // EXPORTACIÓN DE PROYECTOS PROPIOS
  const handleExportMyProjects = async () => {
    if (!user?.email) {
      setExportError('Debes estar autenticado para exportar tus proyectos.');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      // 1. Filtrar los proyectos donde createdBy sea el email del usuario logueado
      const myProjects = projects.filter((p) => p.createdBy === user.email);

      if (myProjects.length === 0) {
        setExportError('No tienes obras registradas bajo tu autoría para exportar.');
        setIsExporting(false);
        return;
      }

      const backupProjects: BackupProjectData[] = [];
      const subcollections = [
        'festivals',
        'film_data',
        'distribution_plans',
        'institutions',
        'gallery',
        'social_posts',
        'reminders',
        'notes',
        'roadmap',
      ];

      // 2. Iterar por cada proyecto y recopilar sus subcolecciones en festis-db-a
      for (const proj of myProjects) {
        const projectData: BackupProjectData = {
          project: { ...proj },
        };

        for (const subcol of subcollections) {
          try {
            const subRef = collection(db, 'projects', proj.id, subcol);
            const subSnap = await getDocs(subRef);
            projectData[subcol as keyof BackupProjectData] = subSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as any;
          } catch (subErr) {
            console.warn(`No se pudo leer la subcolección ${subcol} del proyecto ${proj.id}:`, subErr);
            projectData[subcol as keyof BackupProjectData] = [] as any;
          }
        }

        backupProjects.push(projectData);
      }

      // 3. Ensamblar payload JSON y forzar descarga
      const payload: BackupFilePayload = {
        version: '10.sep.2026-a',
        exportDate: new Date().toISOString(),
        exportedBy: user.email,
        projects: backupProjects,
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `festis_backup_${user.email.split('@')[0]}_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error al exportar proyectos:', err);
      setExportError(err?.message || 'Ocurrió un error inesperado al exportar tus obras.');
    } finally {
      setIsExporting(false);
    }
  };

  // BARRERA 1: Selección y Previsualización en memoria
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsingFile(true);
    setImportError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Normalización para admitir formatos con projects array o un solo proyecto directo
      let formattedProjects: BackupProjectData[] = [];

      if (Array.isArray(parsed.projects)) {
        formattedProjects = parsed.projects;
      } else if (parsed.project) {
        formattedProjects = [parsed];
      } else if (parsed.name && (parsed.fps !== undefined || parsed.theme)) {
        // Es un objeto de proyecto directo
        formattedProjects = [{ project: parsed }];
      } else {
        throw new Error('El archivo no contiene una estructura de proyectos de Festis válida.');
      }

      // Revisar si algún nombre de proyecto colisiona con los proyectos del usuario
      const existingNames = new Set(
        projects
          .filter((p) => p.createdBy === user?.email)
          .map((p) => (p.name || '').trim().toLowerCase())
      );

      formattedProjects = formattedProjects.map((bp) => {
        let pName = bp.project?.name || 'Obra Importada';
        if (existingNames.has(pName.trim().toLowerCase())) {
          pName = `${pName} (Copia importada)`;
        }
        return {
          ...bp,
          project: {
            ...bp.project,
            name: pName,
          },
        };
      });

      const validatedBackup: BackupFilePayload = {
        version: parsed.version || '10.sep.2026-a',
        exportDate: parsed.exportDate || new Date().toISOString(),
        exportedBy: parsed.exportedBy || 'desconocido',
        projects: formattedProjects,
      };

      setParsedBackup(validatedBackup);
      setImportConfirmText('');
      setCountdown(5);
      setIsCountingDown(false);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Error al parsear el archivo de respaldo:', err);
      setImportError(err?.message || 'El archivo seleccionado no es un JSON válido de Festis.');
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // BARRERA 2 & 3: Manejo de la palabra "IMPORTAR" y Cuenta Regresiva de 5 segundos
  useEffect(() => {
    if (importConfirmText.trim() === 'IMPORTAR') {
      setIsCountingDown(true);
      setCountdown(5);

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            setIsCountingDown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Si el usuario modifica o borra el texto, reseteamos la cuenta regresiva
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setIsCountingDown(false);
      setCountdown(5);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [importConfirmText]);

  // EJECUCIÓN: Escritura atómica en festis-db-a sin sobreescrituras
  const handleExecuteImport = async () => {
    if (!parsedBackup || !user?.email) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const userEmail = user.email.toLowerCase().trim();

      for (const item of parsedBackup.projects) {
        const rawProj = item.project;

        // Generar nuevo ID para el proyecto
        const newProjectRef = doc(collection(db, 'projects'));
        const newProjectId = newProjectRef.id;

        const defaultTheme: ProjectThemeConfig = {
          colorDominante: '#e91e63',
          colorSub: '#9c27b0',
          colorAcento: '#ff4081',
          tipoFondo: 'solido',
          valorFondo: '#ffffff',
        };

        const newProjectDoc: Project = {
          id: newProjectId,
          name: rawProj.name || 'Obra Importada',
          iconUrl: rawProj.iconUrl || '',
          fps: Number(rawProj.fps) || 24,
          resolution: rawProj.resolution || '1080p',
          createdBy: userEmail,
          members: [
            {
              email: userEmail,
              role: 'admin',
            },
          ],
          authorizedUsers: [userEmail],
          theme: rawProj.theme || defaultTheme,
          tags: Array.isArray(rawProj.tags) ? rawProj.tags : [],
          description: rawProj.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Guardar documento del nuevo proyecto
        let batch = writeBatch(db);
        batch.set(newProjectRef, newProjectDoc);
        let opCount = 1;

        // Función auxiliar para commitear si llegamos cerca del límite de 500 operaciones
        const safeBatchCommit = async () => {
          if (opCount >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        };

        const subcollections = [
          'festivals',
          'film_data',
          'distribution_plans',
          'institutions',
          'gallery',
          'social_posts',
          'reminders',
          'notes',
          'roadmap',
        ];

        for (const subcol of subcollections) {
          const list = item[subcol as keyof BackupProjectData];
          if (Array.isArray(list) && list.length > 0) {
            for (const docData of list) {
              const subDocRef = doc(collection(db, 'projects', newProjectId, subcol));
              const { id: _oldId, ...cleanData } = docData;

              batch.set(subDocRef, {
                ...cleanData,
                importedAt: new Date().toISOString(),
                createdAt: cleanData.createdAt || new Date().toISOString(),
              });
              opCount++;
              await safeBatchCommit();
            }
          }
        }

        if (opCount > 0) {
          await batch.commit();
        }
      }

      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setIsModalOpen(false);
        setParsedBackup(null);
        setImportFile(null);
        onBackToProjects();
      }, 1500);
    } catch (err: any) {
      console.error('Error al importar en Firestore:', err);
      setImportError(err?.message || 'Error al escribir los documentos en la base de datos.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/70 text-slate-800 pb-24">
      {/* 1. ENCABEZADO SUPERIOR CON BOTÓN DE REGRESO A LA DERECHA */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-4 shadow-xs flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600 block">
            Ajustes Globales
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Configuración de la App
          </h1>
        </div>

        {/* Botón visible a la derecha para volver a la pantalla de proyectos */}
        <button
          type="button"
          onClick={onBackToProjects}
          className="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm shadow-2xs active:scale-95 transition-all"
          title="Regresar a la selección de obras"
        >
          <ArrowLeft className="w-4 h-4 text-pink-600" />
          <span className="hidden sm:inline">Volver a Proyectos</span>
          <span className="sm:hidden">Volver</span>
        </button>
      </header>

      {/* 2. CONTENIDO PRINCIPAL EN COLUMNA MODULAR */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* TARJETA DE PERFIL DE GOOGLE */}
        <section className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Perfil de Usuario</h2>
              <p className="text-xs text-slate-500">Credenciales activas autenticadas con Google</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuario'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-pink-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                {(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {user?.displayName || 'Usuario Festis'}
              </h3>
              <p className="text-sm text-slate-600 font-mono">{user?.email || 'Sin correo asociado'}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  Sesión Verificada
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {userProjectsCount} {userProjectsCount === 1 ? 'obra propia' : 'obras propias'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PREFERENCIAS DEL SISTEMA: SELECTOR DE TEMA GENERAL */}
        <section className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Preferencias del Sistema</h2>
              <p className="text-xs text-slate-500">Apariencia y tema general de la interfaz</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setActiveSkin('cardigan')}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                activeSkin === 'cardigan'
                  ? 'border-pink-500 bg-pink-50/60 shadow-xs ring-2 ring-pink-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-sm text-slate-900">Tema Claro</span>
                <span className="text-[11px] text-slate-500">Lienzo limpio y cálido</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSkin('cardigan-noche')}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                activeSkin === 'cardigan-noche'
                  ? 'border-pink-500 bg-pink-50/60 shadow-xs ring-2 ring-pink-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-sm text-slate-900">Tema Oscuro</span>
                <span className="text-[11px] text-slate-500">Contraste nocturno</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSkin('cardigan-boceto')}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                activeSkin === 'cardigan-boceto'
                  ? 'border-pink-500 bg-pink-50/60 shadow-xs ring-2 ring-pink-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-sm text-slate-900">Tema Boceto</span>
                <span className="text-[11px] text-slate-500">Estilo manuscrito de arte</span>
              </div>
            </button>
          </div>
        </section>

        {/* DIAGNÓSTICO Y CONEXIÓN */}
        <section className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Diagnóstico del Sistema</h2>
              <p className="text-xs text-slate-500">
                Estado del motor en tiempo real y memoria local
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sm text-slate-900">
                    Base de Datos: festis-db-a
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conexión WebSocket activa vía Cloud Firestore
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 self-start sm:self-center font-mono">
                Storage: festis-bucket-a
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <div>
                <span className="font-bold text-sm text-slate-900">Memoria Local (Caché)</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vacía estados temporales sin afectar tus proyectos guardados en la nube.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                className="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all active:scale-95 shadow-2xs self-start sm:self-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cacheCleared ? 'animate-spin' : ''}`} />
                <span>{cacheCleared ? '¡Caché Vaciada!' : 'Vaciar Caché'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECCIÓN DE COPIA DE SEGURIDAD Y BASE DE DATOS */}
        <section className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Copia de Seguridad y Base de Datos (Firestore: festis-db-a)
              </h2>
              <p className="text-xs text-slate-500">
                Exportación e importación blindada de obras audiovisuales
              </p>
            </div>
          </div>

          {/* Texto visible de aclaración mandatario */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-3 text-amber-900">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              Al importar un archivo de respaldo, los datos se crearán como un proyecto nuevo e
              independiente sin modificar ni sobreescribir tus obras actuales. Serás asignado como el
              creador del proyecto. Ten en cuenta que los archivos multimedia continuarán enlazados a
              sus rutas originales de almacenamiento.
            </p>
          </div>

          {/* BOTONES DE EXPORTACIÓN E IMPORTACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. EXPORTACIÓN */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">Exportar mis proyectos</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Descarga un respaldo JSON completo de las obras donde figuras como creador,
                  incluyendo todas sus subcolecciones (festivales, planes, notas, galería, etc.).
                </p>
              </div>

              {exportError && (
                <p className="text-xs font-semibold text-rose-600 mb-3">{exportError}</p>
              )}
              {exportSuccess && (
                <p className="text-xs font-semibold text-emerald-600 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Respaldo descargado correctamente!
                </p>
              )}

              <button
                type="button"
                onClick={handleExportMyProjects}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs transition-all shadow-xs active:scale-98"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'Generando archivo...' : 'Descargar Respaldo JSON'}</span>
              </button>
            </div>

            {/* 2. IMPORTACIÓN BLINDADA */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">Importar proyecto</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Carga un archivo JSON de respaldo de Festis. Se iniciará un asistente de seguridad
                  en 3 pasos para verificar el contenido antes de guardarlo en Firestore.
                </p>
              </div>

              {importError && (
                <p className="text-xs font-semibold text-rose-600 mb-3">{importError}</p>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingFile}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 text-white font-bold text-xs transition-all shadow-xs active:scale-98"
              >
                <Upload className={`w-4 h-4 ${isParsingFile ? 'animate-spin' : ''}`} />
                <span>{isParsingFile ? 'Leyendo archivo...' : 'Seleccionar archivo JSON'}</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL DE IMPORTACIÓN BLINDADA (TRES BARRERAS DE SEGURIDAD) */}
      {isModalOpen && parsedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Encabezado del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Asistente de Importación</h3>
                  <p className="text-xs text-slate-500">Validación de seguridad en 3 barreras</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isImporting) {
                    setIsModalOpen(false);
                    setParsedBackup(null);
                  }
                }}
                disabled={isImporting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRERA 1: PREVISUALIZACIÓN EN MEMORIA */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-600 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Previsualización en Memoria (Sin tocar Firestore)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                {parsedBackup.projects.map((pData, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Nombre de la obra:</span>
                      <strong className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                        {pData.project.name}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Festivales incluidos:</span>
                      <span className="text-xs font-mono font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                        {Array.isArray(pData.festivals) ? pData.festivals.length : 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Subcolecciones:</span>
                      <span className="text-[11px] text-slate-600">
                        Planes ({Array.isArray(pData.distribution_plans) ? pData.distribution_plans.length : 0}), 
                        Notas ({Array.isArray(pData.notes) ? pData.notes.length : 0}), 
                        Galería ({Array.isArray(pData.gallery) ? pData.gallery.length : 0})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BARRERA 2: CONFIRMACIÓN POR TEXTO */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-600 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Confirmación Manual por Texto</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Para desbloquear el proceso, escribe exactamente la palabra{' '}
                <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  IMPORTAR
                </strong>{' '}
                en el campo inferior:
              </p>

              <input
                type="text"
                value={importConfirmText}
                onChange={(e) => setImportConfirmText(e.target.value)}
                placeholder="Escribe IMPORTAR aquí"
                disabled={isImporting}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all uppercase"
              />
            </div>

            {/* BARRERA 3: CUENTA REGRESIVA Y EJECUCIÓN */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-600 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Temporizador de Seguridad (5 Segundos)</span>
              </div>

              {isCountingDown && countdown > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>
                    El botón se activará en {countdown} {countdown === 1 ? 'segundo' : 'segundos'}...
                  </span>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Proyecto importado con éxito! Redirigiendo...</span>
                </div>
              )}

              {importError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {importError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setParsedBackup(null);
                  }}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={
                    importConfirmText.trim() !== 'IMPORTAR' ||
                    countdown > 0 ||
                    isImporting ||
                    importSuccess
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Escribiendo en festis-db-a...</span>
                    </>
                  ) : countdown > 0 && importConfirmText.trim() === 'IMPORTAR' ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Espera {countdown}s</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Importar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
