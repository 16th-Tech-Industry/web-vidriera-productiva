import { API_URL } from '../config';

// Llamadas a /api/v1/noticias (backend/api/v1/endpoints/noticias.py).
// Listar es público; crear, editar y eliminar piden el token de un admin,
// el mismo que guarda Login.tsx en localStorage ('authToken').

export interface Noticia {
  id: number;
  titulo: string;
  cuerpo: string; // HTML que arma el editor del dashboard admin
  imagen_url: string | null;
  fecha_creacion: string;
  estado: number;
}

const URL_NOTICIAS = `${API_URL}/api/v1/noticias/`;

// FastAPI devuelve `detail` como texto (401, 403, 404) o como lista de
// errores de validación (422); se arma un mensaje legible en los dos casos.
async function mensajeDeError(response: Response): Promise<string> {
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

function headersAdmin(): HeadersInit {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Iniciá sesión como administrador para gestionar noticias.');
  return { Authorization: `Bearer ${token}` };
}

export async function listarNoticias(): Promise<Noticia[]> {
  const response = await fetch(URL_NOTICIAS);
  if (!response.ok) throw new Error(await mensajeDeError(response));
  return response.json();
}

export interface DatosNoticia {
  titulo: string;
  cuerpo: string;
  imagen: File | null;
}

function armarFormulario({ titulo, cuerpo, imagen }: DatosNoticia): FormData {
  const formulario = new FormData();
  formulario.append('titulo', titulo);
  formulario.append('cuerpo', cuerpo);
  if (imagen) formulario.append('imagen', imagen);
  return formulario;
}

export async function crearNoticia(datos: DatosNoticia): Promise<Noticia> {
  const response = await fetch(URL_NOTICIAS, { method: 'POST', headers: headersAdmin(), body: armarFormulario(datos) });
  if (!response.ok) throw new Error(await mensajeDeError(response));
  return response.json();
}

export async function editarNoticia(id: number, datos: DatosNoticia): Promise<Noticia> {
  const response = await fetch(`${URL_NOTICIAS}${id}`, { method: 'PATCH', headers: headersAdmin(), body: armarFormulario(datos) });
  if (!response.ok) throw new Error(await mensajeDeError(response));
  return response.json();
}

export async function eliminarNoticia(id: number): Promise<void> {
  const response = await fetch(`${URL_NOTICIAS}${id}`, { method: 'DELETE', headers: headersAdmin() });
  if (!response.ok) throw new Error(await mensajeDeError(response));
}

// Pasa el HTML del cuerpo a texto plano para mostrarlo en la landing sin
// insertar HTML en la página: los saltos de bloque quedan como renglones.
export function cuerpoATexto(html: string): string {
  const conSaltos = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|li|h[1-6])>/gi, '\n');
  const documento = new DOMParser().parseFromString(conSaltos, 'text/html');
  return (documento.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
