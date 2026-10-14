# PROTOCOLO DE CONTINGENCIA Y ERGONOMÍA: CLIPBOARD PERMISSIONS-POLICY FALLBACK

---

## 1. CONTEXTO TÉCNICO Y CAUSA RAÍZ
En entornos web embebidos mediante `<iframe>` (tales como la vista previa de AI Studio o Google Cloud Run), el navegador aplica restricciones estrictas de seguridad mediante la cabecera `Permissions-Policy`.
Específicamente, si la directiva `clipboard-read` no se encuentra delegada explícitamente en el frame anfitrión (`allow="clipboard-read"`), cualquier llamada a:
```typescript
navigator.clipboard.readText()
```
falla de inmediato con la excepción:
`NotAllowedError: Failed to execute 'readText' on 'Clipboard': The Clipboard API has been blocked because of a permissions policy applied to the current document.`

Lanzar un `console.error` o dejar la promesa sin atrapar degrada la experiencia del usuario e interrumpe los flujos de alta rápida.

---

## 2. ARQUITECTURA DE LA SOLUCIÓN IMPLEMENTADA

### 2.1 Captura Defensiva y Degradación Transparente
En `src/components/FestivalModal.tsx`, la función `handleAutofillFromClipboard` implementa un guard defensivo:
1. Verifica si `navigator.clipboard` o `readText` existen en el contexto de ejecución. Si no existen, activa el submodal de pegado manual sin disparar excepciones.
2. Si existen, intenta la lectura asíncrona dentro de un bloque `try/catch`.
3. Al atrapar `NotAllowedError`, `SecurityError` o cualquier fallo de permisos:
   - Se suprime cualquier `console.error` contaminante.
   - Se limpia y abre de forma inmediata el submodal de contingencia (`showManualPasteModal = true`).
   - El usuario ve una interfaz clara donde puede presionar `Ctrl+V` (o pegar con gesto táctil nativo).

### 2.2 Reutilización Heurística Unificada (`applyDetectedFestival`)
Tanto el flujo directo de portapapeles como el flujo de pegado manual convergen en la misma función modular:
```typescript
applyDetectedFestival(detected: ReturnType<typeof detectFestivalFromText>): boolean
```
Esto garantiza paridad absoluta en la hidratación de:
- Nombre canónico (`name`).
- País soberano normalizado (`country`).
- Fechas de Deadline y Notificación (`deadline`, `newsDate`).
- Enlaces de convocatoria (`link`).
- Costos de inscripción y gratuidad (`price`, `fee`).
- Plataforma detectada (`platform`).
- Categorías y sellos de industria / acreditaciones (`rawNotes`, `detectedAccreditations`).
- Sede o locación de proyección (`projectionLocation`, `city`).

---

## 3. ESPECIFICACIÓN ERGONÓMICA DE INTERFAZ

### 3.1 Botón Icon-Only y Distribución Horizontal en Móviles
- **Composición**: Exclusivamente el ícono `<ClipboardPaste className="w-5 h-5" />`. Cero texto visible.
- **Área Táctil Mínima**: Dimensiones de 44x44px (`w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl`), cumpliendo con la regla estricta de ergonomía táctil para una sola mano.
- **Accesibilidad**: Equipado con `title="Autocompletar desde portapapeles"` y `aria-label="Autocompletar desde portapapeles"`.
- **Ubicación**: En la barra de acciones inferior (footer del modal), estrictamente a la DERECHA del botón principal submit ("Guardar Festival") dentro de un contenedor horizontal persistente (`flex flex-row items-center gap-2 sm:gap-3 w-full`), impidiendo el colapso vertical en pantallas móviles angostas.
- **Condición de Visibilidad**: Exclusivo en modo creación (`modalType === "create"`). Desacoplado de variables de selección residuales para garantizar visibilidad al abrir el modal desde cualquier vista. En modo edición (`edit`) y apertura de nueva edición (`new_edition`) permanece 100% oculto.
- **Higiene de Estado en FAB**: El botón flotante de adición en `App.tsx` invoca explícitamente `setSelectedFestival(null)` antes de abrir el modal en modo `create`.

### 3.2 Submodal de Pegado Manual
- **Activación**: Automática ante restricciones de `Permissions-Policy` o portapapeles vacío.
- **Foco Inmediato**: `textarea` con `autoFocus` para permitir pegado directo instantáneo (`Ctrl+V` o gesto táctil de pegado).
- **Botón Procesador**: Touch target superior a 44px (`min-h-[44px]`), ubicado al alcance del pulgar.
- **Cierre y Feedback**: Cierre automático e instantáneo tras hidratar reactivamente los campos, notificando mediante alerta toast no invasiva.

---

## 4. VALIDACIÓN AUTOMATIZADA
La suite de pruebas en `src/test/FestivalClipboardFallback.test.tsx` valida bajo `happy-dom`:
- Visibilidad exclusiva del botón icon-only en modo creación y ausencia en edición.
- Apertura defensiva del submodal ante simulación de `NotAllowedError`.
- Procesamiento e hidratación completa desde el submodal manual.
- Manejo de fallas ante textos vacíos o corruptos (anti-happy-path).
- Lectura exitosa directa cuando la API nativa tiene permisos concedidos.
