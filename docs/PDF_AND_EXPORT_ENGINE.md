# Arquitectura del Motor de Informes y Exportaciones PDF/Excel — Guía Técnica

Este documento especifica el funcionamiento interno, las librerías cliente y los algoritmos de formateo utilizados por la suite de exportación de **Festis Cardigan** (`src/utils/`).

---

## 🛠️ 1. Módulos y Librerías del Ecosistema de Exportación

El sistema utiliza procesamiento 100% en el lado del cliente (Client-Side Rendering) mediante las siguientes librerías de alto rendimiento:

- **`jsPDF` (`^4.2.1`):** Motor de maquetación vectorial de documentos PDF, control de coordenadas `(x, y)`, paginado y tipografías.
- **`html2canvas` (`^1.4.1`):** Rasterizador de nodos DOM HTML/CSS a lienzos HTML5 Canvas para la inclusión de gráficos Recharts/D3 en reportes.
- **`XLSX` (`xlsx ^0.18.5`):** Generador de libros de trabajo Microsoft Excel (`.xlsx`) y archivos de valores separados por comas (`.csv`).

---

## 📑 2. Especificación de los Generadores de PDF (`src/utils/`)

### A. Dossier General de Distribución (`pdfExport.ts`)
Genera el informe principal de postulación de festivales.
- **Formato:** Documento A4 Vertical (210mm x 297mm).
- **Estructura Visual:** 
  1. Portada Institucional con logo de la distribuidora y título del largometraje/cortometraje.
  2. Resumen Ejecutivo con totales de postulación, presupuestos invertidos y tasa de selección.
  3. Tabla foliada con desglose por festival, país, plataforma, fecha de cierre, fecha de respuesta y costo en Moneda Original / USD.
- **Paginado Dinámico:** Calcula la altura de cada fila y crea páginas nuevas automáticamente antes de que el contenido colisione con el margen inferior (280mm).

### B. Reporte Inteligente Ejecutivo con Gráficos (`intelligentReportPDF.ts`)
Combina texto estructurado y gráficos vectoriales/rasterizados.
- **Procesamiento de Gráficos:** Captura los contenedores HTML de `AdvancedCharts.tsx` mediante `html2canvas`, convierte el resultado a imágenes PNG en Data URL Base64 y los incrusta en el documento PDF manteniendo la relación de aspecto original.
- **Resumen IA:** Incluye el análisis generado por el asistente de inteligencia artificial sobre el estado de la distribución.

### C. Certificados y Laureles de Selección (`laurelsPdfExport.ts`)
Permite generar hojas impresas y vectores de hojas de laurel decorativas para películas seleccionadas o premiadas en festivales Clase A.

### D. Proyecciones Financieras y Retorno de Inversión (`projectionsPdfExport.ts`)
Especializado en el análisis económico del plan de distribución.
- Muestra gráficos comparativos de presupuestos proyectados vs. gastos reales en inscripción y copias.
- Calcula el ROI (Return on Investment) en función de premios en efectivo otorgados por festivales.

### E. Informe Técnico de Película y Ficha de Distribución (`filmDataPdfExport.ts`)
Genera la hoja técnica oficial requerida por mercados cinematográficos (Ventana Sur, Marché du Film, Berlinale Co-Production Market).
- Incluye título original, título internacional, director, productor, año de producción, formato de rodaje, formato de exhibición (DCP), sinopsis corta, sinopsis larga y especificaciones de subtítulos.

### F. Informe de Auditoría y Logs del Sistema (`auditPdfExport.ts`)
Exporta el historial inmutable de acciones de usuarios, cambios de estado en festivales y registros de seguridad para auditorías internas.

### G. Análisis Estadístico y Cobertura Geográfica (`statsPdfExport.ts`)
Renderiza el desglose analítico de presencia internacional por continentes, mapas de calor y tasas de conversión del catálogo.

