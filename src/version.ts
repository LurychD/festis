import { version } from "../package.json";

/**
 * ARCHITECTURE NOTE: UNIFIED VERSION SINGLE SOURCE OF TRUTH
 * 
 * To change the application version across the entire app and documentation:
 * Simply update the "version" field in `package.json`.
 * All UI components, header badges, wiki documentation pages, and exports
 * import from this file (`src/version.ts`).
 */

export const APP_VERSION: string = version;
export const DOCS_VERSION: string = version;
export const DOCS_VERSION_NOTICE: string = `Nota: La documentación oficial del sistema está actualizada hasta la versión v${version} y se encuentra en constante cambio y evolución.`;
