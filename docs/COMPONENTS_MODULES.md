# Módulos Temáticos, Social Media y Reportes — Guía Detallada de Componentes

Este documento especifica los componentes modulares del Dashboard, la suite de difusión en redes sociales (Instagram / Google Drive) y los reportes de rendimiento situados en `src/components/`, estructurados formalmente sin el uso de viñetas.

---

## 📌 1. PinnedFestivalsList.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/PinnedFestivalsList.tsx`  
Categoría: Widget de Dashboard / Festivales Destacados  

Descripción y Arquitectura Explayada:
PinnedFestivalsList es un componente modular de visualización rápida diseñado para integrarse en el Dashboard principal. Presenta una disposición en carrusel horizontal o tarjeta destacada conteniendo únicamente aquellas postulaciones a festivales que el usuario ha marcado explícitamente con la propiedad `isPinned: true`.

Su rasgo diferencial es la integración de un cuadro de notas adhesivas rápidas (`pinNote`). Este espacio permite a los distribuidores escribir recordatorios operativos inmediatos o instrucciones prioritarias (por ejemplo: "Verificar la recepción del disco de proyección DCP en la sede antes del viernes") sin necesidad de ingresar al menú de edición general del festival.

---

## 📅 2. TodaysAgendaList.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/TodaysAgendaList.tsx`  
Categoría: Widget de Dashboard / Agenda Diaria  

Descripción y Arquitectura Explayada:
TodaysAgendaList actúa como el filtro de compromisos del día. Analiza en tiempo real los cierres de convocatorias, notificaciones, proyecciones y tareas que ocurren durante la jornada en curso. Ordena prioritariamente los cierres pendientes al inicio y diferencia visualmente los festivales ya inscritos con tarjetas en verde esmeralda y la insignia de tiempo transcurrido desde el envío (`getTimeSinceSubmitted`).

Despliega una lista ordenada con todas las actividades, entregas de copias y pagos de fees que vencen durante la jornada en curso. Permite a los usuarios marcar tareas como completadas directamente desde el widget del Dashboard, actualizando inmediatamente la propiedad en Firestore y refrescando los indicadores de avance globales.

---

## ⏳ 3. UpcomingDeadlinesList.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/UpcomingDeadlinesList.tsx`  
Categoría: Temporizador Regresivo de Convocatorias  

Descripción y Arquitectura Explayada:
UpcomingDeadlinesList es un widget crítico para la prevención de cierres de convocatoria no atendidos. Inspecciona el catálogo completo de festivales registrados que se encuentran en estado "Por enviar" o "Próximamente" y los ordena cronológicamente según la cercanía de su fecha límite (`deadline`).

Asigna badges o insignias de alerta codificadas por color según el nivel de urgencia:
Color Rojo: Quedan menos de 3 días para el cierre definitivo de inscripciones.
Color Naranja: Quedan entre 4 y 7 días de plazo.
Color Verde: Quedan más de 14 días disponibles para preparar la documentación.

---

## 🔒 4. AutoClosedFestivalsList.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/dashboard/AutoClosedFestivalsList.tsx`  
Categoría: Widget de Dashboard / Histórico de Convocatorias Cerradas  

Descripción y Arquitectura Explayada:
AutoClosedFestivalsList es un componente del Dashboard enfocado en proporcionar visibilidad inmediata sobre las convocatorias cerradas en la última semana (últimos 7 días) o que sufrieron una transición automática al estado 'Cerrado' tras la expiración de su fecha límite.

Visualiza un listado estilizado bajo el título 'Festivales Cerrados esta semana' con badge indicador neutro de 'Sistema' (en color gris) para aquellas transiciones automáticas ejecutadas por el motor. Además, las convocatorias que cerraron o vencen el día de hoy son incorporadas dinámicamente en el encabezado principal de la agenda diaria ('Hola usuario, hoy tenemos') mostrando el conteo de tiempo restante (horas y minutos hasta el cierre). Permite a los distribuidores auditar las convocatorias recientemente expiradas sin interferir con la lista de trabajo activa y acceder a los detalles del festival con un solo toque.

---

## 📱 5. SocialMediaView.tsx & SocialMediaBoard.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/SocialMediaView.tsx`  
Categoría: Prensa y Redes Sociales  

Descripción y Arquitectura Explayada:
SocialMediaView y SocialMediaBoard constituyen la suite central de prensa y comunicación de la plataforma. Proporcionan un espacio de trabajo colaborativo diseñado para planificar, redactar y estructurar las campañas de difusión oficial tras la obtención de Selecciones Oficiales, Premios o Menciones de Honor en festivales.

Permiten redactar comunicados de prensa institucional, organizar los copys para diferentes canales (Instagram, Facebook, X/Twitter, LinkedIn) y asociar el material gráfico correspondiente para mantener una presencia sólida en redes durante el recorrido de la película.

---

## 🗓️ 5. SocialMediaAgenda.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/SocialMediaAgenda.tsx`  
Categoría: Calendario Editorial de Difusión  

Descripción y Arquitectura Explayada:
SocialMediaAgenda es el componente de planificación cronológica para los anuncios de prensa. Proporciona una vista en formato de parrilla o calendario donde se organizan las publicaciones según su fecha y hora programadas para salir a la luz, coordinando los lanzamientos de noticias con las fechas de inauguración de cada festival.

---

## 📸 6. InstagramSimulator.tsx & SocialMediaPreview.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/InstagramSimulator.tsx`  
Categoría: Simulador Gráfico e Integración de IA  

Descripción y Arquitectura Explayada:
InstagramSimulator es un módulo avanzado de generación gráfica que renderiza en pantalla una réplica visual fidedigna de una publicación en el feed de Instagram. 

El componente se conecta con el servicio backend que utiliza la API de Google Gemini para redactar de forma automatizada pies de foto (copywriting) profesionales y emotivos, incluyendo los hashtags oficiales del festival. Sobre la imagen, compone dinámicamente el afiche promocional de la obra cinematográfica e incrusta el laurel oficial obtenido en formato PNG transparente, permitiendo exportar el resultado gráfico listo para ser publicado en redes sociales.

---

## 📁 7. DriveFolderExplorer.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/DriveFolderExplorer.tsx`  
Categoría: Integración de Google Drive  

Descripción y Arquitectura Explayada:
DriveFolderExplorer resuelve la necesidad de compartir carpetas pesadas de prensa sin saturar los servicios de almacenamiento interno. Permite incrustar un visor embebido de carpetas públicas o compartidas de Google Drive.

A través de esta interfaz, los programadores de festivales y periodistas pueden inspeccionar directamente el Press Kit Electrónico (EPK), descargar el archivo tráiler en formato ProRes, acceder a fotogramas en alta resolución para imprenta y revisar la ficha técnica del cortometraje o largometraje.

---

## 📈 8. StatusVelocityReport.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/StatusVelocityReport.tsx`  
Categoría: Analítica de Trazabilidad y Tiempos de Respuesta  

Descripción y Arquitectura Explayada:
StatusVelocityReport es un módulo de análisis estadístico avanzado. Calcula de manera automatizada la cantidad promedio de días transcurridos entre la fecha en que se efectúa la inscripción formal en un festival y la fecha en que se emite la resolución oficial del comité de selección.

Clasifica la velocidad de respuesta por plataforma (FilmFreeway, Shortfilmdepot, Festhome) y por tipo de festival, ayudando al equipo a estimar los tiempos de espera en futuras ediciones.
