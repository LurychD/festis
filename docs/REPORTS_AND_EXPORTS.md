# Sistema de Informes, Reportes y Exportaciones de Datos — Guía Técnica

Este documento proporciona la especificación técnica del subsistema de generación de informes, dossieres ejecutivos de distribución para entes de fomento cinematográfico y exportaciones multiformato en **Festis Cardigan**.

---

## 📋 1. Visión General del Subsistema de Informes

El módulo de informes permite transformar el histórico de postulaciones, presupuestos y selecciones en documentos ejecutivos listos para presentación a institutos de cine (INCAA, ICAA, Ibermedia, CNC, etc.), productores ejecutivos y coproductores internacionales.

Los reportes combinan visualizaciones gráficas de rendimiento, tablas desglosadas con foliado oficial, desgloses financieros multidivisa y resumen de presencia internacional.

---

## 🧩 2. Componentes y Módulos Relacionados

Ubicación y Responsabilidades de Código:
`src/components/ReportsView.tsx`: Vista principal de interfaz de usuario para configurar parámetros de informe, seleccionar secciones, previsualizar en vivo e iniciar impresión o descarga. Incluye tarjetas con formato desplegable (drop-down) para el Informe a Detalle, el Resumen de Prompts de IA y la Exportación a Excel.
`src/components/PromptSummaryReportCard.tsx`: Módulo desplegable (drop-down) ubicado al final de la vista para generación de informes estructurados "Resumen para Prompts de IA" en Markdown (.md), Texto Plano (.txt) y PDF (.pdf) optimizados para LLMs (ChatGPT, Gemini, Claude). Incluye detección automática de enlaces, contadores de tokens y opciones de filtrado (sin encabezado estático de nombre de usuario).
`src/components/ExcelExportReportCard.tsx`: Módulo desplegable (drop-down) ubicado al final absoluto de la vista para exportar planillas de datos tabulares en Microsoft Excel (`.xlsx`) y valores separados por comas (`.csv`) mediante la librería `xlsx`. Incluye filtros por rangos temporales, multiselección de estados, personalización de columnas y pestaña opcional de Resumen de KPIs.
`src/utils/pdfExport.ts`: Motor de generación de documentos PDF vectoriales y renderizado visual basado en `jspdf` y `html2canvas`.
`src/utils/excelExport.ts`: Exportador de colecciones de datos tabulares a libros de trabajo Microsoft Excel (`.xlsx`) y archivos de valores separados por comas (`.csv`) mediante la librería `xlsx`.
`src/components/AdvancedCharts.tsx`: Componentes de gráficos (Recharts / D3) incrustados en los reportes impresos.

---

## 📊 3. Tipos de Informes Generables

Informe Ejecutivo de Distribución Cinematográfica / Texto de Trayectoria:
Documento oficial consolidado que reúne la trayectoria completa de postulación de una película. Permite filtrar por Tipo de evento (Festivales 🎬, Premios 🏆, Muestras 🎞️), ordenar cronológicamente por fecha de proyección (`projectionDate`) de más reciente a más antigua (descendente) o de más antigua a más reciente (ascendente), así como conmutar la inclusión de país, fecha/año, categoría y premios/nominaciones. Si un festival no posee categoría o nominación (o contiene valores genéricos como "Ninguna", "N/A" o "-"), dichos campos se omiten automáticamente del texto generado. Incluye sinopsis, ficha técnica, estadísticas de selecciones en festivales Clase A, premios obtenidos y desglose por países o continentes.

Estado Financiero y Rendimiento de Inversión:
Balance económico detallado que contabiliza los costos totales de fee de inscripción, envíos de copias de exhibición, servicios de agencias de distribución y traductores de subtítulos, contrastados contra premios en efectivo recibidos y fee de exhibición pagado por los festivales.

Calendario de Convocatorias y Vencimientos Futuros:
Reporte operativo para equipos de producción que enumera los próximos cierres de inscripciones, fechas estimadas de notificación de jurados y ventanas de estreno para evitar incompatibilidades de premier (World Premiere, International Premiere, National Premiere).

Dossier de Prensa y Kits de Difusión:
Informe sintético orientado a encargados de prensa (Publicists), que resume las proyecciones confirmadas, enlaces a material promocional en Google Drive y métricas de difusión social.

---

## 💾 4. Formatos de Exportación y Especificación Técnica

Formato PDF Vectorial e Impresión Directa:
Genera documentos formateados en tamaño A4 u Carta con diseño de maquetación limpia, paginado automático (Página X de Y), encabezados institucionales y tipografía legible optimizada para impresión o envío por correo electrónico.

Formato Excel (.xlsx) y CSV Tabular:
Exporta la base de datos de postulaciones filtrada en hojas de cálculo estructuradas con columnas estandarizadas (Nombre del Festival, Ciudad, País, Categoría, Estado, Fecha de Postulación, Fecha de Notificación, Costo de Inscripción en Moneda Original y USD).

Respaldo JSON Estructurado:
Permite exportar e importar datos de informes e historial de postulaciones en formato JSON auditado para migraciones o copias de seguridad de emergencia.

---

## ⚙️ 5. Filtros, Personalización y Moneda

Filtros Dinámicos:
Los informes pueden filtrarse por película específica del catálogo de la productora, rango de fechas de convocatoria, plataformas de inscripción (FilmFreeway, Festhome, ShortFilmDepot, Movibeta) y estado actual de la candidatura (Seleccionado, En Competencia, Otorgado, Rechazado, Pendiente).

Configuración de Encabezados y Membrete:
Permite agregar el nombre de la empresa productora, logo corporativo, nombre del proyecto audiovisual y notas aclaratorias para los comités evaluadores de subsidios y premios de fomento.
