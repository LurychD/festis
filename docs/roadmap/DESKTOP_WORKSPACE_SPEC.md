# ESPECIFICACIÓN TÉCNICA Y ARQUITECTÓNICA: WORKSPACE DE ESCRITORIO MODULAR (RFC)
**Estado:** EN COLA / BACKLOG EXCLUSIVO (RFC)  
**Destino:** Repositorio Festis  
**Autor:** Mesa de Ingeniería de Software (Cuarteto Técnico)  
**Supervisión:** Director Axel  
**Fecha de Emisión:** 14 de Octubre de 2026  

---

## 1. RESUMEN EJECUTIVO Y OBJETIVO
El presente documento define la especificación técnica para la futura implementación del **Workspace de Escritorio Modular** de Festis para pantallas panorámicas y de escritorio (resoluciones widescreen 16:9 y ultrawide 21:9, breakpoint `lg:` / `>= 1024px`).

El objetivo principal es proveer un entorno de alta productividad para distribuidores, productores y cineastas que gestionan circuitos de festivales de gran escala, permitiendo visualización multi-panel, orquestación master-detail en tiempo real y flujos de trabajo segmentados por roles de negocio (Postulación, Estrategia, Auditoría).

---

## 2. INVARIANTE ARQUITECTÓNICA DE COMPATIBILIDAD (MOBILE & TABLET FIRST)

### 2.1 Preservación Estricta de Mobile y Tablet (< 1024px)
La arquitectura existente para dispositivos móviles y tablets (< 1024px) constituye un **invariante absoluto del sistema**:
- **Cero regresión:** El `AppHeader` flotante, la barra de navegación inferior (`BottomBar`), la navegación basada en pila (stack navigation), el alcance ergonómico del pulgar y el menú contextual inferior se mantienen 100% inalterados.
- **Sin desmontaje ni parches móviles:** Prohibido refactorizar o alterar la lógica móvil para "acomodar" el layout de escritorio.
- **Renderizado condicional estricto:** El workspace modular de escritorio se montará de forma exclusiva bajo renderizado condicional a nivel de breakpoint en React (ej. un `useMediaQuery('(min-width: 1024px)')` o alternancia limpia en componente envoltorio), evitando sobrecargar el DOM de dispositivos táctiles con componentes o listeners innecesarios.

```tsx
// Patrón de montaje condicional arquitectónico
export const WorkspaceRouter: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!isDesktop) {
    // Layout móvil/tablet intacto actual: AppHeader + View + BottomBar
    return <MobileAppLayout />;
  }

  // Workspace Modular de Escritorio (>= 1024px)
  return <DesktopWorkspaceLayout />;
};
```

---

## 3. SISTEMA DE DISEÑO Y TOKENS VISUALES (FESTIS DNA)

El workspace de escritorio no adopta estéticas grises corporativas genéricas ni patrones de software contable opaco. Extiende con fidelidad el ADN visual luminoso, limpio y cinematográfico de Festis:

| Token Visual | Definición Técnica | Implementación Tailwind CSS |
| :--- | :--- | :--- |
| **Fondo Ambiental** | Superficie continua pastel con gradiente luminoso continuo | `bg-gradient-to-br from-sky-100/60 via-slate-50 to-purple-100/40` |
| **Tratamiento de Paneles** | Superficies glassmorphic traslúcidas | `bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-sm` |
| **Radio de Contenedores** | Curvatura de paneles principales | `rounded-3xl` |
| **Radio de Submódulos** | Curvatura de tarjetas, modales y botones | `rounded-2xl` |
| **Color de Acento** | Magenta Festis de alta energía | `#e91e63` (`bg-[#e91e63]`, `text-[#e91e63]`, `border-[#e91e63]`) |
| **Tipografía de Jerarquía** | Titulares en alta legibilidad | `text-slate-900 font-bold tracking-tight` |
| **Metadatos y Etiquetas** | Textos secundarios sobrios | `text-slate-500 font-medium text-xs` |
| **Iconografía** | Sistema unificado SVG (Lucide React) | Cero emojis. Trazos coherentes en 1.75px. |

