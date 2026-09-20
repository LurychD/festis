# DOCUMENTACIÓN TÉCNICA Y FUNCIONAL: INFORME "RESUMEN PARA PROMPTS DE IA"

## 1. DESCRIPCIÓN GENERAL Y PROPÓSITO
El módulo **Resumen para Prompts de IA** (`PromptSummaryReportCard.tsx`) es una herramienta avanzada de generación de reportes estructurados para la plataforma **Festis Cardigan**.
Permite consolidar la información técnica, cronológica y operativa de todos los festivales cargados en la aplicación en un formato optimizado de texto plano o Markdown listo para pegar directamente en modelos de lenguaje grande (LLMs como ChatGPT, Gemini o Claude), o descargar como archivo `.md`, `.txt` o `.pdf`.

---

## 2. ARQUITECTURA Y UBICACIÓN DE CÓDIGO
- **Componente Principal**: `/src/components/PromptSummaryReportCard.tsx`
- **Integración**: Consumido en la parte inferior del grid principal de informes en `/src/components/ReportsView.tsx` como tarjeta desplegable (*drop-down / accordion*).
- **Librerías Clave**:
  - `motion/react`: Animaciones de despliegue/colapso (`AnimatePresence`, `motion.div`) y feedback visual.
  - `date-fns`: Cálculo preciso de diferencias de fechas y rangos.
  - `jspdf`: Generación de documentos PDF monoespaciados de alta legibilidad.
  - `lucide-react`: Iconografía intuitiva (`ChevronDown`, `ChevronUp`, `Sparkles`, etc.).

---

## 3. CARACTERÍSTICAS Y CONFIGURABILIDAD DE PARÁMETROS

### 3.1. Rangos de Análisis Temporal
El informe permite filtrar los festivales a consolidar según su fecha límite (`deadline`), fecha de proyección (`projectionDate`) o fecha de creación mediante las siguientes opciones:
1. **Hoy (1 día)**: Festivales con vencimientos o fechas activas en las últimas 24h.
2. **Semanal (7 días) [POR DEFECTO]**: Muestra las convocatorias vigentes o recientes de la semana.
3. **Mensual (30 días)**: Panorama completo del mes en curso.
4. **60 días**: Planificación bimestral.
5. **90 días**: Planificación trimestral.
6. **Todos los registros**: Histórico global sin restricciones de fecha.
7. **Personalizado**: Selector dual de fechas (`Fecha Desde` y `Fecha Hasta`) o selección dinámica de N días.

### 3.2. Plantillas e Instrucciones de Prompt
Permite seleccionar el estilo del encabezado o preset de instrucción para la IA:
- **Texto Puro (Markdown/Limpio)**: Genera texto estructurado puro sin encabezados conversacionales ni instrucciones adicionales.
- **Estrategia y Vencimientos**: Asigna el rol de Asesor de Distribución Cinematográfica para evaluar prioridades y sugerir recomendaciones.
- **Resumen Ejecutivo**: Asigna el rol de Productor Ejecutivo para consolidar métricas de postulaciones, selecciones y rechazos.
- **Plan de Tareas Pendientes**: Se enfoca en checklist no completados y convocatorias por vencer ordenadas por urgencia.

### 3.3. Checkboxes y Filtros de Contenido
- **Observaciones Técnicas**: Incluye o excluye notas operativas registradas por el usuario.
- **Checklist de Seguimiento**: Muestra tareas pendientes e ítems completados con formato `[x]` / `[ ]`.
- **Enlaces Web e Inscripción**: Sitios oficiales y fichas directas de plataformas (FilmFreeway, ShortFilmDepot, FestHome, etc.).
- **Ediciones Previas Vinculadas**: Incluye trazabilidad de ediciones homólogas de años anteriores.
- **Historial de Estados**: Muestra los cambios cronológicos de estados registradas en el festival.
- **Filtro Multi-Estado**: Permite marcar/desmarcar individualmente estados como `Por Enviar`, `Próximamente`, `En Revisión`, `Seleccionado`, `Ganado`, `No Seleccionado`, etc., con accesos directos de "Todos" o "Solo Pendientes".

---

## 4. ESTIMADOR INTELIGENTE DE TOKENS Y ALERTA DE LONGITUD

El componente evalúa dinámicamente el tamaño del texto generado en tiempo real:
- **Cálculo de Caracteres**: `charCount = text.length`
- **Cálculo Estimado de Tokens**: `Math.round(charCount / 4)`

### Indicadores Visuales y Alertas:
- 🟢 **Óptimo (< 15,000 tokens)**: Indicador verde. Ajuste perfecto para cualquier modelo de IA.
- 🟡 **Moderado (15,000 - 30,000 tokens)**: Indicador azul/cielo. Tamaño adecuado para modelos estándar.
- 🔴 **Advertencia de Longitud Alta (> 30,000 tokens)**: Indicador ámbar con alerta destacada. Despliega un aviso informando que el informe es extenso y podría superar la ventana de contexto de algunas IAs.
  - Ofrece un botón de 1 Clic **"⚡ Auto-Compactar Informe"** que recorta descripciones extensas a 200 caracteres e inhibe detalles menores para mantener el prompt compacto y eficiente.

---

## 5. ACCIONES DE SALIDA Y EXPORTACIÓN
1. **Copiar al Portapapeles (1 Clic)**: Copia el texto completo generado al portapapeles con feedback de éxito e indicador toast.
2. **Descargar .MD**: Genera un archivo `.md` de formato Markdown estructurado.
3. **Descargar .TXT**: Genera un archivo `.txt` de texto plano.
4. **Descargar PDF**: Genera un documento `.pdf` con tipografía monoespaciada estructurada.
