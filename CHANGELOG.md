# Registro de Cambios (Changelog)

Todos los cambios notables realizados en este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased] - 2026-07-30

### Añadido
- **Fechas de Cambio de Estado con Selección Retroactiva:** Modal `ChangeStatusModal` incluye selector `datetime-local` para especificar manualmente la fecha/hora en que ocurrió un cambio de estado.
- **Navegación Histórica e Inteligente (`previousView`):** El botón de retroceso en los detalles de un festival redirecciona dinámicamente a la vista de origen (Estadísticas, Calendario, Tareas, Dashboard, etc.) en lugar de forzar siempre la lista general.
- **Detalles Específicos por Estado en Estadísticas:** Ajuste de información relevante (cierre, noticias, proyección, premios, causas) dentro del modal de desglose temporal.
- **Documentación Técnica Profesional:** Estructuración de repositorio con `README.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_AND_INTEGRATIONS.md`, `TESTING_AND_DEPLOYMENT.md` y `CONTRIBUTING.md`.

### Modificado
- **Buscador y Resaltado (Highlighter):** Restauración del resaltador de coincidencias en color amarillo flúor (`bg-yellow-300`).
- **Filtro de Búsqueda Fuzziness:** Ajuste en `searchFestivals` para exigir coincidencia total de tokens eliminando falsos positivos al completar palabras.
