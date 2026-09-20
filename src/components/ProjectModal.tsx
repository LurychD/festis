/**
 * Modal de Creación y Edición de Proyectos / Obras Audiovisuales.
 * Incluye procesamiento cliente de ícono, configuración de resolución, FPS y paleta de color.
 */

import React, { useState } from 'react';
import { X, Upload, Film, Palette, Users, Sparkles, Check, Loader2 } from 'lucide-react';
import { Project, ProjectThemeConfig } from '../types';
import { uploadProjectIcon } from '../utils/storageHelpers';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    fps: number;
    resolution: string;
    iconUrl?: string;
    theme?: Partial<ProjectThemeConfig>;
    initialMemberEmails?: string[];
    tags?: string[];
    description?: string;
  }) => Promise<void>;
  projectToEdit?: Project | null;
}

const PRESET_COLORS = [
  { dominant: '#e91e63', sub: '#bae6fd', accent: '#fef08a', label: 'Festis Rosa' },
  { dominant: '#3b82f6', sub: '#dbeafe', accent: '#f59e0b', label: 'Azul Cine' },
  { dominant: '#10b981', sub: '#d1fae5', accent: '#6366f1', label: 'Esmeralda' },
  { dominant: '#8b5cf6', sub: '#ede9fe', accent: '#ec4899', label: 'Violeta' },
  { dominant: '#0f172a', sub: '#1e293b', accent: '#38bdf8', label: 'Noche Oscuro' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectToEdit,
}) => {
  const [name, setName] = useState<string>(projectToEdit?.name || '');
  const [fps, setFps] = useState<number>(projectToEdit?.fps || 24);
  const [resolution, setResolution] = useState<string>(projectToEdit?.resolution || '1920x1080');
  const [iconUrl, setIconUrl] = useState<string>(projectToEdit?.iconUrl || '');
  const [colorDominante, setColorDominante] = useState<string>(
    projectToEdit?.theme?.colorDominante || '#e91e63'
  );
  const [colorSub, setColorSub] = useState<string>(
    projectToEdit?.theme?.colorSub || '#bae6fd'
  );
  const [colorAcento, setColorAcento] = useState<string>(
    projectToEdit?.theme?.colorAcento || '#fef08a'
  );
  const [tipoFondo, setTipoFondo] = useState<'solido' | 'imagen' | 'gradiente_animado'>(
    projectToEdit?.theme?.tipoFondo || 'solido'
  );
  const [valorFondo, setValorFondo] = useState<string>(
    projectToEdit?.theme?.valorFondo || '#f8fafc'
  );
  const [memberEmailsInput, setMemberEmailsInput] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>(projectToEdit?.tags?.join(', ') || '');

  const [isUploadingIcon, setIsUploadingIcon] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Manejador de subida y compresión en cliente del ícono
  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    setUploadProgress(10);
    setErrorMsg(null);

    try {
      // Si estamos editando usamos el ID existente, si es nuevo generamos el prefijo
      const targetProjectId = projectToEdit?.id || `proj_temp_${Date.now()}`;
      const url = await uploadProjectIcon(file, targetProjectId, (pct) => {
        setUploadProgress(pct);
      });
      setIconUrl(url);
    } catch (err: any) {
      console.error('Error al procesar el ícono del proyecto:', err);
      setErrorMsg('No se pudo procesar la imagen del ícono. Verifique la conexión.');
    } finally {
      setIsUploadingIcon(false);
      setUploadProgress(0);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
    setColorDominante(preset.dominant);
    setColorSub(preset.sub);
    setColorAcento(preset.accent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la obra audiovisual es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const emailList = memberEmailsInput
        .split(',')
        .map((em) => em.trim())
        .filter((em) => em.length > 0);

      const tagsList = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSubmit({
        name: name.trim(),
        fps: Number(fps) || 24,
        resolution: resolution.trim() || '1920x1080',
        iconUrl: iconUrl.trim(),
        tags: tagsList,
        theme: {
          colorDominante,
          colorSub,
          colorAcento,
          tipoFondo,
          valorFondo,
        },
        initialMemberEmails: emailList,
      });

      onClose();
    } catch (err: any) {
      console.error('Error al guardar el proyecto:', err);
      setErrorMsg(err.message || 'Error inesperado al guardar el proyecto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 my-8">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {projectToEdit ? 'Editar Obra Audiovisual' : 'Nueva Obra Audiovisual'}
              </h2>
              <p className="text-xs text-slate-500">
                Configura los parámetros técnicos, cromáticos y de equipo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre e Ícono */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
            <div className="sm:col-span-1 flex flex-col items-center">
              <label className="text-xs font-semibold text-slate-700 mb-2">Ícono / Poster</label>
              <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center overflow-hidden transition-all group">
                {iconUrl ? (
                  <img src={iconUrl} alt="Ícono de proyecto" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
                {isUploadingIcon && (
                  <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin mb-1" />
                    <span>{uploadProgress}%</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  disabled={isUploadingIcon}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1">WebP 1024px</span>
            </div>

            <div className="sm:col-span-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Obra o Proyecto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Festis, Cortometraje 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">FPS (Cadencia)</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
                  >
                    <option value={23.976}>23.976 fps</option>
                    <option value={24}>24 fps (Cine estándar)</option>
                    <option value={25}>25 fps (PAL / Europa)</option>
                    <option value={29.97}>29.97 fps (NTSC)</option>
                    <option value={30}>30 fps</option>
                    <option value={60}>60 fps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resolución</label>
                  <input
                    type="text"
                    placeholder="1920x1080, 4K, 2K DCI"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Etiquetas / Tags de la Obra (separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ficción, Cortometraje, Drama, Animación, 4K"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Paleta de Colores de la Obra */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-600" />
                Identidad Cromática del Proyecto
              </label>
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handlePresetSelect(preset)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-xs hover:border-slate-400 transition-all text-slate-700"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.dominant }}
                  />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Color Dominante</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1.5">
                  <input
                    type="color"
                    value={colorDominante}
                    onChange={(e) => setColorDominante(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono text-slate-600">{colorDominante}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Color Secundario</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1.5">
                  <input
                    type="color"
                    value={colorSub}
                    onChange={(e) => setColorSub(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono text-slate-600">{colorSub}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Color Acento</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1.5">
                  <input
                    type="color"
                    value={colorAcento}
                    onChange={(e) => setColorAcento(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono text-slate-600">{colorAcento}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Miembros Iniciales (solo en creación) */}
          {!projectToEdit && (
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-600" />
                Invitar Miembros (Opcional)
              </label>
              <input
                type="text"
                placeholder="correos separados por coma: colega@cine.com, productor@estudio.ar"
                value={memberEmailsInput}
                onChange={(e) => setMemberEmailsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-pink-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tu correo se agregará automáticamente como administrador del proyecto.
              </span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingIcon}
              className="py-2.5 px-6 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{projectToEdit ? 'Guardar Cambios' : 'Crear Obra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
