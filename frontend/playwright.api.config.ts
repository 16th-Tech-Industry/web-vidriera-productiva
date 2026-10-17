import { defineConfig } from '@playwright/test';

// Tests de API (sin navegador) contra el backend.
// Uso: npx playwright test -c playwright.api.config.ts
// El backend tiene que estar levantado con CORREO_DESACTIVADO=1, o lo levanta
// `webServer` con esa variable.
export default defineConfig({
  testDir: './tests/api',
  fullyParallel: false,
  workers: 1,
  globalTeardown: './tests/api/global-teardown.ts',
  reporter: [
    ['list'],
    ['html', { outputFolder: '../tests/api/registro-playwright/html', open: 'never' }],
    ['junit', { outputFile: '../tests/api/registro-playwright/reporte-junit.xml' }],
  ],
  use: {
    baseURL: process.env.API_URL ?? 'http://localhost:8000',
    extraHTTPHeaders: { Accept: 'application/json' },
  },
  webServer: {
    command: 'CORREO_DESACTIVADO=1 ./.venv/bin/uvicorn main:app --port 8000',
    cwd: '../backend',
    url: 'http://localhost:8000/docs',
    reuseExistingServer: true,
  },
});
