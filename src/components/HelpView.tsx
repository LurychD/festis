import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  Globe,
  BarChart3,
  List,
  Calendar as CalendarIcon,
  FileText,
  CheckCircle2,
  Settings,
  Database,
  Search,
  Filter,
  Plus,
  Rocket,
  Sparkles,
  Zap,
  MousePointer2,
  Bell,
  Bug,
  LineChart
} from 'lucide-react';
import { cn } from '../utils/helpers';

// Funciones para pequeñas animaciones de UI falsas
const AnimatedButton = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={cn("px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors", className)}
  >
    {children}
  </motion.button>
);

const AnimatedTask = () => {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setChecked(c => !c), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 w-64 max-w-full my-4">
      <motion.div 
        animate={checked ? { backgroundColor: "#c1668a", scale: [1, 1.2, 1] } : { backgroundColor: "#e2e8f0" }}
        className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
      >
        {checked && <CheckCircle2 className="h-3 w-3" />}
      </motion.div>
      <div className="flex flex-col">
        <span className={cn("text-xs font-medium transition-all", checked ? "line-through text-slate-400" : "text-slate-700")}>
          Enviar DCP a Festival
        </span>
        <span className="text-[10px] text-[#e91e63] font-bold">Fecha límite: 20 AGO</span>
      </div>
    </div>
  );
};

