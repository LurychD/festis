# Guía de Contribución al Código

Gracias por contribuir a **Festis**. Sigue estos estándares para mantener la calidad y coherencia de la base de código.

---

## 🌲 Convención de Ramas (Git Flow)

- `main` / `master`: Código estable en producción.
- `feature/nombre-función`: Desarrollo de nuevas características (ej. `feature/multi-tenant-support`).
- `fix/descripcion-bug`: Correcciones de errores (ej. `fix/search-levenshtein-token`).

---

## 📝 Normas de Código y Formato

1. **TypeScript Restricciones:**
   - Evitar `any`. Utilizar interfaces declaradas en `src/types.ts`.
   - Imports nombrados en la parte superior del archivo (`import { ... } from '...'`).
2. **Componentes React:**
   - Componentes funcionales con tipado de Props explícito (`React.FC<Props>`).
   - Evitar `useEffect` con dependencias no estabilizadas para prevenir loops de renderizado.
3. **Estilos Tailwind CSS:**
   - Utilizar clases de utilidad de Tailwind CSS.
   - En componentes condicionales, utilizar el helper `cn()` para fusionar clases.
4. **Commits Semánticos:**
   - `feat: nueva funcionalidad`
   - `fix: corrección de error`
   - `docs: cambios en documentación`
   - `refactor: refactorización de código`
