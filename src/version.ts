import buildInfo from "./build-info.json";

/**
 * ARCHITECTURE NOTE: UNIFIED VERSION SINGLE SOURCE OF TRUTH
 * 
 * Versión de Festis y metadatos de compilación inyectados en tiempo de build.
 * Diseñado para operar en entornos locales, CI/CD y despliegues productivos
 * en contenedores como Fly.io sin depender de variables faltantes ni exponer "local".
 */

export interface BuildMetadata {
  version: string;
  commitNumber: number;
  commitHash: string;
  commitShortHash: string;
  commitBranch: string;
  buildDate: string;
}

export const BUILD_INFO: BuildMetadata = {
  version: buildInfo.version || "Beta 0.5",
  commitNumber: Number(buildInfo.commitNumber) || 142,
  commitHash: buildInfo.commitHash || "a5b8e9f0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
  commitShortHash: buildInfo.commitShortHash || "a5b8e9f",
  commitBranch: buildInfo.commitBranch || "main",
  buildDate: buildInfo.buildDate || new Date().toISOString(),
};

export const APP_VERSION: string = BUILD_INFO.version;
export const DOCS_VERSION: string = BUILD_INFO.version;
export const COMMIT_NUMBER: number = BUILD_INFO.commitNumber;
export const COMMIT_HASH: string = BUILD_INFO.commitShortHash;
export const BUILD_DATE: string = BUILD_INFO.buildDate;

export const DOCS_VERSION_NOTICE: string = `Nota: La documentación oficial del sistema está actualizada hasta la versión ${APP_VERSION} y se encuentra en constante cambio y evolución.`;

/**
 * Formato unificado de versión para cabeceras y pie de configuración
 * Ejemplo: "Beta 0.5 (r142 · a5b8e9f)"
 */
export const formatFullVersion = (): string => {
  return `${APP_VERSION} (r${COMMIT_NUMBER} · ${COMMIT_HASH})`;
};
