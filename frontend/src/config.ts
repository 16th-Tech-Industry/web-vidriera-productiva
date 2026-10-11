// URL base del backend. Se define con la variable de entorno VITE_API_URL
// (ver .envexample); si no está, se usa el backend local.
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
