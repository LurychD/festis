import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { MotionGlobalConfig } from 'motion/react';

// Desactivar animaciones nativas durante pruebas automatizadas para evitar desincronizaciones de Web Animations API en happy-dom
if (MotionGlobalConfig) {
  MotionGlobalConfig.skipAnimations = true;
}

// Capturar cancelaciones de animación en happy-dom
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason: any) => {
    if (
      reason?.name === 'AbortError' ||
      reason?.message?.includes('The animation was canceled')
    ) {
      return;
    }
  });
}

// Limpieza automática del DOM después de cada prueba
afterEach(() => {
  cleanup();
});
