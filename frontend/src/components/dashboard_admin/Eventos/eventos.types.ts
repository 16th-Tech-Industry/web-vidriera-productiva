export type ColorEvento = "blue" | "green" | "amber";

export interface Evento {
  id: string;
  fecha: string; // formato 'YYYY-MM-DD'
  titulo: string;
  descripcion: string;
  hora?: string;
  lugar?: string;
  color: ColorEvento;
}

// TODO: reemplazar por datos reales del backend (ej. GET /eventos)
export const EVENTOS_MOCK: Evento[] = [
  {
    id: "e1",
    fecha: "2026-10-24",
    titulo: "Gran Feria Agrícola",
    descripcion:
      "Exhibición de maquinaria, semillas y productos de la región central. Oportunidades de networking para productores.",
    hora: "09:00 - 18:00",
    lugar: "Recinto Feria Central",
    color: "blue",
  },
  {
    id: "e2",
    fecha: "2026-11-02",
    titulo: "Taller de Hidroponía",
    descripcion:
      "Capacitación teórica y práctica sobre sistemas de cultivo sin suelo para espacios reducidos urbanos y semi-urbanos.",
    hora: "14:00 - 17:00",
    lugar: "Centro de Innovación Agraria",
    color: "green",
  },
  {
    id: "e3",
    fecha: "2026-10-14",
    titulo: "Ronda de Negocios PyMEs",
    descripcion: "Encuentro de negocios entre productores locales y compradores mayoristas.",
    hora: "10:00 - 13:00",
    lugar: "Predio Ferial Córdoba",
    color: "amber",
  },
];
