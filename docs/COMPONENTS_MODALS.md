# Modales, Drawers y Gestos Móviles — Guía Detallada de Componentes

Este documento especifica la arquitectura de modales, drawers y la orquestación de micro-interacciones táctiles en `src/components/` y `src/hooks/`.

---

## 1. Estandarización de Modales con Framer Motion (AnimatePresence)

Todos los modales y diálogos globales del sistema están encapsulados bajo `AnimatePresence` de `motion/react` para garantizar ciclos de vida fluidos tanto en apertura como en cierre:

- **Backdrop Difuminado Sincronizado:** Cada modal proyecta un fondo con `bg-slate-900/60` (o color de acento) y `backdrop-blur-md`, con transición de desvanecimiento `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}`.
- **Transición de Escala y Elevación Elástica:** La superficie de la tarjeta modal entra suavemente con `initial={{ opacity: 0, scale: 0.94, y: 10 }}`, `animate={{ opacity: 1, scale: 1, y: 0 }}` y `exit={{ opacity: 0, scale: 0.94, y: 10 }}` con una curva Bézier elástica `[0.16, 1, 0.3, 1]`, erradicando cualquier desaparición abrupta o parpadeo.
- **Disciplina de Cero Texto de Relleno:** Se suprimen bajadas descriptivas o subtítulos obvios debajo de los títulos de cada modal, manteniendo una estética sobria y cinematográfica.

---

## 2. Directiva de Ergonomía Móvil y Gestos Táctiles (useDrawerSwipeGesture.ts)

Ubicación: `src/hooks/useDrawerSwipeGesture.ts`  
Aplicado en: `src/components/ProjectsHomeView.tsx` y `src/App.tsx` (Drawer de la Obra Activa).

### Parámetros de Operación Táctil:
1. **Apertura Ergonómica con el Pulgar Derecho:**
   - **Zona de Activación Estricta:** Se escucha exclusivamente en la mitad inferior de la pantalla (`clientY > window.innerHeight / 2`) y en proximidad al margen derecho (`clientX > window.innerWidth - 65`). Esto previene activaciones involuntarias al interactuar con el encabezado superior o la barra de búsqueda.
   - **Discriminación de Trayectoria:** Para evitar interferencias con el desplazamiento vertical (scroll de página), se exige que el componente horizontal supere al vertical (`|deltaX| > |deltaY|`) y que el recorrido hacia la izquierda sea contundente (`deltaX < -50px`) en un intervalo de tiempo menor a 650 ms.
   - **Exclusión de Campos Interactivos:** No se inicia el seguimiento del gesto si el toque inicial se produce sobre elementos de formulario (`<input>`, `<textarea>`, `<select>`).
2. **Gesto y Arrastre de Cierre (Swipe / Drag to Right):**
   - Cuando el drawer está desplegado, el usuario puede deslizarlo hacia la derecha (`deltaX > 45px` y `|deltaX| > |deltaY|`) o arrastrarlo físicamente mediante las utilidades `drag="x"` de Framer Motion con límites elásticos para replegarlo de forma natural.

---

## 3. Catálogo de Modales del Sistema

### ProjectModal.tsx
- Ubicación: `src/components/ProjectModal.tsx`
- Categoría: Creación y Edición de Obras Audiovisuales
- Funcionalidad: Captura título, formato de resolución, tasa de fotogramas (FPS), póster/ícono con compresión cliente WebP y paleta cromática personalizada.

### ReminderModal.tsx
- Ubicación: `src/components/ReminderModal.tsx`
- Categoría: Programador de Recordatorios y Notificaciones
- Funcionalidad: Permite agendar tareas vinculadas a festivales o eventos generales con fecha y hora precisa.

### CountdownModal.tsx
- Ubicación: `src/components/CountdownModal.tsx`
- Categoría: Temporizador Regresivo de Plazos de Distribución
- Funcionalidad: Muestra el tiempo restante (días, horas, minutos y segundos) para la resolución de un plan de distribución cinematográfico.

### ChangeStatusModal.tsx
- Ubicación: `src/components/ChangeStatusModal.tsx`
- Categoría: Registro Auditable de Estado
- Funcionalidad: Registra transiciones de veredicto con trazabilidad temporal y notas de postulación.

### LogoutConfirmModal.tsx
- Ubicación: `src/components/LogoutConfirmModal.tsx`
- Categoría: Confirmación de Cierre de Sesión Seguro
- Funcionalidad: Bloqueo de seguridad con cuenta regresiva de 5 segundos para prevenir desconexiones accidentales.

### FestivalModal.tsx
- Ubicación: `src/components/FestivalModal.tsx`
- Categoría: Gestión Integral de Postulaciones
- Funcionalidad: Formulario de altas y ediciones de festivales con autocompletado geográfico y panel de pruebas.

### OmniboxModal.tsx
- Ubicación: `src/components/OmniboxModal.tsx`
- Categoría: Paleta de Comandos y Búsqueda Rápida
- Funcionalidad: Acceso por teclado (`Cmd + K`) a todas las secciones y registros de la aplicación.
