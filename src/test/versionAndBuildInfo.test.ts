import { describe, it, expect } from "vitest";
import {
  APP_VERSION,
  DOCS_VERSION,
  BUILD_INFO,
  COMMIT_NUMBER,
  COMMIT_HASH,
  DOCS_VERSION_NOTICE,
  formatFullVersion,
} from "../version";
import { resolveBuildMetadata } from "../../scripts/generate-build-info.js";

describe("Version and Build Info Architecture (QA Suite)", () => {
  describe("1. Contrato Estricto de Versionado Global", () => {
    it("debe exponer la versión Beta 0.5 de forma literal y unificada", () => {
      expect(APP_VERSION).toBe("Beta 0.5");
      expect(DOCS_VERSION).toBe("Beta 0.5");
      expect(BUILD_INFO.version).toBe("Beta 0.5");
    });

    it("debe contener la versión Beta 0.5 en el aviso oficial de documentación", () => {
      expect(DOCS_VERSION_NOTICE).toBe(
        "Nota: La documentación oficial del sistema está actualizada hasta la versión Beta 0.5 y se encuentra en constante cambio y evolución."
      );
    });

    it("el número de commit debe ser un entero positivo válido", () => {
      expect(typeof COMMIT_NUMBER).toBe("number");
      expect(Number.isInteger(COMMIT_NUMBER)).toBe(true);
      expect(COMMIT_NUMBER).toBeGreaterThan(0);
    });

    it("el hash de commit debe tener sintaxis válida hexadecimal de Git (mínimo 7 caracteres)", () => {
      expect(typeof COMMIT_HASH).toBe("string");
      expect(COMMIT_HASH.length).toBeGreaterThanOrEqual(7);
      expect(/^[0-9a-fA-F]{7,40}$/.test(COMMIT_HASH)).toBe(true);
    });

    it("la función formatFullVersion() debe generar el formato canónico 'Beta 0.5 (r{N} · {HASH})'", () => {
      const formatted = formatFullVersion();
      expect(formatted).toBe(`Beta 0.5 (r${COMMIT_NUMBER} · ${COMMIT_HASH})`);
    });

    it("la fecha de compilación debe ser una marca temporal ISO 8601 válida", () => {
      expect(typeof BUILD_INFO.buildDate).toBe("string");
      const parsedDate = Date.parse(BUILD_INFO.buildDate);
      expect(Number.isNaN(parsedDate)).toBe(false);
      expect(parsedDate).toBeGreaterThan(0);
    });
  });

  describe("2. Casos Negativos y Resiliencia en Generación de Metadatos (Fly.io / CI / Sin Git)", () => {
    it("nunca debe devolver 'local' o 'local-dev' ante variables vacías o entorno sin git", () => {
      const emptyEnv = {};
      const metadata = resolveBuildMetadata(emptyEnv, null);

      expect(metadata.version).toBe("Beta 0.5");
      expect(metadata.commitNumber).toBeGreaterThan(0);
      expect(metadata.commitShortHash).not.toBe("local");
      expect(metadata.commitShortHash).not.toBe("local-dev");
      expect(metadata.commitShortHash).not.toBe("undefined");
      expect(metadata.commitHash).not.toContain("local");
    });

    it("debe descartar cadenas 'local' o 'local-dev' inyectadas fraudulentamente en variables de entorno", () => {
      const poisonedEnv = {
        VITE_COMMIT_SHA: "local",
        COMMIT_SHA: "local-dev",
        VITE_GITHUB_SHA: "local",
        VITE_COMMIT_COUNT: "not-a-number",
      };
      const metadata = resolveBuildMetadata(poisonedEnv, {
        commitNumber: 145,
        commitShortHash: "c4d5e6f",
      });

      expect(metadata.commitNumber).toBe(145);
      expect(metadata.commitShortHash).not.toBe("local");
      expect(metadata.commitShortHash).not.toBe("local-dev");
      expect(metadata.commitShortHash).toBe("c4d5e6f");
    });

    it("debe sanear números de commit negativos o nulos y mantener fallback resiliente", () => {
      const corruptEnv = {
        VITE_COMMIT_COUNT: "-42",
      };
      const metadata = resolveBuildMetadata(corruptEnv, {
        commitNumber: 150,
        commitShortHash: "d7e8f9a",
      });

      expect(metadata.commitNumber).toBe(150);
      expect(metadata.commitNumber).toBeGreaterThan(0);
    });

    it("debe manejar payloads de Fly.io (FLY_IMAGE_REF) limpiando identificadores adecuadamente", () => {
      const flyEnv = {
        FLY_IMAGE_REF: "registry.fly.io/festis:deployment-01JH89ABCDEF0123456789",
        VITE_COMMIT_COUNT: "180",
      };
      const metadata = resolveBuildMetadata(flyEnv, null);

      expect(metadata.commitNumber).toBe(180);
      expect(metadata.commitShortHash.length).toBeGreaterThanOrEqual(7);
      expect(metadata.commitShortHash).not.toBe("local");
    });

    it("debe procesar variables de CI/CD (GitHub Actions / Cloud Build) correctamente", () => {
      const ciEnv = {
        VITE_COMMIT_COUNT: "215",
        VITE_COMMIT_SHA: "f9e8d7c6b5a41234567890abcdef1234567890ab",
        VITE_COMMIT_BRANCH: "release/0.5",
      };
      const metadata = resolveBuildMetadata(ciEnv, null);

      expect(metadata.version).toBe("Beta 0.5");
      expect(metadata.commitNumber).toBe(215);
      expect(metadata.commitShortHash).toBe("f9e8d7c");
      expect(metadata.commitHash).toBe("f9e8d7c6b5a41234567890abcdef1234567890ab");
      expect(metadata.commitBranch).toBe("release/0.5");
    });
  });
});
