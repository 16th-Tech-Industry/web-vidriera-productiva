export interface Productor {
  id: number;
  nombre: string;
  rubro: 'AGTECH' | 'AGROALIMENTO' | 'AGROINDUSTRIA' | string;
  localidad: string;
  lat: number;
  lng: number;
  descripcion: string;
  imagen: string;
}

export interface EventoLanding {
  id: number;
  nombre: string;
  categoria: 'AGTECH' | 'AGROALIMENTO' | 'AGROINDUSTRIA' | string;
  localidad: string;
  fechaInicio: string;
  fechaFin: string;
  lat: number;
  lng: number;
  descripcion: string;
  imagen: string;
}

export interface LandingResponse {
  productores: Productor[];
  eventos: EventoLanding[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const obtenerDatosLanding = async (): Promise<LandingResponse> => {
  const res = await fetch(`${API_URL}/api/v1/landing/`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: no se pudieron cargar los datos de la landing`);
  }
  return res.json();
};

export const obtenerProductores = async (): Promise<Productor[]> => {
  const res = await fetch(`${API_URL}/api/v1/landing/productores`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

export const obtenerEventosLanding = async (): Promise<EventoLanding[]> => {
  const res = await fetch(`${API_URL}/api/v1/landing/eventos`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};