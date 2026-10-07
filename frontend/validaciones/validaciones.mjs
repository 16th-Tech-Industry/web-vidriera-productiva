// Funciones de validación del Frontend (React) — Módulos Login y Registro.
//
// Son una copia EXACTA de las reglas que hoy están escritas dentro de:
//   - frontend/src/components/Login/Login.tsx
//   - frontend/src/components/registro_usuario/registrousuario.tsx
//
// Se extraen acá para poder probarlas de forma automática y sencilla,
// sin necesidad de levantar el navegador ni el backend.

// Regla usada en Login.tsx y registrousuario.tsx para el campo Email.
export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// Regla usada para el campo Contraseña (mínimo 8 caracteres).
export function esPasswordValida(password) {
  return String(password).length >= 8;
}

// Regla usada en el Registro para "Confirmar contraseña".
export function passwordsCoinciden(password, confirmacion) {
  return password === confirmacion && String(confirmacion).length > 0;
}

// Atajo de acceso administrativo provisorio que está hardcodeado en Login.tsx
// (bloque //HEYME_INICIO// ... //HEYME_FIN//).
export function esLoginAdmin(email, password) {
  return String(email).trim() === 'admin@admin.com' && password === 'Admin987654';
}

// Campos obligatorios del formulario de Registro (Teléfono es opcional).
// Devuelve un objeto { campo: "mensaje de error" }. Vacío = sin errores.
export function validarFormularioRegistro(datos) {
  const errores = {};
  if (!String(datos.nombre ?? '').trim()) errores.nombre = 'El nombre es obligatorio.';
  if (!String(datos.apellido ?? '').trim()) errores.apellido = 'El apellido es obligatorio.';

  if (!String(datos.email ?? '').trim()) {
    errores.email = 'El correo electrónico es obligatorio.';
  } else if (!esEmailValido(datos.email)) {
    errores.email = 'Ingresa un correo electrónico válido.';
  }

  if (!datos.password) {
    errores.password = 'La contraseña es obligatoria.';
  } else if (!esPasswordValida(datos.password)) {
    errores.password = 'Debe tener al menos 8 caracteres.';
  }

  if (!datos.confirmPassword) {
    errores.confirmPassword = 'Debes confirmar la contraseña.';
  } else if (datos.password !== datos.confirmPassword) {
    errores.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errores;
}
