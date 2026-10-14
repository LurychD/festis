/**
 * Panel Dedicado de Gestión de Miembros y Enlaces de Invitación de la Obra.
 * Se monta en la pestaña "Miembros" de ConfigView cuando hay una obra activa.
 * Nombres de roles estrictamente en español: Propietario, Distribuidor, Colaborador, Invitado.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Lock,
  Loader2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useProject, useProjectRole } from '../context/ProjectContext';
import { ProjectRole, PROJECT_ROLE_LABELS, ProjectInvitation } from '../types';

export const ProjectMembersPanel: React.FC = () => {
  const {
    currentProject,
    updateMemberRole,
    removeMember,
    createInviteLink,
  } = useProject();
  const { isOwner } = useProjectRole();

  // Estados para generar invitaciones
  const [inviteRole, setInviteRole] = useState<ProjectRole>('colaborador');
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Estados de edición de miembros
  const [isProcessingMember, setIsProcessingMember] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lista en tiempo real de invitaciones pendientes de esta obra
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);

  useEffect(() => {
    if (!currentProject?.id) return;

    const invRef = collection(db, 'project_invitations');
    const q = query(
      invRef,
      where('projectId', '==', currentProject.id),
      where('used', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ProjectInvitation[] = [];
        snapshot.forEach((snap) => {
          loaded.push({ ...snap.data(), id: snap.id } as ProjectInvitation);
        });
        // Ordenar por fecha de creación decreciente
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPendingInvitations(loaded);
      },
      (err) => {
        console.warn('Aviso: Error al escuchar invitaciones de la obra:', err.message);
      }
    );

    return () => unsubscribe();
  }, [currentProject?.id]);

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200">
        <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">No hay ninguna obra activa</h3>
        <p className="text-xs text-slate-500 mt-1">
          Selecciona una obra audiovisual para gestionar su equipo.
        </p>
      </div>
    );
  }

  // Contabilizar Propietarios para salvaguarda de orfandad
  const ownersCount = currentProject.members.filter((m) => m.role === 'owner').length;

  // Cambiar rol de miembro en tiempo real
  const handleRoleChange = async (email: string, newRole: ProjectRole) => {
    if (!isOwner) return;

    setIsProcessingMember(true);
    setErrorMessage(null);

    try {
      await updateMemberRole(currentProject.id, email, newRole);
      setSuccessMessage(`Rol de ${email} actualizado a ${PROJECT_ROLE_LABELS[newRole]}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar rol del miembro.');
    } finally {
      setIsProcessingMember(false);
    }
  };

  // Desvincular miembro de la obra
  const handleRemoveMember = async (email: string) => {
    if (!isOwner) return;

    setIsProcessingMember(true);
    setErrorMessage(null);

    try {
      await removeMember(currentProject.id, email);
      setSuccessMessage(`Miembro ${email} desvinculado de la obra.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al desvincular miembro.');
    } finally {
      setIsProcessingMember(false);
    }
  };

  // Generar y copiar Enlace Mágico de Invitación
  const handleCreateInviteLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsGeneratingLink(true);
    setErrorMessage(null);

    try {
      const { inviteUrl } = await createInviteLink(
        currentProject.id,
        inviteRole,
        targetEmail.trim() || undefined
      );

      setGeneratedUrl(inviteUrl);
      await navigator.clipboard.writeText(inviteUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 4000);
      setTargetEmail('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al generar enlace de invitación.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copiar nuevamente enlace existente
  const handleCopyExistingLink = async (token: string) => {
    const url = `${window.location.origin}/?invite=${token}`;
    await navigator.clipboard.writeText(url);
    setSuccessMessage('Enlace copiado al portapapeles.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Revocar enlace de invitación
  const handleRevokeInvite = async (token: string) => {
    if (!isOwner) return;
    try {
      await deleteDoc(doc(db, 'project_invitations', token));
      setSuccessMessage('Invitación revocada.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al revocar invitación.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner de Estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Equipo de: <span className="text-pink-600">{currentProject.name}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {currentProject.members.length} {currentProject.members.length === 1 ? 'miembro activo' : 'miembros activos'}
            </p>
          </div>
        </div>

        {!isOwner && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Modo Solo Lectura</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. SECCIÓN: GENERADOR DE ENLACES DE INVITACIÓN (Solo para Propietarios) */}
      {isOwner ? (
        <section className="p-6 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <LinkIcon className="w-4 h-4 text-pink-600" />
            <span>Generar Enlace de Invitación</span>
          </h3>

          <form onSubmit={handleCreateInviteLink} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rol a asignar
                </label>
                <select
                  value={inviteRole}
                  disabled={isGeneratingLink}
                  onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-pink-500 bg-white"
                >
                  <option value="distribuidor">{PROJECT_ROLE_LABELS.distribuidor}</option>
                  <option value="colaborador">{PROJECT_ROLE_LABELS.colaborador}</option>
                  <option value="guest">{PROJECT_ROLE_LABELS.guest}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Destinatario (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com (dejar vacío para enlace abierto)"
                  value={targetEmail}
                  disabled={isGeneratingLink}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-pink-500 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGeneratingLink}
              className="py-2.5 px-5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-pink-600/20 disabled:opacity-50"
            >
              {isGeneratingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>Generar y copiar enlace de invitación</span>
            </button>
          </form>

          {/* Confirmación y visualización del enlace generado */}
          {generatedUrl && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Enlace copiado al portapapeles</span>
                </div>
                <p className="font-mono text-[11px] text-emerald-700 truncate mt-1">
                  {generatedUrl}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedUrl);
                  setCopyFeedback(true);
                  setTimeout(() => setCopyFeedback(false), 3000);
                }}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition-colors"
              >
                {copyFeedback ? 'Copiado' : 'Volver a copiar'}
              </button>
            </div>
          )}

          {/* Lista de invitaciones activas/pendientes */}
          {pendingInvitations.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-700">Enlaces de invitación pendientes</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-100">
                          {PROJECT_ROLE_LABELS[inv.role]}
                        </span>
                        <span className="font-medium text-slate-800 truncate">
                          {inv.targetEmail || 'Cualquiera con el enlace'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Creado: {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyExistingLink(inv.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Copiar enlace"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Revocar invitación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          La generación de invitaciones y la asignación de roles están reservadas a los usuarios con rol <strong className="font-bold text-slate-800">Propietario</strong>.
        </div>
      )}

      {/* 2. SECCIÓN: LISTADO DE MIEMBROS ACTIVOS */}
      <section className="p-6 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-pink-600" />
          <span>Integrantes de la Obra</span>
        </h3>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
          {currentProject.members.map((member) => {
            const isCreator =
              member.email.toLowerCase().trim() ===
              currentProject.createdBy?.toLowerCase().trim();
            const isSoleOwner = member.role === 'owner' && ownersCount <= 1;

            return (
              <div
                key={member.email}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                    {member.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {member.email}
                      {isCreator && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-pink-100 text-pink-700 font-semibold">
                          Creador Original
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      Rol: <strong className="text-slate-600">{PROJECT_ROLE_LABELS[member.role] || member.role}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {isOwner ? (
                    <select
                      value={member.role}
                      disabled={isSoleOwner || isProcessingMember}
                      onChange={(e) => handleRoleChange(member.email, e.target.value as ProjectRole)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 disabled:opacity-50 disabled:bg-slate-100 focus:outline-none focus:border-pink-500"
                      title={
                        isSoleOwner
                          ? 'Único Propietario: designe a otro Propietario antes de cambiar su rol'
                          : 'Cambiar rol'
                      }
                    >
                      <option value="owner">{PROJECT_ROLE_LABELS.owner}</option>
                      <option value="distribuidor">{PROJECT_ROLE_LABELS.distribuidor}</option>
                      <option value="colaborador">{PROJECT_ROLE_LABELS.colaborador}</option>
                      <option value="guest">{PROJECT_ROLE_LABELS.guest}</option>
                    </select>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {PROJECT_ROLE_LABELS[member.role] || member.role}
                    </span>
                  )}

                  {isOwner && (
                    <button
                      type="button"
                      disabled={isSoleOwner || isProcessingMember}
                      onClick={() => handleRemoveMember(member.email)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title={
                        isSoleOwner
                          ? 'No es posible remover al único Propietario de la obra'
                          : 'Desvincular miembro'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
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
