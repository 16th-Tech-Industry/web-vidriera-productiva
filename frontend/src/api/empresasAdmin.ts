import { API_URL } from '../config';
import { headersAdmin, mensajeDeError } from './comun';

// Revisión de empresas del dashboard admin
// (backend/api/v1/endpoints/dashboard/empresas_revision.py). Todo exige el
// token de un admin.

export interface EmpresaPendiente {
  id_empresa: number;
  cuit: number;
  razon_social: string;
  nombre_empresa: string;
  rubro: string;
  ubicacion: {
    zona: string;
    departamento: string;
    localidad: string;
    calle: string;
    numero: number;
    latitud: number;
    longitud: number;
  };
  descripcion: string;
  correo_empresa: string;
  redes: {
    numero_contacto: string | null;
    facebook: string | null;
    instagram: string | null;
    pagina_web: string | null;
  };
  productos: { id: number; nombre: string; imagen_url: string | null }[];
  representante: { nombre: string; apellido: string; email: string; telefono: string | null } | null;
}

const URL_EMPRESAS = `${API_URL}/api/v1/dashboard/empresas`;

export async function listarPendientes(): Promise<EmpresaPendiente[]> {
  const response = await fetch(`${URL_EMPRESAS}/pendientes`, { headers: headersAdmin() });
  if (!response.ok) throw new Error(await mensajeDeError(response));
  return response.json();
}

export async function aprobarEmpresa(id: number): Promise<void> {
  const response = await fetch(`${URL_EMPRESAS}/${id}/aprobar`, { method: 'PATCH', headers: headersAdmin() });
  if (!response.ok) throw new Error(await mensajeDeError(response));
}

export async function rechazarEmpresa(id: number, motivo: string): Promise<void> {
  const response = await fetch(`${URL_EMPRESAS}/${id}/rechazar`, {
    method: 'PATCH',
    headers: { ...headersAdmin(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo_rechazo: motivo }),
  });
  if (!response.ok) throw new Error(await mensajeDeError(response));
}