const AnimatedNotification = () => {
    return (
      <motion.div 
         initial={{ y: 10, opacity: 0 }}
         animate={{ y: [10, 0, 0, 10], opacity: [0, 1, 1, 0] }}
         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
         className="absolute -right-4 -top-8 bg-white p-3 rounded-2xl shadow-xl border border-pink-100 flex items-center gap-3 z-10 w-48"
      >
         <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
             <Bell className="h-4 w-4 text-[#e91e63]" />
         </div>
         <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-tight">Cambio registrado</span>
            <span className="text-[10px] font-medium text-slate-600 leading-tight mt-0.5">Axel completó la tarea.</span>
         </div>
         <motion.div 
            animate={{ x: [0, -10, 10, 0], y: [0, 10, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-4 -right-2 text-slate-800"
         >
             <MousePointer2 className="h-5 w-5 drop-shadow-md" />
         </motion.div>
      </motion.div>
    );
};

export const HelpView: React.FC = () => {
  return (
    <div className="space-y-12 pb-32 pt-6">
      <header className="flex flex-col gap-2 text-center max-w-lg mx-auto">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <HelpCircle className="h-16 w-16 text-[#e91e63] absolute top-0 left-0" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-[#e91e63] rounded-full absolute top-0 left-0 blur-xl -z-10"
          />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 leading-none">
          Manual <span className="text-[#e91e63]">Festis</span>
        </h2>
        <p className="text-slate-600 text-sm font-semibold mt-2">
          ¿Qué es esta app y para qué sirve?
        </p>
      </header>

      {/* Introducción */}
      <section className="glass-card p-8 space-y-4 border-l-4 border-l-[#e91e63] relative overflow-hidden">
        <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-pink-50 opacity-50" />
        <h3 className="text-sm font-bold text-[#e91e63] flex items-center gap-2">
          <Globe className="h-5 w-5" /> ¿Qué es Festis?
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Festis es un <strong className="text-slate-800">Sistema Integral de Gestión de Producción y Distribución</strong> diseñado para el seguimiento de festivales de cine, tareas de equipo y bitácoras asociadas a cada proyecto audiovisual.
        </p>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          La app funciona en la nube en <strong>tiempo real</strong>. Esto significa que si agregás un festival, marcás una tarea como completada, o escribís una nota importante, el resto del equipo lo verá reflejado en su pantalla instantáneamente, sin necesidad de recargar la página.
        </p>
        
        <div className="relative h-32 mt-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center w-full">
           <AnimatedNotification />
           <div className="flex gap-4">
              <div className="w-16 h-20 bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex flex-col gap-2 opacity-50">
                <div className="w-full h-2 bg-slate-200 rounded-full"></div>
                <div className="w-3/4 h-2 bg-slate-200 rounded-full"></div>
                <div className="w-full h-8 bg-pink-50 rounded-lg mt-auto"></div>
              </div>
              <div className="w-16 h-20 bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex flex-col gap-2 opacity-50">
                <div className="w-full h-2 bg-slate-200 rounded-full"></div>
                <div className="w-2/4 h-2 bg-slate-200 rounded-full"></div>
                <div className="w-full h-8 bg-emerald-50 rounded-lg mt-auto"></div>
              </div>
           </div>
        </div>
      </section>

      {/* Secciones Funcionales */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 px-2">Vistas y Herramientas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="glass-card p-6 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
               <List className="h-5 w-5" />
             </div>
             <h4 className="text-sm font-bold text-slate-800">Lista de Festivales</h4>
             <p className="text-xs text-slate-600 font-medium leading-relaxed">
               Podés visualizar todos tus envíos y filtrar por estado (ej: Mostrar solo los "Seleccionados"). Mantené control de los fees pagados y las proyecciones agendadas.
             </p>
             <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100">
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Filter className="h-3 w-3"/> Seleccionados</div>
                <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Search className="h-3 w-3"/> Buscar CABA</div>
             </div>
          </div>
          
          <div className="glass-card p-6 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4 shadow-inner">
               <BarChart3 className="h-5 w-5" />
             </div>
             <h4 className="text-sm font-bold text-slate-800">Dashboard y Estadísticas</h4>
             <p className="text-xs text-slate-600 font-medium leading-relaxed">
               Tu centro de mando visual. Contiene métricas generales y gráficos del estado de las postulaciones y un <strong className="text-slate-800">Mapa Mundial 3D</strong> interactivo para localizar todas las inscripciones.
             </p>
          </div>

          <div className="glass-card p-6 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4 shadow-inner">
               <LineChart className="h-5 w-5" />
             </div>
             <h4 className="text-sm font-bold text-slate-800">Informes</h4>
             <p className="text-xs text-slate-600 font-medium leading-relaxed">
               Generá de inmediato informes PDF o CSV listos para entregar a productores, instituciones reguladoras o directores. Incluye opciones especiales para crear Informes de Proyecciones o Informes Inteligentes.
             </p>
          </div>

          <div className="glass-card p-6 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
               <CalendarIcon className="h-5 w-5" />
             </div>
             <h4 className="text-sm font-bold text-slate-800">Calendario</h4>
             <p className="text-xs text-slate-600 font-medium leading-relaxed">
               Organizador mensual y anual. Muestra automáticamente fechas límite (cierres) en rosado, avisos en amarillo y notificaciones en azul. Ideal para sincronizar reuniones de producción.
             </p>
          </div>

          <div className="glass-card p-6 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-[#e91e63] mb-4 shadow-inner">
               <CheckCircle2 className="h-5 w-5" />
             </div>
             <h4 className="text-sm font-bold text-slate-800">Tareas y Seguimiento</h4>
             <p className="text-xs text-slate-600 font-medium leading-relaxed">
               Cada festival soporta un checklist de tareas con fechas individuales. Aquí podés ver todas las tareas pendientes globales agrupadas. 
             </p>
             <AnimatedTask />
          </div>

          <div className="glass-card p-6 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 mb-4 shadow-inner">
               <FileText className="h-5 w-5" />
             </div>
             <h4 className="text-sm font-bold text-slate-800">Notas Post-its</h4>
             <p className="text-xs text-slate-600 font-medium leading-relaxed">
               Un muro colaborativo personalizable para pegar notas virtuales (Bitácora). Ideal para registrar accesos, URLs importantes, links de visionado (Vimeo), o teléfonos clave de distribuidores.
             </p>
          </div>

          <div className="glass-card p-6 space-y-3 md:col-span-2 border-l-4 border-l-red-500 relative overflow-hidden">
             <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4 shadow-inner relative z-10">
               <Bug className="h-5 w-5" />
             </div>
             <h4 className="text-sm font-bold text-slate-800 relative z-10">Bug Tracker</h4>
             <p className="text-xs text-slate-600 font-medium leading-relaxed relative z-10 max-w-xl">
               ¿Encontraste un error en la aplicación? Esta sección (exclusiva para usuarios autorizados) sirve para documentar y reportar directamente errores de desarrollo al creador de la plataforma.
             </p>
             <Bug className="absolute -bottom-6 -right-6 h-32 w-32 text-red-50 opacity-50 z-0" />
          </div>

        </div>
      </section>

      {/* Configuración y Seguridad */}
      <section className="glass-card p-8 space-y-6 border-l-4 border-l-slate-800">
         <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
           <Database className="h-5 w-5" /> Control y Bases de Datos
         </h3>
         <p className="text-xs text-slate-600 font-medium">
           En la vista de <strong className="text-slate-800">Ajustes</strong> tenés pestañas determinantes:
         </p>

         <div className="pl-4 border-l-2 border-slate-200 space-y-4">
            <div>
               <h4 className="text-xs font-bold text-slate-800">Miembros y Roles</h4>
               <p className="text-xs text-slate-600 mt-1">Los roles definen permisos. <strong>Visitante:</strong> acceso nulo a BD y configuración. <strong>Admin/Dev:</strong> pueden crear, borrar, exportar bases de datos y configurar integrantes del equipo de forma integral.</p>
            </div>
            <div>
               <h4 className="text-xs font-bold text-slate-800">DB, Backups e Importación Local</h4>
               <p className="text-xs text-slate-600 mt-1">Podés importar tu clásica planilla de Excel ("Importar Excel") para inicializar la base de datos velozmente. Además podés descargar todo el sistema en un solo `.zip` o auditar logs de todos los cambios de usuarios.</p>
            </div>
         </div>
      </section>

      <div className="bg-pink-50 border-2 border-pink-100 text-[#c2185b] p-8 rounded-[3rem] text-center space-y-6 shadow-xl shadow-pink-100/50 relative overflow-hidden">
        <Zap className="absolute top-4 left-4 h-16 w-16 text-pink-200/50" />
        <Rocket className="absolute bottom-4 right-4 h-24 w-24 text-pink-200/50" />
        
        <p className="text-xs leading-relaxed font-bold relative z-10 pt-4">
          ¿Dudas o inconvenientes técnicos? <br/>
          <span className="text-[#e91e63] bg-white px-4 py-2 rounded-full shadow-md mt-4 inline-block font-bold">Consultar con Axelito ✨</span>
        </p>
      </div>

    </div>
  );
};
