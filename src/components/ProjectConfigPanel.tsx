/**
 * Panel de Configuración de la Obra Audiovisual Activa (Pestaña "Proyecto").
 * Acotado exclusivamente a Parámetros Técnicos e Identidad Visual/Cromática.
 */

import React, { useState } from 'react';
import {
  Film,
  Palette,
  Upload,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import { useProject, useProjectRole } from '../context/ProjectContext';
import { ProjectThemeConfig } from '../types';
import { uploadProjectIcon, uploadProjectThemeFile } from '../utils/storageHelpers';

export const ProjectConfigPanel: React.FC = () => {
  const { currentProject, updateProject } = useProject();
  const { isOwner } = useProjectRole();

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200">
        <Film className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">No hay ningún proyecto activo seleccionado</h3>
        <p className="text-xs text-slate-500 mt-1">
          Selecciona una obra desde el inicio para configurar sus parámetros.
        </p>
      </div>
    );
  }

  // 1. Estados Técnicos
  const [name, setName] = useState<string>(currentProject.name);
  const [fps, setFps] = useState<number>(currentProject.fps || 24);
  const [resolution, setResolution] = useState<string>(currentProject.resolution || '1920x1080');
  const [iconUrl, setIconUrl] = useState<string>(currentProject.iconUrl || '');
  const [isUploadingIcon, setIsUploadingIcon] = useState<boolean>(false);
  const [iconProgress, setIconProgress] = useState<number>(0);

  // 2. Estados de Apariencia
  const [colorDominante, setColorDominante] = useState<string>(
    currentProject.theme?.colorDominante || '#e91e63'
  );
  const [colorSub, setColorSub] = useState<string>(
    currentProject.theme?.colorSub || '#bae6fd'
  );
  const [colorAcento, setColorAcento] = useState<string>(
    currentProject.theme?.colorAcento || '#fef08a'
  );
  const [tipoFondo, setTipoFondo] = useState<'solido' | 'imagen' | 'gradiente_animado'>(
    currentProject.theme?.tipoFondo || 'solido'
  );
  const [valorFondo, setValorFondo] = useState<string>(
    currentProject.theme?.valorFondo || '#f8fafc'
  );
  const [isUploadingThemeBg, setIsUploadingThemeBg] = useState<boolean>(false);
  const [themeBgProgress, setThemeBgProgress] = useState<number>(0);

  // Estado general de guardado y retroalimentación
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reemplazar ícono con compresión cliente
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    setIconProgress(10);
    setErrorMessage(null);

    try {
      const url = await uploadProjectIcon(file, currentProject.id, (p) => setIconProgress(p));
      setIconUrl(url);
    } catch (err: any) {
      console.error('Error al subir el ícono del proyecto:', err);
      setErrorMessage('No se pudo procesar la imagen del ícono.');
    } finally {
      setIsUploadingIcon(false);
      setIconProgress(0);
    }
  };

  // Subir imagen de fondo personalizada
  const handleThemeBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThemeBg(true);
    setThemeBgProgress(10);
    setErrorMessage(null);

    try {
      const url = await uploadProjectThemeFile(file, currentProject.id, (p) => setThemeBgProgress(p));
      setValorFondo(url);
      setTipoFondo('imagen');
    } catch (err: any) {
      console.error('Error al subir imagen de fondo del proyecto:', err);
      setErrorMessage('No se pudo procesar la imagen de fondo.');
    } finally {
      setIsUploadingThemeBg(false);
      setThemeBgProgress(0);
    }
  };

  // Guardar datos técnicos y apariencia en Firestore
  const handleSaveAll = async () => {
    if (!isOwner) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const updatedTheme: ProjectThemeConfig = {
        colorDominante,
        colorSub,
        colorAcento,
        tipoFondo,
        valorFondo,
      };

      await updateProject(currentProject.id, {
        name: name.trim(),
        fps: Number(fps) || 24,
        resolution: resolution.trim() || '1920x1080',
        iconUrl,
        theme: updatedTheme,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error al actualizar el proyecto en Firestore:', err);
      setErrorMessage(err.message || 'Error al persistir cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner de Estado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Configuración de: <span className="text-pink-600">{currentProject.name}</span>
            </h2>
            <p className="text-xs text-slate-500">
              ID: <span className="font-mono">{currentProject.id}</span> • Creador:{' '}
              <span className="font-medium text-slate-700">{currentProject.createdBy}</span>
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || isUploadingIcon || isUploadingThemeBg}
            className="py-2.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveSuccess ? 'Cambios Guardados' : 'Guardar Todo'}</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* 1. PANEL DE DATOS TÉCNICOS */}
      <section className="p-6 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Film className="w-4 h-4 text-pink-600" />
          <span>Parámetros Técnicos de la Obra</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-start">
          {/* Reemplazar Ícono */}
          <div className="flex flex-col items-center sm:col-span-1">
            <label className="text-xs font-semibold text-slate-700 mb-2">Póster / Ícono</label>
            <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center overflow-hidden transition-all group">
              {iconUrl ? (
                <img src={iconUrl} alt="Póster" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
              {isUploadingIcon && (
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                  <Loader2 className="w-4 h-4 animate-spin mb-1" />
                  <span>{iconProgress}%</span>
                </div>
              )}
              {isOwner && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  disabled={isUploadingIcon}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              )}
            </div>
            {isOwner && <span className="text-[10px] text-slate-400 mt-1.5">Toca para reemplazar</span>}
          </div>

          {/* Campos técnicos */}
          <div className="sm:col-span-3 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la Obra
              </label>
              <input
                type="text"
                value={name}
                disabled={!isOwner}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">FPS (Cadencia)</label>
                <select
                  value={fps}
                  disabled={!isOwner}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value={23.976}>23.976 fps</option>
                  <option value={24}>24 fps (Cine)</option>
                  <option value={25}>25 fps (PAL)</option>
                  <option value={29.97}>29.97 fps (NTSC)</option>
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolución</label>
                <input
                  type="text"
                  value={resolution}
                  disabled={!isOwner}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Ej: 1920x1080 o 4K DCI"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PANEL DE IDENTIDAD CROMÁTICA */}
      <section className="p-6 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Palette className="w-4 h-4 text-pink-600" />
          <span>Identidad Visual y Cromática</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Color Dominante</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorDominante}
                disabled={!isOwner}
                onChange={(e) => setColorDominante(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 disabled:opacity-50"
              />
              <span className="font-mono text-xs text-slate-600 uppercase font-medium">
                {colorDominante}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Color Secundario</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorSub}
                disabled={!isOwner}
                onChange={(e) => setColorSub(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 disabled:opacity-50"
              />
              <span className="font-mono text-xs text-slate-600 uppercase font-medium">
                {colorSub}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Color de Acento</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorAcento}
                disabled={!isOwner}
                onChange={(e) => setColorAcento(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 disabled:opacity-50"
              />
              <span className="font-mono text-xs text-slate-600 uppercase font-medium">
                {colorAcento}
              </span>
            </div>
          </div>
        </div>

        {/* Tipo de Fondo */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700">Tipo de Fondo</label>
          <div className="flex flex-wrap gap-3">
            {(['solido', 'imagen', 'gradiente_animado'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={!isOwner}
                onClick={() => setTipoFondo(mode)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  tipoFondo === mode
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 disabled:opacity-50'
                }`}
              >
                {mode === 'solido' && 'Color Sólido'}
                {mode === 'imagen' && 'Imagen Personalizada'}
                {mode === 'gradiente_animado' && 'Gradiente Animado'}
              </button>
            ))}
          </div>

          {tipoFondo === 'solido' && (
            <div className="flex items-center gap-3 pt-2">
              <input
                type="color"
                value={valorFondo.startsWith('#') ? valorFondo : '#f8fafc'}
                disabled={!isOwner}
                onChange={(e) => setValorFondo(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 disabled:opacity-50"
              />
              <span className="font-mono text-xs text-slate-600 uppercase">{valorFondo}</span>
            </div>
          )}

          {tipoFondo === 'imagen' && (
            <div className="pt-2 flex items-center gap-4">
              <div className="relative w-32 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                {valorFondo.startsWith('http') ? (
                  <img src={valorFondo} alt="Fondo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400">Sin imagen</span>
                )}
                {isUploadingThemeBg && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {isOwner && (
                <label className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Fondo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThemeBgUpload}
                    disabled={isUploadingThemeBg}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
