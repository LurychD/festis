# Módulo de Tareas Kanban y Logística Operativa de Distribución — Guía Técnica

Este documento especifica la arquitectura del tablero Kanban, el flujo de tareas pre-postulación, el control de entregables técnicos (DCP, ProRes, Subtítulos) y el seguimiento operativo en **Festis Cardigan**.

---

## 📋 1. Visión General de la Logística de Distribución

Una vez que una película es postulada o seleccionada en un festival, comienza un riguroso proceso de logística técnica que incluye la verificación del máster de exhibición en formato DCP (Digital Cinema Package), la traducción de subtítulos a múltiples idiomas (español, inglés, francés, alemán, italiano), la emisión de autorizaciones de derechos de música y el envío postal de materiales físicos o cargas electrónicas vía Aspera/Signiant.

El módulo **Kanban Operativo** permite coordinar a los productores ejecutivos, coordinadores de postproducción y agentes de ventas en un tablero visual en tiempo real.

---

## 🗂️ 2. Modelo de Datos de Tareas (`FestivalTask`)

Ubicación de Interfaces: `src/types.ts`

```typescript
export interface FestivalTask {
  id: string;
  festivalId?: string;       // ID del festival asociado (opcional)
  title: string;             // Título de la tarea
  description?: string;      // Detalle operativo
  status: 'todo' | 'in_progress' | 'review' | 'done'; // Estado en el tablero
  priority: 'low' | 'medium' | 'high' | 'urgent';     // Nivel de urgencia
  assignedTo?: string;       // Nombre o correo del miembro del equipo responsable
  dueDate?: string;          // Fecha límite de cumplimiento (YYYY-MM-DD)
  category: 'dcp' | 'subtitles' | 'presskit' | 'shipping' | 'legal' | 'payment';
  completed: boolean;
  createdAt: string;
}
```

---

## 📐 3. Componente y Estado del Tablero (`KanbanView.tsx`)

Ubicación del Archivo: `src/components/KanbanView.tsx`

El tablero Kanban organiza las tareas en 4 columnas dinámicas con soporte para arrastrar y soltar (*Drag and Drop*):

```
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
 │   POR HACER      │  │  EN PROCESO      │  │   EN REVISIÓN    │  │   COMPLETADO     │
 │    (To-Do)       │  │  (In Progress)   │  │    (Review)      │  │     (Done)       │
 ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
 │ - Probar DCP     │  │ - Traducir Subt  │  │ - Revisar Stills │  │ - Pagar Fee $50  │
 │ - Subir Trailer  │  │   Inglés         │  │   300 DPI        │  │   FilmFreeway    │
 └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Características del Tablero:

1. **Filtro por Festival:** Permite aislar únicamente las tareas relacionadas con un festival en particular (ej. "Festival de Cannes 2026").
2. **Filtro por Categoría Operativa:**
   - 📽️ **DCP & Másteres:** Verificación de archivos KDM, subtítulos incrustados y suma de verificación MD5.
   - 💬 **Subtítulos:** Gestión de archivos de subtítulos `.srt`, `.vtt` y `.xml` (Timetext).
   - 📰 **Press Kit:** Redacción de ficha técnica y compendio de prensa.
   - 📦 **Envíos & Logística:** Código de seguimiento de envíos DHL/FedEx o enlaces Aspera.
   - ⚖️ **Legales & Música:** Licencias de sincronización musical y cartas de cesión de derechos.
   - 💳 **Pagos & Inscripciones:** Comprobantes de pago de fees de postulación.
3. **Indicador de Tareas Vencidas:** Resalta automáticamente en rojo aquellas tareas con fecha límite superada que aún no han pasado a la columna "Completado".

---

## 🔄 4. Flujo Operativo Estándar de Postulación

El ciclo de vida operativo de una postulación en Festis Cardigan sigue una secuencia rigurosa:

```
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │    BORRADOR     │ ────> │  EN EVALUACIÓN  │ ────> │   SELECCIONADO  │
  │ (Draft Checklist│       │(Pagar Fee / PDF)│       │ (Confirmar DCP) │
  └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                               │
                                                               ▼
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │   EN PROYECCIÓN │ <──── │ DCP ENTREGADO   │ <──── │ SUBTÍTULOS EN  │
  │  (Prensa / Kit) │       │ (KDM Verificado)│       │  IDIOMA LOCAL   │
  └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 📊 5. Métricas de Desempeño Operativo

Dentro de la vista de informes y cuadro de mando (`DashboardView.tsx`), las métricas de tareas permiten medir la productividad de la distribuidora:
- **Tasa de Cumplimiento de Entregables (%):** Porcentaje de tareas completadas antes de la fecha límite del festival.
- **Cuello de Botella Operativo:** Identifica en qué columna (ej. "En Revisión") se acumulan mayor cantidad de pendientes.
- **Asignación de Carga de Trabajo:** Gráfico con distribución de tareas por miembro del equipo de distribución.
