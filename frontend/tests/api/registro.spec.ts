import { test, expect } from '@playwright/test';

// Tests de API del registro de representantes: POST /api/v1/register/
// Correr con el backend levantado con CORREO_DESACTIVADO=1 para no mandar
// mails a Mailtrap. Los usuarios creados usan el prefijo `pwtest.` en el email;
// `limpiar_registro_pw.py` los borra al terminar.

const RUTA = '/api/v1/register/';
const emailUnico = () => `pwtest.${Date.now()}.${Math.floor(Math.random() * 1e6)}@vidriera-prueba.com`;

const usuarioValido = () => ({
  email: emailUnico(),
  name: 'Ana',
  apellido: 'Prueba',
  password: 'ClaveSegura123',
});

test.describe('API - Registro de representantes', () => {

  test('API-REG-01: registro válido devuelve 201 y los datos del usuario', async ({ request }) => {
    const datos = usuarioValido();
    const res = await request.post(RUTA, { data: datos });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toEqual(expect.any(Number));
    expect(body.email).toBe(datos.email);
    expect(body.name).toBe(datos.name);
    expect(body.role).toBe(0);
    expect(body.is_active).toBe(true);
  });

  test('API-REG-02: la respuesta no expone la contraseña ni su hash', async ({ request }) => {
    const datos = usuarioValido();
    const res = await request.post(RUTA, { data: datos });
    expect(res.status()).toBe(201);
    const texto = await res.text();
    expect(texto).not.toContain(datos.password);
    expect(texto).not.toMatch(/password|contrasenia|\$2[aby]\$/i);
  });

  test('API-REG-03: email ya registrado devuelve 400', async ({ request }) => {
    const datos = usuarioValido();
    expect((await request.post(RUTA, { data: datos })).status()).toBe(201);
    const res = await request.post(RUTA, { data: datos });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe('El email ya está registrado');
  });

  test('API-REG-04: contraseña de menos de 8 caracteres devuelve 422', async ({ request }) => {
    const res = await request.post(RUTA, { data: { ...usuarioValido(), password: 'corta1' } });
    expect(res.status()).toBe(422);
    const { detail } = await res.json();
    expect(detail.some((e: any) => e.loc.includes('password'))).toBe(true);
  });

  test('API-REG-05: email con formato inválido devuelve 422', async ({ request }) => {
    const res = await request.post(RUTA, { data: { ...usuarioValido(), email: 'no-es-un-email' } });
    expect(res.status()).toBe(422);
    const { detail } = await res.json();
    expect(detail.some((e: any) => e.loc.includes('email'))).toBe(true);
  });

  test('API-REG-06: nombre de 1 caracter devuelve 422', async ({ request }) => {
    const res = await request.post(RUTA, { data: { ...usuarioValido(), name: 'A' } });
    expect(res.status()).toBe(422);
  });

  test('API-REG-07: falta el apellido devuelve 422', async ({ request }) => {
    const { apellido, ...sinApellido } = usuarioValido();
    const res = await request.post(RUTA, { data: sinApellido });
    expect(res.status()).toBe(422);
    const { detail } = await res.json();
    expect(detail.some((e: any) => e.loc.includes('apellido') && e.type === 'missing')).toBe(true);
  });

  test('API-REG-08: body vacío devuelve 422 con los 4 campos obligatorios', async ({ request }) => {
    const res = await request.post(RUTA, { data: {} });
    expect(res.status()).toBe(422);
    const campos = (await res.json()).detail.map((e: any) => e.loc.at(-1));
    expect(campos).toEqual(expect.arrayContaining(['email', 'name', 'apellido', 'password']));
  });

  test('API-REG-09: el usuario registrado puede iniciar sesión', async ({ request }) => {
    const datos = usuarioValido();
    expect((await request.post(RUTA, { data: datos })).status()).toBe(201);
    const res = await request.post('/api/v1/users/login', { data: { email: datos.email, password: datos.password } });
    expect(res.ok()).toBe(true);
  });
});