### H. Plan de Distribución y Presentación Institucional (`distributionPlanPdfExport.ts`)
Genera el informe formal para organismos reguladores, academias e instituciones evaluadoras (como ENERC e INCAA), así como minutas de trabajo para uso interno del equipo.
- **Formato y Aspect Ratio:** Documento A4 u Oficio foliado con membrete oficial del cortometraje "Cardigan". El logo de la cabecera preserva matemáticamente su relación de aspecto original (`naturalWidth / naturalHeight`), eliminando distorsiones o aplastamientos horizontales.
- **Selector de Destinatario Dual:**
  1. *Reporte Oficial (Institución Reguladora):* Banner limpio con Organismo regulador, Presupuesto, Fecha de emisión, Emitido por y Cantidad total (`# festivales propuestos`, sin discriminar borradores ni procedencias). Nómina con columnas `#`, `Nombre festival`, `País`, `Cierre` en formato estricto `DD/MM/AA`, `Costo`, `Link de inscripción` y `Observaciones`. Omite etiquetas de borrador y estados de postulación internos.
  2. *Minuta de Trabajo (Uso Interno):* Banner analítico con desglose de borradores vs. catálogo oficial. Nómina con badges de procedencia `[BORRADOR DE PLAN]` / `[CATÁLOGO OFICIAL]` y estado de postulación (`FestivalStatus`).
- **Filas Dinámicas Multilínea en Tablas:** El motor calcula la cantidad de renglones necesarios para cada celda (`name`, `country`, `costo`, `link`, `observations`) mediante `splitTextToSize` ajustado al ancho de cada columna. La fila crece verticalmente de forma matemática (`rowHeight = maxLines * lineStep + padding`) eliminando desbordes o textos truncados con puntos suspensivos. Integra saltos de página preventivos automáticos (`checkPageBreak(rowHeight + 2)`).
- **Selector Opcional de Columna Observaciones:** En el modal de exportación, el usuario puede tildar o destildar el renderizado de la columna `Observaciones`. Si se desactiva (`includeObservations: false`), el espacio horizontal disponible se redistribuye proporcionalmente entre las columnas principales (Nombre 35%, País 20%, Cierre 11%, Costo 12%, Link ~22%), optimizando la legibilidad cuando las notas individuales no son requeridas.
- **Notas y Observaciones Ad-Hoc:** Campo de notas personalizables por cada emisión de reporte. Si el usuario no escribe notas, la sección no se dibuja en el PDF conservando el espacio. Si incluye notas, se renderiza un bloque estilizado titulado `NOTAS:` con tipografía formal.
- **Trazabilidad y Foliado:** Paginación automática `Página X de Y` y pie de página con sello temporal y firma de emisión.

---

## 📊 3. Motor de Exportación a Excel y CSV (`excelExport.ts`)

Ubicación: `src/utils/excelExport.ts`

```typescript
// Estructura simplificada del flujo de exportación Excel
import * as XLSX from 'xlsx';

export const exportFestivalsToExcel = (festivals: Festival[], fileName = 'Festivales_Cardigan.xlsx') => {
  const dataToExport = festivals.map(f => ({
    'Nombre del Festival': f.name,
    'Ciudad': f.city,
    'País': f.country,
    'Categoría': f.category,
    'Estado': f.status,
    'Fecha Cierre': f.deadline,
    'Costo (USD)': f.feeUsd,
    'Plataforma': f.platform
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Festivales");
  
  XLSX.writeFile(workbook, fileName);
};
```

---

## 🛡️ 4. Validación y Respaldo de Datos (`backupValidator.ts`)

Ubicación: `src/utils/backupValidator.ts`  
Antes de procesar la importación o exportación de un respaldo JSON completo de la base de datos, este validador verifica:

1. **Estructura de Esquema:** Garantiza la presencia de campos obligatorios (`id`, `name`, `status`).
2. **Sanitización contra Inyecciones:** Filtra etiquetas HTML o código malicioso en campos de texto libre.
3. **Control de Versión de Respaldo:** Valida que el archivo JSON importado sea compatible con la versión actual de la base de datos (`version: 2`).