---

## 4. DISTRIBUCIÓN ESPACIAL DE 3 ÁREAS (WIDESCREEN 16:9 / 21:9)

El layout de escritorio se estructura en una cuadrícula fija con distribución modular desacoplada:

```
+------------------------------------------------------------------------------------------------------+
| [Rail 56px] | Cabecera Única Consolidada (Altura: 64px)                                              |
|             | [Película Activa]           | [Estrategia | Postulación | Auditoría] | [⌘K | Sync | Usr] |
|-------------+----------------------------------------------------------------------+-----------------|
| Logo Festis | ÁREA CENTRAL DE TRABAJO (react-resizable-panels)                     | PANEL DERECHO   |
|             |                                                                      | (INSPECTOR)     |
| [Inicio]    | +------------------------------------------------------------------+ | Ancho: 320-360px|
| [Películas] | | Sub-panel Superior (Default: 60% de altura)                      | |                 |
| [Festivales]| | Catálogo / Filtros / Grilla / Lista                              | | Cabecera:     |
| [Envíos]    | | (Componente principal del Workspace activo)                      | | "Inspector"   |
| [Calendario]| +==================================================================+ | [Fijar] [►]     |
|             | | Divisor de arrastre vertical (Resize Handle)                     | |                 |
|             | +------------------------------------------------------------------+ | Pestañas:       |
|             | | Sub-panel Inferior (Default: 40% de altura)                      | | Ficha / Docs  |
|             | | Timeline / Gantt / Deadlines / Planificación                     | | Actividad     |
|             | | (Componente secundario del Workspace activo)                     | |                 |
| [Config]    | +------------------------------------------------------------------+ | Checklist / CTA |
| [Ayuda]     |                                                                      | [Ir a Web]      |
| [v1.x.x]    |                                                                      |                 |
+------------------------------------------------------------------------------------------------------+
```

### A. Rail Lateral Izquierdo (Navegación Fija)
- **Dimensiones:** Ancho fijo de 56px a 64px, altura `h-screen`, fijo al borde izquierdo (`fixed inset-y-0 left-0`).
- **Composición Vertical:**
  - *Extremo superior:* Logotipo e isotipo de Festis.
  - *Bloque central:* Accesos directos a vistas principales mediante botones en pastilla (`w-10 h-10 rounded-2xl`):
    - Inicio (`<DashboardView />`)
    - Películas (`<ProjectsHomeView />`)
    - Festivales (`<FestivalListView />`)
    - Calendario (`<CalendarView />`)
    - Tareas (`<TasksView />`)
  - *Extremo inferior:* Botón de Configuración (`<ConfigView />`), Ayuda y número de versión/build del cliente.
- **Estados Interactivos:**
  - Activo: `bg-pink-50 text-[#e91e63] border border-pink-200/60 shadow-sm`.
  - Inactivo: `text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors`.

### B. Cabecera Única Consolidada
- **Dimensiones:** Altura de 64px (`h-16`), ancho `flex-1`, superficie `bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-20`.
- **Estructura en 3 Secciones:**
  1. **Izquierda:** Selector de obra cinematográfica activa con cápsula informativa de metraje y formato:
     - Etiqueta: `"[Título de Obra] · Cortometraje · 18 min"`, estilo cápsula (`px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700`).
  2. **Centro:** Selector de Presets de Workspace en pastilla segmentada:
     - Opciones: `[Estrategia]`, `[Postulación]`, `[Auditoría]`.
     - Pestaña activa: `bg-[#e91e63] text-white rounded-full shadow-sm px-4 py-1.5 text-xs font-bold transition-all`.
     - Pestañas inactivas: `text-slate-600 hover:text-slate-900 px-4 py-1.5 text-xs font-medium transition-colors`.
  3. **Derecha:** Herramientas globales:
     - Disparador de Omnibox universal (`⌘K`).
     - Indicador de estado de sincronización en la nube (Firestore Cloud Sync).
     - Menú de perfil y avatar de usuario autenticado.

