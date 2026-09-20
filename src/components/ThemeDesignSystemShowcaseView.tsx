import React, { useState, useEffect } from 'react';
import { ArrowLeft, Palette, Sparkles, Copy, Check, Sliders, Eye, Layers, Calendar, DollarSign, Award, Tag, AlertCircle, RefreshCw, SlidersHorizontal, Layout, CheckSquare } from 'lucide-react';
import { useSkin } from '../context/SkinContext';

interface Props {
  onBack: () => void;
}

export const ThemeDesignSystemShowcaseView: React.FC<Props> = ({ onBack }) => {
  const { activeSkin, setActiveSkin, skins } = useSkin();
  const [copied, setCopied] = useState(false);

  // Estado del calibrador en vivo para el tema activo o personalización
  const [designParams, setDesignParams] = useState({
    bgGradientStart: '#0b1120',
    bgGradientEnd: '#0f172a',
    cardBg: '#0f172a',
    cardBorderColor: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    inputBg: '#1e293b',
    primaryAccent: '#e91e63',
    borderRadius: 16,
    cardOpacity: 85,
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');

  // Aplicar variables CSS en vivo en el elemento raíz cuando cambien los parámetros
  useEffect(() => {
    if (activeSkin === 'cardigan-noche') {
      const root = document.documentElement;
      root.style.setProperty('--custom-bg-start', designParams.bgGradientStart);
      root.style.setProperty('--custom-bg-end', designParams.bgGradientEnd);
      root.style.setProperty('--custom-card-bg', designParams.cardBg);
      root.style.setProperty('--custom-card-border', designParams.cardBorderColor);
      root.style.setProperty('--custom-text-primary', designParams.textPrimary);
      root.style.setProperty('--custom-text-secondary', designParams.textSecondary);
      root.style.setProperty('--custom-input-bg', designParams.inputBg);
      root.style.setProperty('--custom-accent', designParams.primaryAccent);
      root.style.setProperty('--custom-radius', `${designParams.borderRadius}px`);
    }
  }, [designParams, activeSkin]);

  const handleReset = () => {
    setDesignParams({
      bgGradientStart: '#0b1120',
      bgGradientEnd: '#0f172a',
      cardBg: '#0f172a',
      cardBorderColor: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      inputBg: '#1e293b',
      primaryAccent: '#e91e63',
      borderRadius: 16,
      cardOpacity: 85,
    });
  };

  const generateCSSCode = () => {
    return `/* Reglas CSS Oficiales de Personalización para [data-skin="${activeSkin}"] */
[data-skin="${activeSkin}"] body {
  background-image: linear-gradient(135deg, ${designParams.bgGradientStart} 0%, ${designParams.bgGradientEnd} 100%) !important;
  color: ${designParams.textPrimary} !important;
}

[data-skin="${activeSkin}"] .glass-card,
[data-skin="${activeSkin}"] .bg-white {
  background-color: ${designParams.cardBg} !important;
  border-color: ${designParams.cardBorderColor} !important;
  border-radius: ${designParams.borderRadius}px !important;
  color: ${designParams.textPrimary} !important;
}

[data-skin="${activeSkin}"] .text-slate-900,
[data-skin="${activeSkin}"] .text-slate-800,
[data-skin="${activeSkin}"] .text-slate-700 {
  color: ${designParams.textPrimary} !important;
}

[data-skin="${activeSkin}"] .text-slate-600,
[data-skin="${activeSkin}"] .text-slate-500 {
  color: ${designParams.textSecondary} !important;
}

[data-skin="${activeSkin}"] input,
[data-skin="${activeSkin}"] select,
[data-skin="${activeSkin}"] textarea {
  background-color: ${designParams.inputBg} !important;
  color: ${designParams.textPrimary} !important;
  border-color: ${designParams.cardBorderColor} !important;
  border-radius: ${Math.max(8, designParams.borderRadius - 4)}px !important;
}
`;
  };

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(generateCSSCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-100 p-4 md:p-8 animate-fade-in space-y-6">
      
      {/* HEADER PRINCIPAL DE LA VISTA DEDICADA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/90 border border-slate-800 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 transition-all flex items-center justify-center cursor-pointer shadow-sm group"
            title="Volver a la vista anterior"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20">
                <Palette className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-white">Laboratorio de Diseño & Maqueta UI</h1>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                DEV STANDALONE VIEW
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Entorno de pruebas a pantalla completa para visualizar, calibrar y afinar todos los componentes UI de la app bajo cualquier tema.
            </p>
          </div>
        </div>

        {/* SELECTOR DE TEMAS + BOTONES DE ACCIÓN */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-pink-400" /> Tema:
            </span>
            {skins.map((s) => {
              const isActive = activeSkin === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSkin(s.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center -space-x-1">
                    {s.previewColors.slice(0, 2).map((c, idx) => (
                      <span key={idx} className="w-2.5 h-2.5 rounded-full border border-slate-900" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  {s.name}
                  {s.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase font-black ${
                      s.badge === 'Oficial' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {s.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopyCSS}
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡CSS Copiado!' : 'Exportar Reglas CSS'}
          </button>
        </div>
      </div>

      {/* PESTAÑAS Y NAVEGACIÓN DEL LABORATORIO */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'preview' ? 'bg-slate-800 text-pink-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> Maqueta de Componentes (Showcase)
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'editor' ? 'bg-slate-800 text-pink-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Calibrador & Editor de Estilos
          </button>
        </div>

        {activeTab === 'editor' && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restablecer Valores
          </button>
        )}
      </div>

      {/* HERRAMIENTA DE EDICIÓN / CALIBRADOR (TAB 'EDITOR') */}
      {activeTab === 'editor' && (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Calibrador Personalizable de Temas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Modifica colores, bordes y redondeos para probar cambios directamente sobre el tema visual.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Color Fondo 1 */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Fondo Gradiente (Inicio)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={designParams.bgGradientStart}
                  onChange={(e) => setDesignParams({ ...designParams, bgGradientStart: e.target.value })}
                  className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {designParams.bgGradientStart}
                </span>
              </div>
            </div>

            {/* Color Fondo 2 */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Fondo Gradiente (Fin)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={designParams.bgGradientEnd}
                  onChange={(e) => setDesignParams({ ...designParams, bgGradientEnd: e.target.value })}
                  className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {designParams.bgGradientEnd}
                </span>
              </div>
            </div>

            {/* Fondo de Tarjetas */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Fondo de Tarjetas / Superficies</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={designParams.cardBg}
                  onChange={(e) => setDesignParams({ ...designParams, cardBg: e.target.value })}
                  className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {designParams.cardBg}
                </span>
              </div>
            </div>

            {/* Texto Principal */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Texto Principal</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={designParams.textPrimary}
                  onChange={(e) => setDesignParams({ ...designParams, textPrimary: e.target.value })}
                  className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {designParams.textPrimary}
                </span>
              </div>
            </div>

            {/* Texto Secundario */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Texto Secundario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={designParams.textSecondary}
                  onChange={(e) => setDesignParams({ ...designParams, textSecondary: e.target.value })}
                  className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {designParams.textSecondary}
                </span>
              </div>
            </div>

            {/* Fondo Inputs */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Fondo de Campos (Inputs)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={designParams.inputBg}
                  onChange={(e) => setDesignParams({ ...designParams, inputBg: e.target.value })}
                  className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {designParams.inputBg}
                </span>
              </div>
            </div>

            {/* Radio de Bordes */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Radio de Bordes (Border Radius)</label>
                <span className="text-xs font-mono text-pink-400 font-bold">{designParams.borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={designParams.borderRadius}
                onChange={(e) => setDesignParams({ ...designParams, borderRadius: parseInt(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

          </div>

          {/* Bloque de Código Generado */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 font-bold">Código CSS Generado:</span>
              <button
                onClick={handleCopyCSS}
                className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar CSS'}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/90 p-4 rounded-xl overflow-x-auto border border-slate-800/80">
              {generateCSSCode()}
            </pre>
          </div>
        </div>
      )}

      {/* MAQUETA EXHAUSTIVA DE COMPONENTES UI (SHOWCASE) */}
      <div className="space-y-8">
        
        {/* SECCIÓN 1: KPI STATS CARDS */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
            <Layout className="w-4 h-4" /> 1. Tarjetas Métricas & Estadísticas KPI
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card Standard White / Glass */}
            <div className="glass-card p-6 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Postulaciones</span>
                <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">42 Festivales</div>
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                ↑ 12% incremento semestral
              </div>
            </div>

            {/* Card Financial KPI */}
            <div className="glass-card p-6 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Inversión Inscripciones</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">$1,450.00 USD</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                32 pagos realizados
              </div>
            </div>

            {/* Card Selection Rate */}
            <div className="glass-card p-6 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Efectividad / Tasa</span>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">28.5%</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                12 Selecciones Oficiales
              </div>
            </div>

          </div>
        </div>

        {/* SECCIÓN 2: FICHA DE FESTIVAL COMPLETA */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> 2. Ficha Completa de Festival (Convocatoria)
          </h2>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/80 text-pink-600 dark:text-pink-400 flex items-center justify-center font-black text-lg shadow-sm">
                  MDP
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                    Festival Internacional de Cine de Mar del Plata
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Argentina</span> • <span className="font-bold text-pink-500">Clase A FIAPF</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black px-3 py-1.5 rounded-full border border-emerald-500/20">
                  Selección Oficial
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                  FilmFreeway
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Cierre Early</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">15 de Mayo, 2026</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Notificación</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">10 de Septiembre, 2026</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Costo Fee</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">$25.00 USD</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Sección</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">Competencia Latinoamericana</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: FORMULARIOS, INPUTS Y BOTONES */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
            <Tag className="w-4 h-4" /> 3. Controles de Formulario, Inputs y Botones
          </h2>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Campo de Texto Estándar</label>
                <input
                  type="text"
                  defaultValue="Festival de Cannes - Quinzaine des Cinéastes"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Menú Desplegable (Select)</label>
                <select className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>Seleccionado</option>
                  <option>En Revisión</option>
                  <option>No Seleccionado</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">Variaciones de Botones</label>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-pink-500/20 hover:opacity-90 transition-all cursor-pointer">
                    Boton Principal
                  </button>
                  <button className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer">
                    Secundario
                  </button>
                  <button className="px-4 py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer">
                    Acción de Riesgo
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Ejemplo de Alerta Informativa del sistema.</span>
              </div>
            </div>

          </div>
        </div>

        {/* SECCIÓN 4: TABLA DE DATOS */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" /> 4. Tabla de Datos & Listas
          </h2>

          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3">Festival</th>
                  <th className="px-4 py-3">País</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Sundance Film Festival</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">EE.UU.</td>
                  <td className="px-4 py-3"><span className="text-amber-600 dark:text-amber-400 font-bold">En Revisión</span></td>
                  <td className="px-4 py-3 text-right font-mono font-bold">$65 USD</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">BFI London Film Festival</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">Reino Unido</td>
                  <td className="px-4 py-3"><span className="text-emerald-600 dark:text-emerald-400 font-bold">Seleccionado</span></td>
                  <td className="px-4 py-3 text-right font-mono font-bold">$40 USD</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
