/**
 * Panel de Configuración de la Obra Audiovisual Activa.
 * Permite gestionar datos técnicos, identidad visual/cromática y miembros con control de acceso (RBAC).
 */

import React, { useState } from 'react';
import {
  Film,
  Palette,
  Users,
  Upload,
  Save,
  Check,
  Trash2,
  Plus,
  Loader2,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { ProjectMember, ProjectThemeConfig } from '../types';
import { uploadProjectIcon, uploadProjectThemeFile } from '../utils/storageHelpers';

export const ProjectConfigPanel: React.FC = () => {
  const { currentProject, updateProject } = useProject();

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200">
        <Film className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">No hay ningún proyecto activo seleccionado</h3>
        <p className="text-xs text-slate-500 mt-1">Selecciona una obra desde el inicio para configurar sus parámetros.</p>
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

  // 3. Estados de Equipo
  const [members, setMembers] = useState<ProjectMember[]>(currentProject.members || []);
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'dev' | 'visitante' | 'externo'>('dev');

  // Estado general de guardado y retroalimentación
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reemplazar ícono con compresión
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

  // Agregar miembro al equipo
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    if (members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setErrorMessage('El usuario ya pertenece al equipo de este proyecto.');
      return;
    }

    setMembers([...members, { email: cleanEmail, role: newMemberRole }]);
    setNewMemberEmail('');
    setErrorMessage(null);
  };

  // Eliminar miembro
  const handleRemoveMember = (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === currentProject.createdBy.toLowerCase()) {
      setErrorMessage('No es posible remover al creador original del proyecto.');
      return;
    }
    setMembers(members.filter((m) => m.email.toLowerCase() !== emailToRemove.toLowerCase()));
  };

  // Cambiar rol de miembro
  const handleRoleChange = (email: string, role: 'admin' | 'dev' | 'visitante' | 'externo') => {
    setMembers(
      members.map((m) => (m.email.toLowerCase() === email.toLowerCase() ? { ...m, role } : m))
    );
  };

  // Guardar todos los cambios en Firestore
  const handleSaveAll = async () => {
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

      const authorizedUsers = Array.from(
        new Set(members.map((m) => m.email.toLowerCase().trim()))
      );

      await updateProject(currentProject.id, {
        name: name.trim(),
        fps: Number(fps) || 24,
        resolution: resolution.trim() || '1920x1080',
        iconUrl,
        theme: updatedTheme,
        members,
        authorizedUsers,
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
              ID: <span className="font-mono">{currentProject.id}</span> • Creado por:{' '}
              <span className="font-medium text-slate-700">{currentProject.createdBy}</span>
            </p>
          </div>
        </div>

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
            <label className="text-xs font-semibold text-slate-700 mb-2">Ícono / Poster</label>
            <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center overflow-hidden transition-all group">
              {iconUrl ? (
                <img src={iconUrl} alt="Ícono" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
              {isUploadingIcon && (
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                  <Loader2 className="w-4 h-4 animate-spin mb-1" />
                  <span>{iconProgress}%</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                disabled={isUploadingIcon}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5">Toca para reemplazar</span>
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
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">FPS (Cadencia)</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
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
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PANEL DE APARIENCIA CROMÁTICA */}
      <section className="p-6 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Palette className="w-4 h-4 text-pink-600" />
          <span>Apariencia e Identidad Visual del Proyecto</span>
        </h3>

        {/* Paleta Hexadecimal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Color Dominante</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorDominante}
                onChange={(e) => setColorDominante(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={colorDominante}
                onChange={(e) => setColorDominante(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Color Secundario</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorSub}
                onChange={(e) => setColorSub(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={colorSub}
                onChange={(e) => setColorSub(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Color Acento</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorAcento}
                onChange={(e) => setColorAcento(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={colorAcento}
                onChange={(e) => setColorAcento(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Tipo de Fondo */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700">Tipo de Fondo</label>
          <div className="grid grid-cols-3 gap-3">
            {(['solido', 'imagen', 'gradiente_animado'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTipoFondo(mode)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                  tipoFondo === mode
                    ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-600/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {mode === 'solido' ? 'Sólido' : mode === 'imagen' ? 'Imagen' : 'Gradiente'}
              </button>
            ))}
          </div>

          {/* Configuración condicional según tipo de fondo */}
          {tipoFondo === 'solido' && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Color de Fondo HEX</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={valorFondo}
                  onChange={(e) => setValorFondo(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={valorFondo}
                  onChange={(e) => setValorFondo(e.target.value)}
                  className="w-48 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {tipoFondo === 'imagen' && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800">Imagen de Fondo Personalizada</p>
                <p className="text-[11px] text-slate-500">
                  {valorFondo.startsWith('http') ? 'Imagen actual configurada' : 'No se ha cargado imagen'}
                </p>
              </div>
              <label className="py-2 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer shadow-sm relative flex items-center gap-2">
                {isUploadingThemeBg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-600" />
                    <span>Subiendo ({themeBgProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar Fondo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThemeBgUpload}
                  disabled={isUploadingThemeBg}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          )}

          {tipoFondo === 'gradiente_animado' && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-600">
                Se aplicará un gradiente atmosférico fluido derivado del color dominante ({colorDominante}) y secundario ({colorSub}).
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. PANEL DE EQUIPO Y MIEMBROS DEL PROYECTO */}
      <section className="p-6 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-pink-600" />
          <span>Equipo y Control de Acceso de la Obra</span>
        </h3>

        {/* Formulario para invitar miembro */}
        <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-pink-500"
          />

          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-pink-500 bg-white"
          >
            <option value="admin">Administrador</option>
            <option value="dev">Desarrollador</option>
            <option value="visitante">Visitante (Solo lectura)</option>
            <option value="externo">Externo (Restringido)</option>
          </select>

          <button
            type="submit"
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Miembro</span>
          </button>
        </form>

        {/* Lista de Miembros Actuales */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
          {members.map((member) => {
            const isCreator = member.email.toLowerCase() === currentProject.createdBy.toLowerCase();
            return (
              <div
                key={member.email}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {member.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {member.email}
                      {isCreator && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-pink-100 text-pink-700 font-semibold">
                          Creador
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">Rol: {member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    disabled={isCreator}
                    onChange={(e) => handleRoleChange(member.email, e.target.value as any)}
                    className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 disabled:opacity-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="dev">Dev</option>
                    <option value="visitante">Visitante</option>
                    <option value="externo">Externo</option>
                  </select>

                  {!isCreator && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.email)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remover miembro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
