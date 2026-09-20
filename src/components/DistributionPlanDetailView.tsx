import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Building,
  Calendar,
  DollarSign,
  FileText,
  History,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Pencil,
  X,
  Link2,
  FilePlus2,
  AlertTriangle,
  Globe,
  Tag,
  FileDown,
} from "lucide-react";
import {
  DistributionPlan,
  DistributionPlanStatus,
  Festival,
  FestivalStatus,
  DistributionPlanStatusHistory,
  DistributionInstitution,
} from "../types";
import { CountdownModal } from "./CountdownModal";
import { cn } from "../utils/helpers";
import { exportDistributionPlanPDF } from "../utils/distributionPlanPdfExport";

interface DistributionPlanDetailViewProps {
  planId: string;
  distributionPlans: DistributionPlan[];
  setDistributionPlans: React.Dispatch<React.SetStateAction<DistributionPlan[]>>;
  festivals: Festival[];
  setFestivals: React.Dispatch<React.SetStateAction<Festival[]>>;
  institutions?: DistributionInstitution[];
  addAuditLog: (col: string, action: string) => void;
  showAlert: (msg: string) => void;
  userName: string;
  isAuthorized: boolean;
  onBack: () => void;
  onSelectFestival?: (fest: Festival) => void;
}

export const DistributionPlanDetailView: React.FC<DistributionPlanDetailViewProps> = ({
  planId,
  distributionPlans,
  setDistributionPlans,
  festivals,
  setFestivals,
  institutions = [],
  addAuditLog,
  showAlert,
  userName,
  isAuthorized,
  onBack,
  onSelectFestival,
}) => {
  const plan = distributionPlans.find((p) => p.id === planId);

  // Estados de modales
  const [isCountdownOpen, setIsCountdownOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  
  // Modal de actualización de estado (Tira 2)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<DistributionPlanStatus | "">("");
  const [statusJustification, setStatusJustification] = useState("");
  const [statusTimer, setStatusTimer] = useState(3);
  const statusTimerRef = useRef<any>(null);

  // Modal crítico de aprobación institucional (Pase a catálogo oficial)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAcknowledged, setApprovalAcknowledged] = useState(false);
  const [approvalTimer, setApprovalTimer] = useState(5);
  const approvalTimerRef = useRef<any>(null);

  // Modal para vincular festivales preexistentes
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedPreexistingId, setSelectedPreexistingId] = useState("");

  // Modal para añadir festival borrador propio del plan
  const [isDraftFestModalOpen, setIsDraftFestModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCountry, setDraftCountry] = useState("");
  const [draftDeadline, setDraftDeadline] = useState("");
  const [draftStatus, setDraftStatus] = useState<FestivalStatus>(FestivalStatus.POR_ENVIAR);
  const [draftFee, setDraftFee] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftLink, setDraftLink] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftPlatform, setDraftPlatform] = useState("");
  const [draftObservations, setDraftObservations] = useState("");

  // Formulario de edición del plan
  const [editName, setEditName] = useState("");
  const [editInstId, setEditInstId] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editResDate, setEditResDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Estado y función para Exportación a PDF (Institucional vs. Interno)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pdfReportType, setPdfReportType] = useState<"institucion" | "interno">("institucion");
  const [pdfPageSize, setPdfPageSize] = useState<"a4" | "legal">("a4");
  const [pdfOrientation, setPdfOrientation] = useState<"p" | "l">("p");
  const [pdfIncludeNotes, setPdfIncludeNotes] = useState(true);
  const [pdfIncludeObservations, setPdfIncludeObservations] = useState(true);
  const [pdfCustomNotes, setPdfCustomNotes] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExecuteExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const allPlanFestivals = [...draftFestivals, ...linkedPreexistingFestivals];
      await exportDistributionPlanPDF(plan, allPlanFestivals, userName, {
        reportType: pdfReportType,
        pageSize: pdfPageSize,
        orientation: pdfOrientation,
        includeNotes: pdfIncludeNotes,
        includeObservations: pdfIncludeObservations,
        customNotes: pdfCustomNotes,
      });
      addAuditLog(
        "distribution_plans",
        `Se exportó a PDF el plan de distribución '${plan.nombre}' (${pdfReportType === "institucion" ? "Reporte Oficial" : "Uso Interno"}) con ${allPlanFestivals.length} festivales propuestos`
      );
      showAlert(
        pdfReportType === "institucion"
          ? "Dossier oficial para la institución generado con éxito."
          : "Minuta de trabajo para uso interno generada con éxito."
      );
      setIsExportModalOpen(false);
    } catch (err) {
      console.error("Error al exportar PDF del plan:", err);
      showAlert("No se pudo generar el documento PDF del plan.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Manejador del temporizador de 3 segundos para el cambio regular de estado
  useEffect(() => {
    if (isStatusModalOpen) {
      setStatusTimer(3);
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      statusTimerRef.current = setInterval(() => {
        setStatusTimer((prev) => {
          if (prev <= 1) {
            clearInterval(statusTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    }
    return () => {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    };
  }, [isStatusModalOpen]);

  // Manejador del temporizador de 5 segundos para el modal crítico de aprobación
  useEffect(() => {
    if (isApprovalModalOpen && approvalAcknowledged) {
      setApprovalTimer(5);
      if (approvalTimerRef.current) clearInterval(approvalTimerRef.current);
      approvalTimerRef.current = setInterval(() => {
        setApprovalTimer((prev) => {
          if (prev <= 1) {
            clearInterval(approvalTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setApprovalTimer(5);
      if (approvalTimerRef.current) clearInterval(approvalTimerRef.current);
    }
    return () => {
      if (approvalTimerRef.current) clearInterval(approvalTimerRef.current);
    };
  }, [isApprovalModalOpen, approvalAcknowledged]);

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <Building className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          Plan de distribución no encontrado
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          El plan seleccionado no existe o ha sido eliminado recientemente.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:bg-slate-700 inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Planes de Distribución
        </button>
      </div>
    );
  }

  // Normalizar estado actual (soporte retroactivo para 'pendiente' -> 'en_revision')
  const normalizedEstado: DistributionPlanStatus =
    plan.estado === "pendiente" ? "en_revision" : plan.estado;

  // Festivales preexistentes vinculados al plan
  const linkedPreexistingFestivals = festivals.filter(
    (f) => plan.festivalesIds?.includes(f.id) || f.distributionPlanId === plan.id
  );

  // Festivales borrador propios del plan (aún no ingresados a la app oficial)
  const draftFestivals: Festival[] = plan.festivalesBorrador || [];

  // Festivales preexistentes aptos para ser vinculados según regla:
  // Estados permitidos: "Por enviar", "En revisión", "En duda", "Próximamente", "Archivados"
  const allowedStatusesForLinking: string[] = [
    FestivalStatus.POR_ENVIAR,
    "Por enviar",
    FestivalStatus.EN_REVISION,
    "En Revision",
    "En revisión",
    FestivalStatus.EN_DUDA,
    "En duda",
    FestivalStatus.PROXIMAMENTE,
    "Proximamente",
    "Próximamente",
  ];

  const availablePreexistingFestivals = festivals.filter((f) => {
    const isAlreadyLinked =
      plan.festivalesIds?.includes(f.id) || f.distributionPlanId === plan.id;
    if (isAlreadyLinked) return false;

    const isArchived = Boolean(f.archived) || f.status === FestivalStatus.CERRADO;
    const hasAllowedStatus = allowedStatusesForLinking.includes(f.status as string);

    return isArchived || hasAllowedStatus;
  });

  const statusColors: Record<
    string,
    { bg: string; text: string; border: string; label: string }
  > = {
    borrador: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
      label: "Borrador",
    },
    en_revision: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-300",
      label: "En revisión",
    },
    pendiente: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-300",
      label: "En revisión",
    },
    aprobado: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-300",
      label: "Aprobado",
    },
    no_aprobado: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-300",
      label: "No aprobado",
    },
    archivado: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-300",
      label: "Archivado",
    },
  };

  const currentColors = statusColors[normalizedEstado] || statusColors.borrador;

  const getFestivalPastelStyles = (status: FestivalStatus | string, isDraft?: boolean) => {
    if (isDraft) {
      return {
        bg: "bg-amber-50/70",
        border: "border-amber-200/90 hover:border-amber-300",
      };
    }
    const s = typeof status === "string" ? status.toLowerCase() : "";
    if (s.includes("seleccionado") || s.includes("ganado")) {
      return {
        bg: "bg-emerald-50/70",
        border: "border-emerald-200/90 hover:border-emerald-300",
      };
    }
    if (s.includes("revisi") || s.includes("enviado") || s.includes("inscripto")) {
      return {
        bg: "bg-sky-50/70",
        border: "border-sky-200/90 hover:border-sky-300",
      };
    }
    if (s.includes("no seleccionado") || s.includes("descalificado") || s.includes("rechazado")) {
      return {
        bg: "bg-rose-50/70",
        border: "border-rose-200/90 hover:border-rose-300",
      };
    }
    if (s.includes("confirmado")) {
      return {
        bg: "bg-teal-50/70",
        border: "border-teal-200/90 hover:border-teal-300",
      };
    }
    return {
      bg: "bg-slate-50/80",
      border: "border-slate-200/90 hover:border-slate-300",
    };
  };

  const handleUpdatePlan = (updatedPlan: DistributionPlan) => {
    setDistributionPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
  };

  // 1. Abrir Modal de Edición
  const handleOpenEditModal = () => {
    setEditName(plan.nombre);
    setEditInstId(plan.institucionId);
    setEditBudget(plan.presupuestoEstimado ? plan.presupuestoEstimado.toString() : "");
    setEditResDate(
      plan.fechaResolucion ? plan.fechaResolucion.split("T")[0] : ""
    );
    setEditNotes(plan.notas || "");
    setIsEditPlanModalOpen(true);
  };

  const handleSaveEditPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showAlert("El nombre del plan no puede estar vacío.");
      return;
    }

    const selectedInst = institutions.find((i) => i.id === editInstId);
    const updatedPlan: DistributionPlan = {
      ...plan,
      nombre: editName.trim(),
      institucionId: selectedInst ? selectedInst.id : plan.institucionId,
      institucionNombre: selectedInst ? selectedInst.nombre : plan.institucionNombre,
      presupuestoEstimado: editBudget ? parseFloat(editBudget) : 0,
      fechaResolucion: editResDate ? new Date(editResDate).toISOString() : plan.fechaResolucion,
      notas: editNotes.trim(),
    };

    handleUpdatePlan(updatedPlan);
    addAuditLog(
      "distribution_plans",
      `Se actualizaron los datos generales del plan '${updatedPlan.nombre}'`
    );
    setIsEditPlanModalOpen(false);
    showAlert("Plan de distribución actualizado.");
  };

  // 2. Borrar Plan
  const handleConfirmDeletePlan = () => {
    setDistributionPlans((prev) => prev.filter((p) => p.id !== plan.id));
    
    // Desvincular en los festivales
    setFestivals((prev) =>
      prev.map((f) => {
        if (f.distributionPlanId === plan.id) {
          const { distributionPlanId, distributionPlanName, ...rest } = f;
          return rest as Festival;
        }
        return f;
      })
    );

    addAuditLog(
      "distribution_plans",
      `Se eliminó el plan de distribución '${plan.nombre}' (ID: ${plan.id})`
    );
    showAlert("Plan de distribución eliminado.");
    onBack();
  };

  // 3. Abrir Modal de Estado
  const handleOpenStatusModal = () => {
    setTargetStatus("");
    setStatusJustification("");
    setIsStatusModalOpen(true);
  };

  // 4. Enviar Cambio de Estado Regular (o interceptar si es 'aprobado')
  const handleRegularStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) {
      showAlert("Seleccione un estado válido.");
      return;
    }
    if (targetStatus === normalizedEstado) {
      showAlert("El estado seleccionado es igual al actual.");
      return;
    }

    // INTERCEPTAR SI ES 'aprobado'
    if (targetStatus === "aprobado") {
      setIsStatusModalOpen(false);
      setApprovalAcknowledged(false);
      setApprovalTimer(5);
      setIsApprovalModalOpen(true);
      return;
    }

    const historyEntry: DistributionPlanStatusHistory = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 5),
      estadoAnterior: normalizedEstado,
      estadoNuevo: targetStatus,
      fechaHora: new Date().toISOString(),
      autor: userName || "Usuario",
      notas: statusJustification.trim() || "Actualización de estado sin notas adicionales.",
    };

    const updatedPlan: DistributionPlan = {
      ...plan,
      estado: targetStatus,
      statusHistory: [...(plan.statusHistory || []), historyEntry],
    };

    handleUpdatePlan(updatedPlan);
    addAuditLog(
      "distribution_plans",
      `Se actualizó el estado del plan '${plan.nombre}' a '${targetStatus}'`
    );

    setIsStatusModalOpen(false);
    showAlert(`Estado actualizado a: ${statusColors[targetStatus]?.label || targetStatus}`);
  };

  // 5. Confirmación Crítica de Aprobación Institucional
  const handleConfirmInstitutionalApproval = () => {
    const timestampISO = new Date().toISOString();

    // Promover festivales borrador a la base general de festivales
    const promotedDrafts: Festival[] = draftFestivals.map((df) => ({
      ...df,
      esBorradorPlan: false,
      distributionPlanId: plan.id,
      distributionPlanName: plan.nombre,
      institucionNombre: plan.institucionNombre,
      fechaAprobacionInstitucional: timestampISO,
    }));

    // Actualizar festivales preexistentes asociados en la app
    setFestivals((prev) => {
      const updatedExisting = prev.map((f) => {
        if (plan.festivalesIds?.includes(f.id) || f.distributionPlanId === plan.id) {
          return {
            ...f,
            distributionPlanId: plan.id,
            distributionPlanName: plan.nombre,
            institucionNombre: plan.institucionNombre,
            fechaAprobacionInstitucional: timestampISO,
          };
        }
        return f;
      });
      return [...updatedExisting, ...promotedDrafts];
    });

    // Registrar entrada de auditoría inmutable en el historial
    const historyEntry: DistributionPlanStatusHistory = {
      id: Date.now().toString() + "-aprobado",
      estadoAnterior: normalizedEstado,
      estadoNuevo: "aprobado",
      fechaHora: timestampISO,
      autor: userName || "Usuario",
      notas:
        statusJustification.trim() ||
        `Aprobación institucional oficial. Se incorporaron ${promotedDrafts.length} festivales al catálogo general.`,
    };

    const updatedPlan: DistributionPlan = {
      ...plan,
      estado: "aprobado",
      festivalesIds: [
        ...(plan.festivalesIds || []),
        ...promotedDrafts.map((d) => d.id),
      ],
      festivalesBorrador: [], // Se vacían los borradores ya que pasaron a la base oficial
      statusHistory: [...(plan.statusHistory || []), historyEntry],
    };

    handleUpdatePlan(updatedPlan);

    addAuditLog(
      "distribution_plans",
      `Aprobación institucional completada para '${plan.nombre}'. ${promotedDrafts.length} festivales borrador fueron promovidos a la app oficial.`
    );

    setIsApprovalModalOpen(false);
    showAlert("¡Plan aprobado! Festivales incorporados formalmente al catálogo de la app.");
  };

  // 6. Vincular Festival Preexistente
  const handleLinkPreexisting = () => {
    if (!selectedPreexistingId) return;
    const fest = festivals.find((f) => f.id === selectedPreexistingId);
    if (!fest) return;

    const currentIds = plan.festivalesIds || [];
    if (!currentIds.includes(fest.id)) {
      const updatedPlan: DistributionPlan = {
        ...plan,
        festivalesIds: [...currentIds, fest.id],
      };
      handleUpdatePlan(updatedPlan);

      // Sincronizar festival
      setFestivals((prev) =>
        prev.map((item) =>
          item.id === fest.id
            ? {
                ...item,
                distributionPlanId: plan.id,
                distributionPlanName: plan.nombre,
                institucionNombre: plan.institucionNombre,
              }
            : item
        )
      );

      addAuditLog(
        "distribution_plans",
        `Se vinculó el festival preexistente '${fest.name}' al plan '${plan.nombre}'`
      );
      showAlert(`Festival '${fest.name}' vinculado exitosamente.`);
    }

    setSelectedPreexistingId("");
    setIsLinkModalOpen(false);
  };

  // 7. Desvincular Festival Preexistente
  const handleUnlinkPreexisting = (festId: string, festName: string) => {
    if (!confirm(`¿Desvincular el festival '${festName}' de este plan?`)) {
      return;
    }

    const currentIds = plan.festivalesIds || [];
    const updatedPlan: DistributionPlan = {
      ...plan,
      festivalesIds: currentIds.filter((id) => id !== festId),
    };
    handleUpdatePlan(updatedPlan);

    // Limpiar referencia en el festival
    setFestivals((prev) =>
      prev.map((item) => {
        if (item.id === festId) {
          const { distributionPlanId, distributionPlanName, fechaAprobacionInstitucional, ...rest } = item;
          return rest as Festival;
        }
        return item;
      })
    );

    addAuditLog(
      "distribution_plans",
      `Se desvinculó el festival preexistente '${festName}' del plan '${plan.nombre}'`
    );
    showAlert(`Festival '${festName}' desvinculado.`);
  };

  // 8. Crear Festival Borrador Propio del Plan
  const handleCreateDraftFestival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) {
      showAlert("El nombre del festival es obligatorio.");
      return;
    }
    if (!draftCountry.trim()) {
      showAlert("El país del festival es obligatorio.");
      return;
    }

    const newDraftFest: Festival = {
      id: "draft-fest-" + Date.now() + Math.random().toString(36).substring(2, 6),
      name: draftName.trim(),
      country: draftCountry.trim(),
      type: "Festival",
      status: draftStatus || FestivalStatus.POR_ENVIAR,
      deadline: draftDeadline || undefined,
      fee: draftFee ? parseFloat(draftFee) : undefined,
      price: draftPrice.trim() || undefined,
      link: draftLink.trim() || undefined,
      category: draftCategory.trim() || undefined,
      platform: draftPlatform.trim() || undefined,
      observations: draftObservations.trim() || undefined,
      tasks: [],
      esBorradorPlan: true,
      distributionPlanId: plan.id,
      distributionPlanName: plan.nombre,
      institucionNombre: plan.institucionNombre,
      createdAt: new Date().toISOString(),
    };

    const currentDrafts = plan.festivalesBorrador || [];
    const updatedPlan: DistributionPlan = {
      ...plan,
      festivalesBorrador: [...currentDrafts, newDraftFest],
    };

    handleUpdatePlan(updatedPlan);
    addAuditLog(
      "distribution_plans",
      `Se registró el festival borrador '${newDraftFest.name}' dentro del plan '${plan.nombre}'`
    );

    // Reset Form
    setDraftName("");
    setDraftCountry("");
    setDraftDeadline("");
    setDraftStatus(FestivalStatus.POR_ENVIAR);
    setDraftFee("");
    setDraftPrice("");
    setDraftLink("");
    setDraftCategory("");
    setDraftPlatform("");
    setDraftObservations("");
    setIsDraftFestModalOpen(false);

    showAlert(`Festival borrador '${newDraftFest.name}' añadido al plan.`);
  };

  // 9. Eliminar Festival Borrador
  const handleDeleteDraftFestival = (draftId: string, festName: string) => {
    if (!confirm(`¿Eliminar el festival borrador '${festName}' del plan?`)) {
      return;
    }

    const currentDrafts = plan.festivalesBorrador || [];
    const updatedPlan: DistributionPlan = {
      ...plan,
      festivalesBorrador: currentDrafts.filter((d) => d.id !== draftId),
    };

    handleUpdatePlan(updatedPlan);
    addAuditLog(
      "distribution_plans",
      `Se eliminó el festival borrador '${festName}' del plan '${plan.nombre}'`
    );
    showAlert(`Festival borrador '${festName}' eliminado.`);
  };

  // Cálculo de tiempo restante de resolución
  const diffMs = plan.fechaResolucion
    ? new Date(plan.fechaResolucion).getTime() - Date.now()
    : 0;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-200">
      
      {/* ============================================================ */}
      {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES DEL PLAN            */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        
        {/* Volver a listado */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#e91e63] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Planes de Distribución
        </button>

        {/* Acciones de cabecera: Editar Plan, Borrar Plan y Badge de Estado */}
        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
          
          <span
            className={cn(
              "px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full border shadow-xs",
              currentColors.bg,
              currentColors.text,
              currentColors.border
            )}
          >
            {currentColors.label}
          </span>

          {isAuthorized && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
              
              {/* Botón Editar Plan (SVG sin emojis) */}
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
                title="Editar Plan de Distribución"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>

              {/* Botón Borrar Plan (SVG sin emojis) */}
              <button
                type="button"
                onClick={() => setIsDeletePlanModalOpen(true)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
                title="Borrar Plan de Distribución"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Borrar</span>
              </button>

            </div>
          )}

        </div>

      </div>

      {/* ============================================================ */}
      {/* TIRA 1: INFORMACIÓN DEL PLAN                                */}
      {/* ============================================================ */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Encabezado Tira 1 */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#e91e63] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 inline-block">
              Institución: {plan.institucionNombre}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight break-words">
              {plan.nombre}
            </h1>
          </div>

          {plan.fechaResolucion && (
            <button
              onClick={() => setIsCountdownOpen(true)}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start shadow-xs shrink-0"
              title="Ver cuenta regresiva detallada"
            >
              <Clock className="h-4 w-4 animate-pulse text-indigo-600" />
              <span>{daysLeft > 0 ? `${daysLeft} días restantes` : "Plazo cumplido"}</span>
            </button>
          )}
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Organismo / Escuela
            </span>
            <span className="text-sm font-bold text-slate-800 block break-words">
              {plan.institucionNombre}
            </span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Presupuesto Solicitado
            </span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-slate-500" />
              {plan.presupuestoEstimado
                ? plan.presupuestoEstimado.toLocaleString("es-AR")
                : "0"}{" "}
              ARS
            </span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Fecha de Creación
            </span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-500" />
              {plan.fechaCreacion
                ? new Date(plan.fechaCreacion).toLocaleDateString("es-AR")
                : "-"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Plazo de Resolución
            </span>
            <span className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" />
              {plan.fechaResolucion
                ? new Date(plan.fechaResolucion).toLocaleDateString("es-AR")
                : "-"}
            </span>
          </div>

        </div>

        {/* Notas y Requisitos de la Solicitud sin truncar */}
        {plan.notas && (
          <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4 md:p-5 space-y-2">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
              Notas, Requisitos y Bases de la Solicitud
            </span>
            <p className="text-xs md:text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed break-words">
              {plan.notas}
            </p>
          </div>
        )}

      </section>

      {/* ============================================================ */}
      {/* TIRA 2: TRAZABILIDAD INSTITUCIONAL Y ACTUALIZACIÓN DE ESTADO */}
      {/* ============================================================ */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight">
                Trazabilidad Institucional
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Registro inmutable de auditoría y cambios de estado con justificaciones oficiales.
              </p>
            </div>
          </div>

          {/* Botón de Actualizar Estado reubicado en la Tira 2 */}
          {isAuthorized && (
            <button
              onClick={handleOpenStatusModal}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm self-start sm:self-auto"
            >
              <ShieldCheck className="h-4 w-4" />
              Actualizar Estado Institucional
            </button>
          )}
        </div>

        {/* Historial de Trazabilidad */}
        {!plan.statusHistory || plan.statusHistory.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-150 text-xs text-slate-400 font-semibold">
            No se registran cambios de estado en este plan.
          </div>
        ) : (
          <div className="space-y-3">
            {plan.statusHistory.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2 border-l-4 border-l-slate-600 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800 uppercase tracking-wider">
                      {statusColors[item.estadoAnterior || "borrador"]?.label || item.estadoAnterior || "Inicio"}
                    </span>
                    <span className="text-slate-400 font-bold">→</span>
                    <span className="font-black text-rose-600 uppercase tracking-wider">
                      {statusColors[item.estadoNuevo]?.label || item.estadoNuevo}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2">
                    <span>Autor: <strong className="text-slate-700">{item.autor}</strong></span>
                    <span>•</span>
                    <span className="font-mono">{new Date(item.fechaHora).toLocaleString("es-AR")}</span>
                  </div>
                </div>

                {item.notas && (
                  <p className="text-xs text-slate-600 font-medium italic bg-white/80 p-3 rounded-xl border border-slate-150 leading-relaxed whitespace-pre-wrap break-words">
                    "{item.notas}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </section>

      {/* ============================================================ */}
      {/* TIRA 3: GESTIÓN DUAL DE FESTIVALES DEL PLAN                  */}
      {/* ============================================================ */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Encabezado y botones dobles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight">
                  Festivales del Plan
                </h2>
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-black">
                  {linkedPreexistingFestivals.length + draftFestivals.length} festivales
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Festivales postulados o asociados a este plan de distribución.
              </p>
            </div>
          </div>

          {/* Dos botones de acción bien diferenciados */}
          {isAuthorized && (
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Botón A: Vincular festivales preexistentes */}
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <Link2 className="h-4 w-4 text-slate-600" />
                Vincular preexistentes
              </button>

              {/* Botón B: Añadir festival del plan (borrador) */}
              <button
                onClick={() => setIsDraftFestModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-md shadow-rose-600/10"
              >
                <FilePlus2 className="h-4 w-4" />
                Añadir festival del plan
              </button>

            </div>
          )}
        </div>

        {/* Listado conjunto de festivales asociados */}
        {linkedPreexistingFestivals.length === 0 && draftFestivals.length === 0 ? (
          <div className="p-10 text-center bg-slate-50/60 rounded-3xl border-2 border-dashed border-slate-250 space-y-3">
            <Building className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              No hay festivales vinculados a este plan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Utilizá los botones superiores para vincular festivales existentes en la app o crear borradores propios de este plan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            
            {/* 1. Festivales Borrador del Plan */}
            {draftFestivals.map((fest) => {
              const pastel = getFestivalPastelStyles(fest.status, true);
              return (
                <div
                  key={fest.id}
                  className={cn(
                    "rounded-2xl border p-4 md:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                    pastel.bg,
                    pastel.border
                  )}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm md:text-base font-black text-slate-800 break-words">
                        {fest.name}
                      </h4>

                      {/* Badge de Procedencia: Borrador de plan */}
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Borrador de plan
                      </span>

                      {/* Estado del Festival */}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[9px] font-bold">
                        {fest.status}
                      </span>
                    </div>

                    {/* Metadatos: País, Deadline, Fee/Precio, Link */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold flex-wrap">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        País: <strong className="text-slate-700">{fest.country}</strong>
                      </span>
                      <span>
                        Cierre: <strong className="text-slate-700">{fest.deadline || "-"}</strong>
                      </span>
                      <span>
                        Fee:{" "}
                        <strong className="text-slate-700">
                          {fest.fee ? `$ ${fest.fee}` : fest.price || "Gratis"}
                        </strong>
                      </span>

                      {fest.link && (
                        <a
                          href={fest.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Web Oficial
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Acciones para el Festival Borrador */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {onSelectFestival && (
                      <button
                        onClick={() => onSelectFestival(fest)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                        Ver detalles de festival
                      </button>
                    )}
                    {isAuthorized && (
                      <button
                        onClick={() => handleDeleteDraftFestival(fest.id, fest.name)}
                        className="p-2 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="Eliminar festival borrador del plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 2. Festivales Preexistentes Vinculados */}
            {linkedPreexistingFestivals.map((fest) => {
              const pastel = getFestivalPastelStyles(fest.status, false);
              return (
                <div
                  key={fest.id}
                  className={cn(
                    "rounded-2xl border p-4 md:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                    pastel.bg,
                    pastel.border
                  )}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm md:text-base font-black text-slate-800 break-words">
                        {fest.name}
                      </h4>

                      {/* Badge de Procedencia: Existente en app */}
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Existente en app
                      </span>

                      {/* Estado del Festival */}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[9px] font-bold">
                        {fest.status}
                      </span>

                      {fest.isPreliminary && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold">
                          Preliminar
                        </span>
                      )}
                    </div>

                    {/* Metadatos: País, Deadline, Fee/Precio, Link */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold flex-wrap">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        País: <strong className="text-slate-700">{fest.country}</strong>
                      </span>
                      <span>
                        Cierre: <strong className="text-slate-700">{fest.deadline || "-"}</strong>
                      </span>
                      <span>
                        Fee:{" "}
                        <strong className="text-slate-700">
                          {fest.fee ? `$ ${fest.fee}` : fest.price || "Gratis"}
                        </strong>
                      </span>

                      {fest.link && (
                        <a
                          href={fest.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Web Oficial
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Acciones para el Festival Preexistente */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {onSelectFestival && (
                      <button
                        onClick={() => onSelectFestival(fest)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                        Ver detalles de festival
                      </button>
                    )}
                    {isAuthorized && (
                      <button
                        onClick={() => handleUnlinkPreexisting(fest.id, fest.name)}
                        className="p-2 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="Desvincular festival del plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* ============================================================ */}
      {/* SECCIÓN INFERIOR: EXPORTACIÓN FORMAL A PDF INSTITUCIONAL     */}
      {/* ============================================================ */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
              <FileDown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                Exportar Plan para Presentación Institucional
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Generá un dossier técnico en PDF con los datos formales del plan, la institución reguladora y la nómina completa de festivales postulados.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 active:scale-98"
          >
            <FileDown className="h-4 w-4" />
            Exportar Plan en PDF
          </button>
        </div>

        {/* Resumen de los metadatos a incorporar en el PDF */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Organismo Destinatario
            </span>
            <span className="text-xs font-bold text-slate-800 mt-1 truncate">
              {plan.institucionNombre}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Festivales en Nómina
            </span>
            <span className="text-xs font-bold text-slate-800 mt-1">
              {draftFestivals.length + linkedPreexistingFestivals.length} festivales postulados
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Formato Técnico
            </span>
            <span className="text-xs font-bold text-slate-800 mt-1">
              Documento A4 Foliado con Membrete Oficial
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MODAL DE EDICIÓN DEL PLAN                                    */}
      {/* ============================================================ */}
      {isEditPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditPlan}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Pencil className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Editar Plan de Distribución
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPlanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              {institutions.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Institución</label>
                  <select
                    value={editInstId}
                    onChange={(e) => setEditInstId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre} ({inst.responsable})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Presupuesto (ARS)</label>
                  <input
                    type="number"
                    min="0"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Plazo Resolución</label>
                  <input
                    type="date"
                    value={editResDate}
                    onChange={(e) => setEditResDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notas y Requisitos</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditPlanModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMACIÓN DE BORRADO DE PLAN                     */}
      {/* ============================================================ */}
      {isDeletePlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Borrar Plan de Distribución
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Está seguro de que desea eliminar el plan <strong className="text-slate-800">'{plan.nombre}'</strong>?
              Los festivales preexistentes asociados permanecerán en la app pero quedarán desvinculados de este plan.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeletePlanModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePlan}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Eliminar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE ACTUALIZACIÓN DE ESTADO (CON TIMER DE 3 SEGUNDOS)   */}
      {/* ============================================================ */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <form
            onSubmit={handleRegularStatusSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Actualizar Estado Institucional
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Estado actual: <span className="font-bold text-slate-700">{statusColors[normalizedEstado]?.label || normalizedEstado}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Nuevo Estado Institucional <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as DistributionPlanStatus)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 font-medium"
                >
                  <option value="">Seleccione un nuevo estado...</option>
                  {(
                    [
                      { id: "borrador", label: "Borrador" },
                      { id: "en_revision", label: "En revisión" },
                      { id: "aprobado", label: "Aprobado" },
                      { id: "no_aprobado", label: "No aprobado" },
                      { id: "archivado", label: "Archivado" },
                    ] as const
                  )
                    .filter((st) => st.id !== normalizedEstado)
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Justificación / Resolución Oficial (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Fundamentos, número de expediente, dictamen o notas de la resolución..."
                  value={statusJustification}
                  onChange={(e) => setStatusJustification(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>

            {/* Cuenta regresiva de 3 segundos en el botón */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!targetStatus || targetStatus === normalizedEstado || statusTimer > 0}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm",
                  (!targetStatus || targetStatus === normalizedEstado || statusTimer > 0)
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none pointer-events-none"
                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 cursor-pointer"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {!targetStatus
                  ? "Seleccione un Estado"
                  : targetStatus === normalizedEstado
                  ? "Estado Sin Cambios"
                  : statusTimer > 0
                  ? `Espere (${statusTimer}s)...`
                  : targetStatus === "aprobado"
                  ? "Revisar Aprobación Crítica"
                  : "Confirmar Cambio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CRÍTICO: APROBACIÓN INSTITUCIONAL Y PASE A PRODUCCIÓN  */}
      {/* ============================================================ */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-300 space-y-5 animate-in fade-in zoom-in-95">
            
            {/* Header crítico */}
            <div className="flex items-start gap-3 border-b border-rose-100 pb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Acción de Alta Criticidad
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Aprobación Institucional y Pase a Catálogo Oficial
                </h3>
              </div>
            </div>

            {/* Resumen del Plan */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Plan:</span>
                <span className="text-slate-800 font-black">{plan.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Institución Reguladora:</span>
                <span className="text-slate-800 font-black">{plan.institucionNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Presupuesto Aprobado:</span>
                <span className="text-slate-800 font-black">$ {plan.presupuestoEstimado?.toLocaleString("es-AR") || "0"} ARS</span>
              </div>
            </div>

            {/* Desglose Explícito: Festivales Borrador vs Preexistentes */}
            <div className="space-y-3">
              
              {/* Festivales Borrador a Incorporar Formalmente */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FilePlus2 className="h-4 w-4 text-amber-600" />
                    Festivales borrador a incorporar a la app ({draftFestivals.length})
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">
                    Se crearán en el catálogo oficial
                  </span>
                </div>
                {draftFestivals.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl">
                    No hay festivales borrador para crear.
                  </p>
                ) : (
                  <div className="max-h-28 overflow-y-auto space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
                    {draftFestivals.map((df) => (
                      <div key={df.id} className="text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-800">{df.name}</span>
                        <span className="text-[10px] text-slate-500">{df.country}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Festivales Preexistentes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-slate-500" />
                    Festivales preexistentes vinculados ({linkedPreexistingFestivals.length})
                  </span>
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-bold">
                    Actualizarán su metadata de distribución
                  </span>
                </div>
                {linkedPreexistingFestivals.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl">
                    No hay festivales preexistentes vinculados.
                  </p>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {linkedPreexistingFestivals.map((pf) => (
                      <div key={pf.id} className="text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-800">{pf.name}</span>
                        <span className="text-[10px] text-slate-500">{pf.country}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Advertencia de Criticidad y Checkbox Obligatoria */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
              <p className="text-xs font-bold text-rose-800">
                Advertencia: Esta acción no se puede deshacer. Los festivales borrador se incorporarán formalmente a la base oficial de la app y se estampará el timestamp oficial de aprobación.
              </p>
              
              <label className="flex items-start gap-2.5 text-xs font-black text-slate-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={approvalAcknowledged}
                  onChange={(e) => setApprovalAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <span>Entiendo y soy consciente de que esta acción no se puede deshacer.</span>
              </label>
            </div>

            {/* Acciones de Cierre */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmInstitutionalApproval}
                disabled={!approvalAcknowledged || approvalTimer > 0}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg",
                  !approvalAcknowledged || approvalTimer > 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {!approvalAcknowledged
                  ? "Marque la casilla obligatoria"
                  : approvalTimer > 0
                  ? `Habilitando en (${approvalTimer}s)...`
                  : "Confirmar Aprobación Institucional"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PARA VINCULAR FESTIVALES PREEXISTENTES                  */}
      {/* ============================================================ */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Vincular Festival Preexistente
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Festivales en estado Por enviar, En revisión, En duda, Próximamente o Archivados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {availablePreexistingFestivals.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl border">
                  No hay festivales disponibles en los estados requeridos para vincular.
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Seleccione un festival <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPreexistingId}
                    onChange={(e) => setSelectedPreexistingId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 font-medium"
                  >
                    <option value="">Seleccionar festival...</option>
                    {availablePreexistingFestivals.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.country} ({f.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLinkPreexisting}
                disabled={!selectedPreexistingId}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Vincular Festival
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PARA AÑADIR FESTIVAL BORRADOR DEL PLAN                 */}
      {/* ============================================================ */}
      {isDraftFestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDraftFestival}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Añadir Festival Borrador del Plan
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    No ingresará a la app oficial hasta la aprobación del plan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftFestModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nombre del Festival <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Festival Internacional de Mar del Plata"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    País <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Argentina, España..."
                    value={draftCountry}
                    onChange={(e) => setDraftCountry(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Estado Inicial</label>
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as FestivalStatus)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    <option value={FestivalStatus.POR_ENVIAR}>Por enviar</option>
                    <option value={FestivalStatus.EN_REVISION}>En revisión</option>
                    <option value={FestivalStatus.EN_DUDA}>En duda</option>
                    <option value={FestivalStatus.PROXIMAMENTE}>Próximamente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Fecha Límite</label>
                  <input
                    type="date"
                    value={draftDeadline}
                    onChange={(e) => setDraftDeadline(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cuota / Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={draftFee}
                    onChange={(e) => setDraftFee(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Web Oficial</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={draftLink}
                    onChange={(e) => setDraftLink(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Plataforma</label>
                  <input
                    type="text"
                    placeholder="FilmFreeway, Festhome..."
                    value={draftPlatform}
                    onChange={(e) => setDraftPlatform(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Observaciones del Festival</label>
                <textarea
                  rows={2}
                  placeholder="Requisitos de postulación, categoría sugerida..."
                  value={draftObservations}
                  onChange={(e) => setDraftObservations(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDraftFestModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer shadow-md shadow-rose-600/10"
              >
                Guardar Borrador
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Cuenta Regresiva */}
      {isCountdownOpen && plan.fechaResolucion && (
        <CountdownModal
          isOpen={isCountdownOpen}
          onClose={() => setIsCountdownOpen(false)}
          targetDate={plan.fechaResolucion}
          planName={plan.nombre}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL SELECTOR DE EXPORTACIÓN A PDF (OFICIAL VS. INTERNO)    */}
      {/* ============================================================ */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FileDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                    Generar Reporte en PDF
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configurá el formato y destinatario del documento a exportar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isExportingPDF && setIsExportModalOpen(false)}
                disabled={isExportingPDF}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selector de Destinatario del Reporte */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                Tipo de Reporte
              </label>

              {/* Opción 1: Oficial para Institución */}
              <div
                onClick={() => !isExportingPDF && setPdfReportType("institucion")}
                className={cn(
                  "p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                  pdfReportType === "institucion"
                    ? "border-rose-500 bg-rose-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <input
                  type="radio"
                  name="reportType"
                  checked={pdfReportType === "institucion"}
                  onChange={() => setPdfReportType("institucion")}
                  className="mt-1 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Reporte Oficial (Institución Reguladora)
                    </span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black uppercase">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Formato institucional para presentar ante {plan.institucionNombre || "la entidad"}. Oculta estados de postulación y procedencias de borrador. Nómina con número correlativo, país completo, fecha de cierre en DD/MM/AA, costo, link y observaciones.
                  </p>
                </div>
              </div>

              {/* Opción 2: Minuta para Uso Interno */}
              <div
                onClick={() => !isExportingPDF && setPdfReportType("interno")}
                className={cn(
                  "p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                  pdfReportType === "interno"
                    ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <input
                  type="radio"
                  name="reportType"
                  checked={pdfReportType === "interno"}
                  onChange={() => setPdfReportType("interno")}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Minuta de Trabajo (Uso Interno)
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Para el equipo de producción. Discrimina borradores de plan vs. catálogo oficial e incluye estados de postulación (enviado, seleccionado, etc.).
                  </p>
                </div>
              </div>
            </div>

            {/* Opciones de Configuración Visual */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Tamaño de Hoja
                </label>
                <select
                  value={pdfPageSize}
                  onChange={(e) => setPdfPageSize(e.target.value as any)}
                  disabled={isExportingPDF}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 cursor-pointer disabled:opacity-50"
                >
                  <option value="a4">A4 (Estándar)</option>
                  <option value="legal">Oficio / Legal</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Orientación
                </label>
                <select
                  value={pdfOrientation}
                  onChange={(e) => setPdfOrientation(e.target.value as any)}
                  disabled={isExportingPDF}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 cursor-pointer disabled:opacity-50"
                >
                  <option value="p">Vertical (Recomendado)</option>
                  <option value="l">Horizontal / Apaisado</option>
                </select>
              </div>
            </div>

            {/* Campo de Nota Personalizada para el Reporte */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                  Notas Adicionales del Reporte (Opcional)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Si está vacía, no se mostrará en el PDF
                </span>
              </div>
              <textarea
                value={pdfCustomNotes}
                onChange={(e) => setPdfCustomNotes(e.target.value)}
                disabled={isExportingPDF}
                placeholder="Escribí una nota, aclaración o mensaje específico para este documento..."
                rows={2}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none resize-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Checkbox Columna Observaciones */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                type="checkbox"
                id="pdf-include-observations"
                checked={pdfIncludeObservations}
                onChange={(e) => setPdfIncludeObservations(e.target.checked)}
                disabled={isExportingPDF}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <label
                htmlFor="pdf-include-observations"
                className="text-xs font-bold text-slate-700 cursor-pointer select-none"
              >
                Incluir columna de Observaciones en la nómina de festivales
              </label>
            </div>

            {/* Checkbox Notas del Plan (Únicamente para Minuta de Uso Interno) */}
            {pdfReportType === "interno" && (
              <div className="flex items-center gap-2.5 pt-0.5">
                <input
                  type="checkbox"
                  id="pdf-include-notes"
                  checked={pdfIncludeNotes}
                  onChange={(e) => setPdfIncludeNotes(e.target.checked)}
                  disabled={isExportingPDF}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="pdf-include-notes"
                  className="text-xs font-bold text-slate-700 cursor-pointer select-none"
                >
                  Incluir bases y notas técnicas del plan registradas en la base de datos
                </label>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExportingPDF}
                className="px-4 py-2.5 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteExportPDF}
                disabled={isExportingPDF}
                className={cn(
                  "px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md",
                  isExportingPDF
                    ? "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 active:scale-98"
                )}
              >
                {isExportingPDF ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Descargar Documento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
