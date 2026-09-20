# Festis - Plataforma de Gestión de Festivales y Distribución Audiovisual

**Versión:** `10.sep.2026-a`

Festis es una plataforma web para la gestión integral de rutas de distribución audiovisual, seguimiento de postulaciones a festivales de cine, control de presupuestos y agenda de convocatorias.

---

## 🎯 Características Principales

### 🎬 Gestión de Festivales y Convocatorias
- **Trazabilidad de Estados:** Control del ciclo de vida completo (Por Enviar, En Revisión, Seleccionado, Ganado, No Seleccionado, Descalificado, Proyectado, Cerrado, En Duda, Próximamente).
- **Línea de Tiempo y Cadena de Ediciones:** Historial auditable de cambios de estado, notas de jurado y vinculación entre ediciones anuales del mismo festival.
- **Detalle Integrado:** Inspección individual con requerimientos técnicos, tareas pendientes, costos específicos y recordatorios vinculados.
- **Generador de Laureles:** Creación y exportación de laureles vectoriales personalizados para selecciones y premios.

### 📊 Finanzas, Análisis de Retorno y Gastos
- **Métricas de Rendimiento:** Tasa de selección, costo por selección y ROI de la ruta de distribución.
- **Auditoría de Inversión (ROI Audit):** Desglose detallado de fees invertidos en USD, porcentaje de participación en el presupuesto y filtrado automático de inscripciones sin desembolso real.
- **Módulo de Ventas y Gastos Operativos:** Registro de ingresos por distribución y gastos de envío, subtitulado y copias.

### ⏰ Recordatorios y Agenda
- **Recordatorios Vinculados:** Creación y seguimiento de alertas asociadas a festivales específicos o generales.
- **Agenda del Día:** Vista rápida en dashboard con recordatorios, fechas de cierre de inscripción y aniversarios/cumpleaños del equipo.
- **Integración con Calendario:** Visualización mensual interactiva de convocatorias y eventos.

### 📑 Reportes y Exportación
- **Exportación de Datos:** Descarga de reportes estructurados en Excel (XLSX) y respaldos completos en JSON / ZIP.
- **Reportes IA:** Generador de prompts configurables para análisis analítico de la ruta de distribución en modelos LLM.
- **Restauración y Validación:** Asistente de validación e importación con detección previa de módulos y registros.

---

## 🛠️ Tecnologías

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Motion.
- **Backend / Servidor:** Node.js, Express, tsx, esbuild.
- **Persistencia y Sync:** Firebase Firestore & Auth, LocalStorage / Backup JSON.
- **Reportes & Gráficos:** Recharts, XLSX.

---

## 🚀 Comandos Principales

```bash
# Desarrollo
npm run dev

# Compilación de producción
npm run build

# Iniciar servidor compilado
npm start

# Validación de tipos / Linting
npm run lint
```

---

## 📁 Documentación Técnica (`/docs`)

Toda la documentación detallada del proyecto se encuentra estructurada en la carpeta `/docs`:

- [`/docs/COMPONENTS_MAIN_VIEWS.md`](./docs/COMPONENTS_MAIN_VIEWS.md): Especificación técnica de vistas y componentes React.
- [`/docs/SALES_EXPENSES_FINANCE.md`](./docs/SALES_EXPENSES_FINANCE.md): Arquitectura financiera, lógica de ROI y auditoría de gastos.
- [`/docs/TECHNICAL_SYSTEM_SPECIFICATION.md`](./docs/TECHNICAL_SYSTEM_SPECIFICATION.md): Estructura de tipos, Firestore y persistencia.