### C. Área Central de Trabajo (Split Vertical Dinámico)
- **Tecnología:** Implementación mediante `react-resizable-panels` (`PanelGroup direction="vertical"`).
- **Sub-panel Superior (60% default):**
  - Barra de herramientas con filtros reactivos: búsqueda por texto, selector de países, selector de categorías, conmutador de vista grilla/lista.
  - Renderizado de tarjetas con bordes `rounded-2xl`.
- **Sub-panel Inferior (40% default):**
  - Selector de modo en cabecera: Pastilla conmutadora `[ Calendario | Gantt ]`.
    - **Modo 'Calendario':** Renderiza la grilla mensual clásica de 7 días (`<CalendarView />`) para el control puntual de fechas de cierre y notificaciones.
    - **Modo 'Gantt':** Renderiza la línea de tiempo horizontal multimes con pistas continuas de deadlines escalonados (*Early*, *Regular*, *Late*).
    - **Persistencia:** Almacenamiento reactivo del modo seleccionado en `localStorage` (clave `festis_subpanel_mode: 'calendar' | 'gantt'`).
- **Divisor de Redimensión (Resize Handle):**
  - Barra sutil de 6px con línea central y micro-manija de arrastre táctil con cursor `row-resize`.
- **Cabecera de Control en Cada Sub-panel:**
  - Tirador de arrastre (`GripVertical`), título formal de la sección, selector de modo contextual (en sub-panel inferior), botón de minimizar (`[_]`), botón de maximizar a pantalla completa (`[↗]`) y menú de opciones (`[...]`).

### D. Panel Derecho: Inspector Contextual
- **Dimensiones:** Ancho estándar calibrado entre 320px y 360px; colapsable dinámicamente a `0px` mediante botón de colapso rápido (`[►]`).
- **Encabezado:** Título sobrio *"Inspector"*, botón de fijado (pinning) y gatillo de cierre.
- **Pestañas Internas de Inspección:**
  - **Ficha:** Datos condensados de la entidad seleccionada.
  - **Documentos:** Enlaces a bases, reglamentos, cartas de aceptación y acuerdos.
  - **Actividad:** Historial de cambios, fechas de postulación y notas de seguimiento.
- **Módulos Fijos Inferiores:**
  - Bloque de Checklist de postulación (ej. *"2/4 requisitos completados"* con barra de progreso).
  - Notas internas rápidas.
  - Botón de acción principal fijo en el pie del inspector: *"Ir a web oficial"* (`bg-[#e91e63] text-white font-bold rounded-2xl py-3 w-full shadow-md shadow-pink-500/20`).
- **Regla de Compacidad Estricta:**
  - Todos los componentes renderizados dentro del Inspector deben soportar el modificador `variant="inspector"` o implementarse mediante submódulos compactos desacoplados, prohibiendo layouts horizontales o elementos con `min-w` excesivo.

---

## 5. COMUNICACIÓN Y ESTADO MASTER-DETAIL DESACOPLADO

Para garantizar máxima fluidez y evitar parpadeos o desmontajes innecesarios del área central:
1. **Sincronización por Estado Compartido / URL Param:**
   - La selección de un festival en `<FestivalListView />` o en el `<CalendarView />` actualiza el ID seleccionado en un store ligero (`useWorkspaceStore.setState({ selectedFestivalId })`) y/o en el query param (`?selected=ID`).
2. **Cero Salto de Ruta Destructivo:**
   - Prohibido disparar `setView('details')` que reemplace todo el layout central en escritorio.
   - El Inspector derecho detecta la mutación del ID y actualiza su contenido de forma reactiva manteniendo el foco, scroll y estado de filtros del catálogo central.

