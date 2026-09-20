import React, { useState } from "react";
import { Plus, Building, FileText, Calendar, DollarSign, CheckCircle2, Trash2, Clock, X } from "lucide-react";
import { DistributionPlan, DistributionInstitution, DistributionPlanStatus, Festival, DistributionPlanStatusHistory } from "../types";
import { cn } from "../utils/helpers";

interface DistributionPlansViewProps {
  distributionPlans: DistributionPlan[];
  setDistributionPlans: React.Dispatch<React.SetStateAction<DistributionPlan[]>>;
  institutions: DistributionInstitution[];
  festivals: Festival[];
  setFestivals: React.Dispatch<React.SetStateAction<Festival[]>>;
  addAuditLog: (col: string, action: string) => void;
  showAlert: (msg: string) => void;
  userName: string;
  isAuthorized: boolean;
  setView: (v: any) => void;
  onSelectPlan?: (planId: string) => void;
}

export const DistributionPlansView: React.FC<DistributionPlansViewProps> = ({
  distributionPlans,
  setDistributionPlans,
  institutions,
  festivals,
  setFestivals,
  addAuditLog,
  showAlert,
  userName,
  isAuthorized,
  setView,
  onSelectPlan,
}) => {
  // Estado para modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [budget, setBudget] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [notes, setNotes] = useState("");

  // Estadísticas del Plan de Distribución (Aisladas)
  const activePlansCount = distributionPlans.filter(p => p.estado !== "archivado").length;
  const approvedPlansCount = distributionPlans.filter(p => p.estado === "aprobado").length;
  const totalBudget = distributionPlans
    .filter(p => p.estado !== "archivado")
    .reduce((sum, p) => sum + (p.presupuestoEstimado || 0), 0);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showAlert("El nombre del plan es obligatorio.");
      return;
    }
    if (!institutionId) {
      showAlert("Debe seleccionar una institución reguladora.");
      return;
    }
    if (!resolutionDate) {
      showAlert("La fecha de resolución es obligatoria.");
      return;
    }

    const selectedInst = institutions.find(i => i.id === institutionId);
    if (!selectedInst) return;

    const initialHistory: DistributionPlanStatusHistory = {
      id: Date.now().toString() + "-init",
      estadoAnterior: "borrador",
      estadoNuevo: "borrador",
      fechaHora: new Date().toISOString(),
      autor: userName,
      notas: "Registro inicial del plan de distribución en estado borrador.",
    };

    const newPlan: DistributionPlan = {
      id: "plan-" + Date.now() + Math.random().toString(36).substring(2, 5),
      nombre: name.trim(),
      institucionId: selectedInst.id,
      institucionNombre: selectedInst.nombre,
      estado: "borrador",
      statusHistory: [initialHistory],
      festivalesIds: [],
      festivalesBorrador: [],
      notas: notes.trim(),
      fechaCreacion: new Date().toISOString(),
      fechaResolucion: new Date(resolutionDate).toISOString(),
      presupuestoEstimado: budget ? parseFloat(budget) : 0,
    };

    setDistributionPlans(prev => [newPlan, ...prev]);
    addAuditLog("distribution_plans", `Se creó el plan de distribución '${newPlan.nombre}' asociado a '${newPlan.institucionNombre}'`);

    // Reset Form
    setName("");
    setInstitutionId("");
    setBudget("");
    setResolutionDate("");
    setNotes("");
    setIsCreateModalOpen(false);
    showAlert("¡Plan de distribución creado con éxito!");
  };

  const handleDeletePlan = (id: string, planName: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el plan '${planName}'? Se conservará el historial en auditoría.`)) {
      return;
    }
    setDistributionPlans(prev => prev.filter(p => p.id !== id));
    addAuditLog("distribution_plans", `Se eliminó el plan de distribución '${planName}' (ID: ${id})`);
    showAlert("Plan de distribución eliminado.");
  };

  const handleOpenDetail = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      setView("distribution_plan_detail");
    }
  };

  const statusBadges: Record<string, { bg: string; text: string; border: string; label: string }> = {
    borrador: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", label: "Borrador" },
    en_revision: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", label: "En revisión" },
    pendiente: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", label: "En revisión" },
    aprobado: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300", label: "Aprobado" },
    no_aprobado: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300", label: "No aprobado" },
    archivado: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300", label: "Archivado" },
  };

  const planPastelCards: Record<string, { bg: string; border: string }> = {
    borrador: { bg: "bg-slate-50/90", border: "border-slate-200 hover:border-slate-300" },
    en_revision: { bg: "bg-amber-50/70", border: "border-amber-200/90 hover:border-amber-300" },
    pendiente: { bg: "bg-amber-50/70", border: "border-amber-200/90 hover:border-amber-300" },
    aprobado: { bg: "bg-emerald-50/70", border: "border-emerald-200/90 hover:border-emerald-300" },
    no_aprobado: { bg: "bg-rose-50/70", border: "border-rose-200/90 hover:border-rose-300" },
    archivado: { bg: "bg-purple-50/70", border: "border-purple-200/90 hover:border-purple-300" },
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      
      {/* TÍTULO ARRIBA DEL TODO (SIN SUBTÍTULO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Planes de Distribución
        </h1>

        {isAuthorized && (
          <button
            onClick={() => {
              if (institutions.length === 0) {
                showAlert("Debe registrar al menos una Institución Reguladora en la sección Configuración antes de crear un plan.");
                return;
              }
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-600/10 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo Plan de Distribución
          </button>
        )}
      </div>

      {/* Decoupled stats summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Planes Activos</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{activePlansCount}</span>
          </div>
          <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <Building className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Planes Aprobados</span>
            <span className="text-2xl font-black text-emerald-600 tracking-tight">{approvedPlansCount}</span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Presupuesto Asignado</span>
            <span className="text-xl font-black text-slate-800 tracking-tight">
              $ {totalBudget.toLocaleString("es-AR")}
            </span>
          </div>
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Plans List - Horizontal Cards (Con Layout Superior de Ancho Completo en Desktop) */}
      {distributionPlans.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md border-2 border-dashed border-slate-250 p-12 text-center rounded-3xl space-y-4">
          <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <Building className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No hay planes registrados</h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Los planes de distribución vinculan festivales con instituciones y organismos reguladores (como ENERC o INCAA) para llevar el control del estado y su respectivo presupuesto.
            </p>
          </div>
          {isAuthorized && (
            <button
              onClick={() => {
                if (institutions.length === 0) {
                  showAlert("Debe registrar al menos una Institución Reguladora en Configuración primero.");
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear mi primer plan
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {distributionPlans.map((plan) => {
            const colors = statusBadges[plan.estado] || statusBadges.borrador;
            const pastelCard = planPastelCards[plan.estado] || planPastelCards.borrador;
            const associatedCount = (plan.festivalesIds?.length || 0) + (plan.festivalesBorrador?.length || 0);
            const diff = plan.fechaResolucion
              ? new Date(plan.fechaResolucion).getTime() - Date.now()
              : 0;
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

            return (
              <div
                key={plan.id}
                className={cn(
                  "w-full rounded-2xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col gap-4",
                  pastelCard.bg,
                  pastelCard.border
                )}
              >
                {/* 1. Encabezado de la Tarjeta: Institución y Estado en ancho completo */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#e91e63] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                      {plan.institucionNombre}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-xs",
                        colors.bg,
                        colors.text,
                        colors.border
                      )}
                    >
                      {colors.label}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Creado el {new Date(plan.fechaCreacion).toLocaleDateString("es-AR")}
                  </span>
                </div>

                {/* 2. Título y Notas: Ocupa todo el ancho horizontal, sin colapsar verticalmente */}
                <div className="w-full space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-snug break-words">
                    {plan.nombre}
                  </h3>

                  {plan.notas && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed break-words">
                      {plan.notas}
                    </p>
                  )}
                </div>

                {/* 3. Metadatos y Botones de Acción: Fila inferior balanceada */}
                <div className="w-full pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Métricas clave en fila responsiva */}
                  <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                        Presupuesto
                      </span>
                      <span className="text-slate-800 font-bold text-sm flex items-center gap-0.5 mt-0.5 whitespace-nowrap">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        {plan.presupuestoEstimado
                          ? plan.presupuestoEstimado.toLocaleString("es-AR")
                          : "0"}{" "}
                        ARS
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                        Festivales
                      </span>
                      <span className="text-slate-800 font-bold text-sm mt-0.5 block whitespace-nowrap">
                        {associatedCount} vinculados
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                        Plazo Resolución
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                        <span className="text-slate-800 font-bold text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {plan.fechaResolucion ? new Date(plan.fechaResolucion).toLocaleDateString("es-AR") : "-"}
                        </span>
                        {plan.fechaResolucion && (
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5",
                              daysLeft > 0
                                ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                                : "text-rose-600 bg-rose-50 border-rose-100"
                            )}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {daysLeft > 0 ? `${daysLeft}d restantes` : "Vencido"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción a la derecha */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
                    <button
                      onClick={() => handleOpenDetail(plan.id)}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileText className="h-4 w-4" />
                      Ver Detalles
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Plan */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <form onSubmit={handleCreatePlan} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <Building className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Nuevo Plan de Distribución
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Nombre del Plan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Plan de Distribución 2026 - Convocatoria Oficial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#e91e63] bg-white text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Institución Reguladora <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#e91e63] bg-white text-slate-800 font-medium"
                >
                  <option value="">Seleccione una institución...</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nombre} ({inst.responsable})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    Presupuesto (ARS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#e91e63] bg-white text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    Fecha Resolución <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={resolutionDate}
                    onChange={(e) => setResolutionDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#e91e63] bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Notas / Requisitos de la Solicitud
                </label>
                <textarea
                  placeholder="Documentación presentada, expediente, condiciones..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-[#e91e63] bg-white text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-200 cursor-pointer"
              >
                Crear Plan
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
