import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly novedadesTitulo: Locator;
  readonly enlaceNoticias: Locator;
  readonly botonLogin: Locator;

  constructor(page: Page) {
    this.page = page;
    this.novedadesTitulo = page.locator('text=Novedades y Destacados');
    
    // Apuntamos directamente a las tarjetas del carrusel de noticias renderizadas por el componente
    this.enlaceNoticias = page.locator('a[href*="/NoticiasAdminView/"]').first();
    
    // Apuntamos al botón de sesión en la parte superior
    this.botonLogin = page.locator('text=Registro, text=Iniciar').first();
  }

  async goto() {
    await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  }

  async irANoticias() {
    // 1. Esperamos a que la tarjeta aparezca
    await this.enlaceNoticias.waitFor({ state: 'visible', timeout: 10000 });
    // 2. Desplazamos la pantalla (scroll) hasta donde está la noticia
    await this.enlaceNoticias.scrollIntoViewIfNeeded();
    // 3. Hacemos clic
    await this.enlaceNoticias.click();
  }

  async irALogin() {
    await this.botonLogin.scrollIntoViewIfNeeded();
    await this.botonLogin.click();
  }
}