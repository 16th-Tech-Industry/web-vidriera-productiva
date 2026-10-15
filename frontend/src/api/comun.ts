// Utilidades compartidas por los módulos de src/api.

// FastAPI devuelve `detail` como texto (401, 403, 404) o como lista de
// errores de validación (422); se arma un mensaje legible en los dos casos.
export async function mensajeDeError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((e: { loc?: string[]; msg: string }) => `${e.loc?.at(-1) ?? ''}: ${e.msg}`).join(' · ');
    }
  } catch {
    // respuesta sin JSON
  }
  return `Error ${response.status}`;
}

// Token del admin logueado (lo guarda Login.tsx en localStorage).
export function headersAdmin(mensajeSinSesion = 'Iniciá sesión como administrador.'): Record<string, string> {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error(mensajeSinSesion);
  return { Authorization: `Bearer ${token}` };
}
