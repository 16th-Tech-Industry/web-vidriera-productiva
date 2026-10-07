export interface Evento {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  hora?: string | null;
  lugar?: string | null;
  color?: string;
}

export interface EventoCreate {
  fecha: string;
  titulo: string;
  descripcion?: string;
  hora?: string | null;
  lugar?: string | null;
  color?: string;
}

export type EventoUpdate = Partial<EventoCreate>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const eventosService = {
  // Listado público para landing / calendario
  async getAll(): Promise<Evento[]> {
    const res = await fetch(`${API_URL}/eventos/`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Error al cargar los eventos');
    return res.json();
  },

  // Obtener detalle de un evento
  async getById(id: string | number): Promise<Evento> {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Evento no encontrado');
    return res.json();
  },

  // Crear evento (requiere admin)
  async create(data: EventoCreate): Promise<Evento> {
    const res = await fetch(`${API_URL}/eventos/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear el evento');
    }
    return res.json();
  },

  // Editar evento (requiere admin)
  async update(id: string | number, data: EventoUpdate): Promise<Evento> {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar el evento');
    }
    return res.json();
  },

  // Eliminar evento (requiere admin)
  async delete(id: string | number): Promise<void> {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al eliminar el evento');
    }
  },
};