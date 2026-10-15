import { API_URL } from '../config';
import { headersAdmin as headersAdminComun, mensajeDeError } from './comun';

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

const headersAdmin = () => headersAdminComun('Iniciá sesión como administrador para gestionar noticias.');

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