---

## 6. MATRIZ DE COMPONENTES POR WORKSPACE PRESET

La conmutación de presets en la cabecera reconfigura de forma limpia la composición de componentes en los tres paneles:

| Preset | Sub-panel Superior (Centro) | Sub-panel Inferior (Centro) | Panel Derecho (Inspector) |
| :--- | :--- | :--- | :--- |
| **[Postulación]** | `<FestivalListView />` (Catálogo de convocatorias y filtros) | Selector `[ Calendario \| Gantt ]`:<br>• **Calendario:** `<CalendarView />` (Grilla mensual de 7 días)<br>• **Gantt:** Timeline horizontal de deadlines escalonados (*Early/Regular/Late*) | `<FestivalDetailsView variant="inspector" />` (Ficha técnica y checklist) |
| **[Estrategia]** | `<DistributionPlansView />` o `<DistributionPlanDetailView />` | `<PlanningView />` (Roadmap estratégico de etapas) | `<FilmDataView variant="inspector" />` (Ficha técnica con tabs a `<GalleryView />` y notas) |
| **[Auditoría]** | `<StatsView />` (Métricas consolidadas y KPIs) | `<ArchiveView />` (Historial de ediciones cerradas) | `<ReportsView variant="inspector" />` (Generador de reportes INCAA y fondos) |
| **Tablero Ejecutivo (Home)** | `<DashboardView />` montado a ancho completo al pulsar "Inicio" en el rail lateral. | *N/A (Pantalla completa)* | *Opcional / Colapsado por defecto* |

---

## 7. REGLAS TÉCNICAS Y MITIGACIÓN DE PUNTOS DE QUIEBRE

1. **Gestión Estricta de Portales (`createPortal`):**
   - Debido a que los sub-paneles y el inspector utilizan `overflow-hidden` para el corte de redimensionado, **todo modal, menú desplegable flotante, tooltip y datepicker debe renderizarse obligatoriamente sobre `document.body` vía `createPortal`**. De lo contrario, los menús quedarán truncados por los bordes del panel contenedor.
2. **Contención de Altura y Scroll Independiente:**
   - Todo panel secundario y el Inspector deben estructurarse con `flex flex-col flex-1 min-h-0`.
   - El scroll vertical debe residir exclusivamente en el contenedor interno (`overflow-y-auto overflow-x-hidden`), erradicando el bug de crecimiento infinito de altura en contenedores flex.
3. **Persistencia de Configuración de Usuario:**
   - Los anchos del inspector, los porcentajes del split vertical y el estado colapsado deben almacenarse en `localStorage` mediante la propiedad `autoSaveId` de `react-resizable-panels` (ej. `festis-workspace-panels-v1`).
4. **Respeto a la Política Multimedia en Cliente:**
   - Todo renderizado de imágenes dentro del Inspector o catálogo utilizará WebP comprimido localmente, respetando las cuotas de red y las reglas de seguridad multi-tenant basadas en Firestore UID.

---

## 8. PLAN DE TRANSICIÓN Y DEUDA TÉCNICA ASOCIADA

Cuando el Director Axel ordene pasar este RFC de estado **EN COLA** a **FASE DE EJECUCIÓN**, se abordarán las siguientes tareas en fases independientes:
1. Instalación controlada de la dependencia `react-resizable-panels`.
2. Extracción y desacople de las variantes compactas (`variant="inspector"`) en `FestivalDetailsView`, `FilmDataView` y `ReportsView`.
3. Implementación del store liviano `useWorkspaceStore` para sincronización master-detail.
4. Creación del layout condicional `DesktopWorkspaceLayout.tsx` sin tocar los componentes móviles.
5. Cobertura estricta de tests en Vitest / React Testing Library bajo `happy-dom` simulando cambios de viewport y persistencia de paneles.
