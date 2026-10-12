import { test, expect } from '@playwright/test';
import { HomePage } from './HomePage';

test.describe('Vidriera Productiva - Flujos Críticos E2E (Sprint 4)', () => {

  test('AUT-E2E-01: Cargar la página principal y mostrar novedades', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await expect(page).toHaveTitle(/vidriera-productiva/i);
    await expect(home.novedadesTitulo).toBeVisible();
  });

  test('AUT-E2E-02: Navegación a la sección de noticias', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.irANoticias();
    // Valida que navegue correctamente al detalle o listado de noticias
    await expect(page).toHaveURL(/.*noticias.*/i);
  });

});