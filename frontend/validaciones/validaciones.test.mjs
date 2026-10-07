// Pruebas automáticas SENCILLAS de las validaciones del Frontend.
//
// Cómo ejecutar (no necesita instalar nada, viene con Node):
//   cd frontend
//   node --test
//
// Cada test() de abajo se corresponde con un caso de prueba de la
// planilla "Copia de Planilla Test Case.xlsx" (hojas Login y Registro).

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  esEmailValido,
  esPasswordValida,
  passwordsCoinciden,
  esLoginAdmin,
  validarFormularioRegistro,
} from './validaciones.mjs';

// ---------- Módulo LOGIN ----------

test('TC-L-01 login admin con credenciales validas es aceptado', () => {
  assert.equal(esLoginAdmin('admin@admin.com', 'Admin987654'), true);
});

test('TC-L-02 login admin con password incorrecta es rechazado', () => {
  assert.equal(esLoginAdmin('admin@admin.com', '123456'), false);
});

test('TC-L-03 email con formato invalido es rechazado', () => {
  assert.equal(esEmailValido('noesunemail'), false);
  assert.equal(esEmailValido('usuario@correo'), false);
});

test('TC-L-04 email con formato valido es aceptado', () => {
  assert.equal(esEmailValido('usuario@correo.com'), true);
});

test('TC-L-05 password de menos de 8 caracteres es rechazada', () => {
  assert.equal(esPasswordValida('1234567'), false);
});

test('TC-L-06 password de 8 o mas caracteres es aceptada', () => {
  assert.equal(esPasswordValida('12345678'), true);
});

test('TC-L-07 email con espacios adelante/atras se normaliza (trim) y se acepta', () => {
  assert.equal(esEmailValido('  usuario@correo.com  '), true);
});

// ---------- Módulo REGISTRO ----------

test('TC-R-01 registro con todos los datos validos no genera errores', () => {
  const errores = validarFormularioRegistro({
    nombre: 'Ana',
    apellido: 'Perez',
    email: 'ana.perez@correo.com',
    telefono: '',
    password: 'Clave1234',
    confirmPassword: 'Clave1234',
  });
  assert.deepEqual(errores, {});
});

test('TC-R-02 registro con campos obligatorios vacios genera un error por campo', () => {
  const errores = validarFormularioRegistro({
    nombre: '', apellido: '', email: '', password: '', confirmPassword: '',
  });
  assert.ok(errores.nombre);
  assert.ok(errores.apellido);
  assert.ok(errores.email);
  assert.ok(errores.password);
  assert.ok(errores.confirmPassword);
});

test('TC-R-03 registro con email invalido informa el error de email', () => {
  const errores = validarFormularioRegistro({
    nombre: 'Ana', apellido: 'Perez', email: 'noesunemail',
    password: 'Clave1234', confirmPassword: 'Clave1234',
  });
  assert.equal(errores.email, 'Ingresa un correo electrónico válido.');
});

test('TC-R-04 registro con password de menos de 8 caracteres informa el error', () => {
  const errores = validarFormularioRegistro({
    nombre: 'Ana', apellido: 'Perez', email: 'ana@correo.com',
    password: 'corta', confirmPassword: 'corta',
  });
  assert.equal(errores.password, 'Debe tener al menos 8 caracteres.');
});

test('TC-R-05 registro con contrasenias que no coinciden informa el error', () => {
  const errores = validarFormularioRegistro({
    nombre: 'Ana', apellido: 'Perez', email: 'ana@correo.com',
    password: 'Clave1234', confirmPassword: 'Otra9999',
  });
  assert.equal(errores.confirmPassword, 'Las contraseñas no coinciden.');
});

test('TC-R-06 el telefono es opcional: sin telefono no hay error', () => {
  const errores = validarFormularioRegistro({
    nombre: 'Ana', apellido: 'Perez', email: 'ana@correo.com',
    telefono: '', password: 'Clave1234', confirmPassword: 'Clave1234',
  });
  assert.equal(errores.telefono, undefined);
});

test('TC-R-07 funcion passwordsCoinciden con confirmacion vacia devuelve false', () => {
  assert.equal(passwordsCoinciden('Clave1234', ''), false);
});
