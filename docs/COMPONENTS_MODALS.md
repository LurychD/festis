# Modales e Interacciones Globales — Guía Detallada de Componentes

Este documento especifica los modales de formulario, diálogos auditables de estado, visores geográficos y la paleta de comandos de `src/components/`, estructurados formalmente sin el uso de viñetas.

---

## 🪟 1. FestivalModal.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/FestivalModal.tsx`  
Categoría: Modal de Formulario Principal  

Descripción y Arquitectura Explayada:
FestivalModal es el componente de interfaz encargado de capturar y editar los datos maestros de una postulación. Despliega un formulario enriquecido que incluye campos con validación en tiempo real para evitar la entrada de datos inconsistentes. Permite ingresar el nombre del festival, seleccionar la plataforma de inscripción (FilmFreeway, Shortfilmdepot, Festhome, Movibeta, Envío Directo), definir la categoría de participación, fijar el costo de inscripción (fee) en dólares u otra divisa y establecer las fechas críticas. Integra el subcomponente `PlaceAutocomplete.tsx` conectado a la API de Google Maps Places para autocompletar con precisión la ciudad, provincia y país de la sede del festival.

Módulos Especiales y Detectores Integrados:
1. Autocompletar Inteligente con IA: Esta función de análisis inteligente se muestra condicionada a la activación previa del interruptor de 'Funciones Experimentales' (`experimentalFeatures` en Configuración).
2. Badge Interactivo y Detector de Festival de Prueba ("test") para Desarrolladores: Cuando un usuario con permisos o rol de desarrollador abre el formulario, el placeholder del campo de nombre indica "Escribe test". Al ingresar la palabra "test", aparece automáticamente un Badge interactivo (`🧪 Test Badge (Crear Festi)`). Al presionarlo o intentar guardar el formulario, se activa un modal de confirmación con un temporizador regresivo de 3 segundos para prevenir clics accidentales. Al confirmar, se genera un festival de prueba equipado con la botonera de herramientas de testeo interactivo.

Especificación Técnica de Props:
```typescript
interface FestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (festivalData: Partial<Festival>) => Promise<void>;
  festivalToEdit?: Festival | null;
}
```

Flujo de Control y Validación:
Cuando la propiedad `festivalToEdit` contiene un objeto válido de festival, el modal puebla automáticamente todos los campos del formulario con los valores existentes. Si el usuario intenta guardar una postulación sin completar los campos obligatorios, el modal destaca visualmente los insumos faltantes y bloquea la emisión. Al presionar el botón de guardado, resuelve la promesa `onSave()` sincronizando los datos con Firestore y emitiendo una confirmación toast.

---

## 🔄 2. ChangeStatusModal.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ChangeStatusModal.tsx`  
Categoría: Modal Auditable de Estado  

Descripción y Arquitectura Explayada:
ChangeStatusModal es el componente garante de la trazabilidad del circuito de distribución. En lugar de permitir una modificación directa y silenciosa del estado de un festival, este modal intercepta la acción para crear un registro auditable completo dentro del sub-arreglo `statusHistory`.

Captura tres elementos indispensables: el nuevo veredicto seleccionado (Por enviar, En revisión, Seleccionado, Ganado, No seleccionado, Descalificado), el timestamp o fecha exacta en que fue notificada la decisión (permitiendo ajustar retroactivamente si la notificación llegó días antes) y una nota explicativa o justificación redactada por el distribuidor (por ejemplo: "Notificado vía correo electrónico por el comite de selección internacional").

Estructura del Registro Generado en `statusHistory`:
```json
{
  "id": "hist_129381",
  "status": "Seleccionado",
  "timestamp": "2026-07-30T15:00:00.000Z",
  "updatedBy": "axeldibarra@gmail.com",
  "note": "Confirmada selección oficial en competencia internacional."
}
```

---

## ⌨️ 3. OmniboxModal.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/OmniboxModal.tsx`  
Categoría: Paleta de Comandos `Cmd + K`  

Descripción y Arquitectura Explayada:
OmniboxModal implementa una barra de comandos flotante inspirada en las herramientas de productividad modernas. Escucha continuamente el evento global de teclado `KeyDown` en busca de las combinaciones `Cmd + K` o `Ctrl + K`. Al activarse, despliega una ventana superpuesta con búsqueda difusa que permite al usuario navegar instantáneamente a cualquiera de las 15 vistas, buscar postulaciones específicas por nombre, o ejecutar acciones del sistema como alternar el tema visual o crear una nueva postulación sin necesidad de despegar las manos del teclado.

---

## 🚨 4. GlobalModals.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/GlobalModals.tsx`  
Categoría: Orquestador de Diálogos y Alertas  

Descripción y Arquitectura Explayada:
GlobalModals actúa como la central unificada de diálogo del sistema. En lugar de dispersar componentes de alerta y confirmación por toda la aplicación, este orquestador administra de forma centralizada las ventanas emergentes de confirmación de eliminación irreversible, las alertas por pérdida de conexión a internet (modo Offline), los avisos de error crítico en tiempo de ejecución y los cuadros de diálogo para importar o exportar respaldos de seguridad.

---

## 🗺️ 5. MapReportModal.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/MapReportModal.tsx`  
Categoría: Visor Geográfico Interactivo  

Descripción y Arquitectura Explayada:
MapReportModal proporciona una ventana flotante equipada con un mapa geográfico interactivo alimentado por las APIs de mapas. Proyecta marcadores personalizados sobre las ciudades y países donde el cortometraje o largometraje ha obtenido selecciones oficiales, proyecciones en sala o premios, permitiendo al usuario explorar visualmente el alcance geográfico de la distribución cinematográfica.

---

## ⏰ 6. ReminderModal.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ReminderModal.tsx`  
Categoría: Programador de Notificaciones Push  

Descripción y Arquitectura Explayada:
ReminderModal brinda al usuario la capacidad de configurar alertas temporales para convocatorias críticas. Permite programar recordatorios personalizados (por ejemplo, 24 horas antes del cierre de inscripción o 3 días antes del anuncio de seleccionados). Se conecta con el sistema de notificaciones del navegador y con Firebase Cloud Messaging (FCM) para enviar avisos visuales directos.
