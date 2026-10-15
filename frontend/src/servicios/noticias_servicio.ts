export interface NoticiaResponse {
  id: number | string;
  titulo: string;
  cuerpo?: string;
  imagen_url?: string | null;
  fecha_creacion?: string;
  estado?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const obtenerNoticias = async (soloActivas: boolean = true): Promise<NoticiaResponse[]> => {
    const res = await fetch(`${API_URL}/api/v1/noticias/?solo_activas=${soloActivas}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: no se pudieron cargar las noticias`);
  }

  return res.json();
};

export default obtenerNoticias;