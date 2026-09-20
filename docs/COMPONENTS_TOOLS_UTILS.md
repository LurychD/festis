# Herramientas, Shaders, Diagnóstico y Utilidades — Guía Detallada de Componentes

Este documento especifica las herramientas de depuración in-app, auditoría de base de datos, fondos WebGL y utilidades de infraestructura situadas en `src/components/`, estructurados formalmente sin el uso de viñetas.

---

## 🗺️ 1. BugsRoadmapView.tsx & BugTracker.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/BugsRoadmapView.tsx` / `src/components/BugTracker.tsx`  
Categoría: Diagnóstico y Control de Errores  

Descripción y Arquitectura Explayada:
BugsRoadmapView y BugTracker integran un panel de seguimiento de fallos y mejoras directamente dentro de la plataforma. Permiten a los usuarios, testers y distribuidores registrar reportes de errores técnicos, proponer funciones deseadas y seguir la evolución de parches en tiempo real sin requerir servicios externos de ticketing.

---

## 💻 2. DebugConsole.tsx & FirestoreDebugger.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/DebugConsole.tsx` / `src/components/FirestoreDebugger.tsx`  
Categoría: Depuración In-App e Inspección de Infraestructura  

Descripción y Arquitectura Explayada:
DebugConsole intercepta las llamadas de la consola JavaScript nativa (`console.log`, `console.warn`, `console.error`), presentándolas en un panel flotante inferior con filtros por nivel de severidad para facilitar la depuración en dispositivos móviles.

FirestoreDebugger inspecciona la salud del canal de sincronización con la base de datos Google Cloud Firestore (`festis-cardigan`). Mide en tiempo real la latencia de respuesta de los sockets, contabiliza la cantidad de lecturas y escrituras ejecutadas durante la sesión, y verifica la integridad de la caché offline almacenada en IndexedDB.

---

## 🔍 3. KeyDuplicatesInspector.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/KeyDuplicatesInspector.tsx`  
Categoría: Auditoría e Integridad de Datos  

Descripción y Arquitectura Explayada:
KeyDuplicatesInspector es un inspector de calidad de datos. Analiza la colección completa de festivales para identificar coincidencias sospechosas en nombres, enlaces de plataformas o fechas de cierre. Ofrece herramientas de fusión de registros para consolidar datos duplicados y prevenir distorsiones en las métricas financieras de inversión.

---

## 🌊 4. OceanShader.tsx & ShaderConfigGroup.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/OceanShader.tsx` / `src/components/ShaderConfigGroup.tsx`  
Categoría: Canvas WebGL 3D  

Descripción y Arquitectura Explayada:
OceanShader es un lienzo Three.js / WebGL 3D que renderiza una simulación inmersiva de ondas marinas en movimiento en el fondo de la pantalla.

ShaderConfigGroup proporciona una barra lateral de configuración con controles deslizantes que ajustan la velocidad del oleaje, la rugosidad de la superficie, el reflejo solar y la paleta cromática, permitiendo personalizar la experiencia visual del entorno de trabajo.

---

## 🎮 5. PlayZoneView.tsx & EasterEgg.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/PlayZoneView.tsx` / `src/components/EasterEgg.tsx`  
Categoría: Entretenimiento y Recursos Temáticos  

Descripción y Arquitectura Explayada:
PlayZoneView y EasterEgg ofrecen un espacio recreativo cinematográfico integrado. Incluyen juegos de trivia sobre historia de festivales internacionales, generadores de nombres de proyectos y sorpresas visuales interactiva activables mediante combinaciones de teclas.

---

## 📊 6. AdvancedCharts.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/AdvancedCharts.tsx`  
Categoría: Componente Gráfico Recharts  

Descripción y Arquitectura Explayada:
AdvancedCharts es un componente genérico de alto nivel para la construcción de gráficos analíticos complejos. Encapsula las configuraciones de Recharts y D3, proporcionando estilos responsivos para gráficos de área, barras comparativas de presupuestos y proyecciones de gasto.

---

## 🧩 7. AppHeader.tsx, NetworkStatusBadge.tsx & HandDrawnIcons.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/AppHeader.tsx` / `src/components/NetworkStatusBadge.tsx` / `src/components/HandDrawnIcons.tsx`  
Categoría: Layout, Estado de Red e Iconografía  

Descripción y Arquitectura Explayada:
AppHeader es la barra superior permanente de la interfaz. Alberga la caja de búsqueda rápida, el conmutador de tema claro u oscuro, el acceso al perfil de usuario y el reloj local.

NetworkStatusBadge monitorea el estado de la conexión a internet y despliega una insignia cromática (Verde: Online / Naranja: Offline con Firestore local activo).

HandDrawnIcons contiene un catálogo de iconos vectoriales SVG trazados a mano que aportan una personalidad artesanal a la interfaz.

---

## 📍 8. PlaceAutocomplete.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/PlaceAutocomplete.tsx`  
Categoría: Integración de Google Maps API  

Descripción y Arquitectura Explayada:
PlaceAutocomplete es un campo de texto con sugerencias geográficas automáticas que se conecta a la API Google Maps Places. Al escribir una ubicación, sugiere ciudades y países oficiales, retornando las coordenadas geográficas de la sede. Si la clave de API no está presente, conmuta de forma transparente a un input de texto estándar sin romper la experiencia del usuario.

---

## 🛡️ 9. ErrorBoundary.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ErrorBoundary.tsx`  
Categoría: Contención Defensiva de Errores React  

Descripción y Arquitectura Explayada:
ErrorBoundary es un componente de contención de errores en React implementado mediante métodos de ciclo de vida de clase (`componentDidCatch`). Envuelve las áreas críticas de la aplicación para interceptar cualquier excepción no controlada en el árbol de componentes. En caso de fallo, detiene la propagación del error y muestra una pantalla amigable de recuperación con la opción de reiniciar la vista sin colapsar el resto de la plataforma.

---

## 🎬 10. AppSplashScreen.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/AppSplashScreen.tsx`  
Categoría: Pantalla de Carga y Contingencia de Red  

Descripción y Arquitectura Explayada:
AppSplashScreen gestiona la experiencia visual de inicio durante la carga asíncrona de módulos (`React.Suspense`) y la comprobación de autenticación. Utiliza mensajes predeterminados y fluidos ("Iniciando Festis Cardigan...", "Preparando entorno de trabajo...") sin exponer nombres técnicos de servicios internos.

Cuenta con un sistema de temporización defensiva en tres fases:
- Fase Normal (0 a 6 segundos): Transición limpia con animación radial de gradientes y microspinner de acento de marca.
- Fase de Demora Leve (6 a 12 segundos): Activa una alerta visual sutil indicando que la conexión está demorando más de lo habitual y comprobando conectividad.
- Fase de Demora Prolongada (más de 12 segundos): Despliega un panel de diagnóstico interactivo que ofrece al usuario tres acciones inmediatas:
  1. Reintentar conexión (`window.location.reload()`).
  2. Continuar en modo local (accede inmediatamente a la plataforma usando la caché local de IndexedDB y almacenamiento del navegador).
  3. Restablecer sesión local (limpia credenciales o tokens corruptos en caso de bloqueos de sesión y reinicia la carga de forma segura).

