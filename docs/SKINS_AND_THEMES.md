# Sistema de Temas y Personalización Estética

## Descripción General

El sistema de Temas permite personalizar la apariencia visual de **Festis Cardigan** manteniendo coherencia en la interfaz. La selección del tema se vincula y guarda de forma persistente por usuario en **Firestore** (`users/{userId}`) y en `localStorage` para garantizar carga instantánea sin parpadeos.

## Arquitectura

- **SkinContext (`src/context/SkinContext.tsx`)**:
  - Proveedor React que administra el tema activo (`activeSkin`).
  - Sincroniza la skin activa con los atributos globales `data-skin` en `document.documentElement` y `document.body`.
  - Persiste cambios en Firestore (`users/{userId}`) si hay un usuario autenticado.
- **Temas Disponibles**:
  - `cardigan` (Cardigan): Tema oficial con degradado pastel y fucsia emblemático `#e91e63`. Marcado con badge `Oficial`.
  - `cardigan-noche` (Cardigan Noche): Modo noche en tonos azul pizarra oscuro (`#0f172a`, `#1e293b`), fucsia y acentos celestes para alta legibilidad en ambientes de baja luz. Marcado con badge `WiP`.
  - `cardigan-boceto` (Cardigan Ilustración): Estética inspirada en acuarela/boceto con lienzo azul hielo (`#eaf2f8`) y trazos azul cobalto/índigo (`#2d3e50`). Marcado con badge `WiP`.
- **Selector de Temas & Laboratorio UI Standalone**:
  - Ubicado en **Configuración > General** y **Configuración > DEV** (`src/components/ConfigView.tsx`), con acceso directo al **Laboratorio UI** (`src/components/ThemeDesignSystemShowcaseView.tsx`).
  - **Vista Independiente de Laboratorio de Diseño (`ThemeDesignSystemShowcaseView`)**: Entorno a pantalla completa dedicado que funciona como maqueta viva y banco de pruebas UI/UX.
    - **Selector de Temas en Tiempo Real**: Permite cambiar entre `cardigan` (Oficial), `cardigan-noche` (WiP) y `cardigan-boceto` (WiP).
    - **Maqueta de Componentes**: Despliega muestras interactivas de todas las variaciones UI de la app (Tarjetas KPI/ROI, Ficha de Festival con laureles, Formularios, Inputs, Selects, Alertas, Botones principales/secundarios/peligro y Tablas de datos).
    - **Calibrador Personalizable de Estilos**: Editor de controles deslizantes e inputs de color para ajustar en directo gradientes de fondo, tarjetas, textos, inputs, bordes y radio de bordes (border-radius), inyectando variables CSS en vivo y permitiendo copiar las reglas generadas para ser aplicadas al tema oficial.

- **Integración con Componentes Clave y Adaptabilidad Global**:
  - **Splash Screen Oficial (`index.html` y `AppSplashScreen.tsx`)**:
    - Utiliza el degradado dinámico oficial Cardigan en tonos pasteles: `linear-gradient(-45deg, #fce7f3, #e0e7ff, #e0f2fe, #fef3c7, #fce7f3)` con ciclo infinito de 12 segundos.
    - Centra una tarjeta translúcida con `backdrop-blur-md`, tipografía "Cargando...", rueda giratoria en `#e91e63` y reporte dinámico de estados de descarga de scripts y conexión a base de datos.
  - **Sincronización de Clase Dark**: `SkinContext` conmuta automáticamente la clase CSS `.dark` en `document.documentElement` y `document.body` al activar `cardigan-noche`, habilitando utilidades de Tailwind `dark:`.
  - **Adaptación Global de Componentes (`src/index.css`)**: Reglas CSS globales para `[data-skin="cardigan-noche"]` reinterpretan contenedores blancos (`bg-white`, `bg-slate-50`, `bg-slate-100`), bordes, campos de texto, tablas, menús contextuales y modales a superficies oscuras con texto brillante (`#f8fafc`), preservando la paleta de color fucsia/magenta de la marca Cardigan.
  - **AppHeader (`src/components/AppHeader.tsx`)**: Consume `useSkin()` para detectar si el tema activo es modo noche (`cardigan-noche` o `dark`). Ajusta de forma fluida los colores del contenedor del header, campo de búsqueda, filtros secundarios, modal de selección de países y modal PWA. **Mantiene intactos los estilos de transformación de animaciones por desplazamiento** (`headerTop`, `headerMaxWidth`, `headerPadding`, `headerRadius`) gestionados por `framer-motion`.

## Estructura de Datos en Firestore

```json
// Colección: users/{userId}
{
  "activeSkin": "cardigan",
  "email": "usuario@ejemplo.com",
  "updatedAt": "2026-08-01T08:30:00.000Z"
}
```
