export type EstadoEmpresa = "nuevo" | "modificado";

export interface Producto {
  id: string;
  nombre: string;
  imagen?: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  logo: string;
  rubro: string;
  fechaRegistro: string;
  estado: EstadoEmpresa;
  representante: {
    nombre: string;
    telefono: string;
    email: string;
  };
  direccion: string;
  sitioWeb?: string;
  redesSociales?: string;
  productos: Producto[];
}

// TODO: reemplazar por datos reales obtenidos del backend (FastAPI)
// endpoint sugerido: GET /productores?estado=pendiente
export const EMPRESAS_PENDIENTES: Empresa[] = [
  {
    id: "1",
    nombre: "NUEVO MUNICH FIAMBRES",
    logo: "",
    rubro: "Fiambres y embutidos",
    fechaRegistro: "12/08/2026",
    estado: "nuevo",
    representante: {
      nombre: "Jorge Aleman",
      telefono: "+54 9 351 555-0101",
      email: "jorge.aleman@nuevomunich.com.ar",
    },
    direccion: "Ruta 9 Km 15, Colonia Caroya, Córdoba",
    sitioWeb: "www.nuevomunich.com.ar",
    redesSociales: "@nuevomunichfiambres",
    productos: [
      { id: "p1", nombre: "Jamón crudo artesanal" },
      { id: "p2", nombre: "Salame tipo Milán" },
      { id: "p3", nombre: "Bondiola ahumada" },
    ],
  },
  {
    id: "2",
    nombre: "DON RAMÓN - Fiambres",
    logo: "",
    rubro: "Fiambres y embutidos",
    fechaRegistro: "10/08/2026",
    estado: "modificado",
    representante: {
      nombre: "Ramón Gómez",
      telefono: "+54 9 351 555-0202",
      email: "contacto@donramon.com.ar",
    },
    direccion: "Av. San Martín 450, Jesús María, Córdoba",
    sitioWeb: "www.donramonfiambres.com.ar",
    redesSociales: "@donramonfiambres",
    productos: [
      { id: "p4", nombre: "Chorizo colorado" },
      { id: "p5", nombre: "Longaniza" },
      { id: "p6", nombre: "Panceta ahumada" },
      { id: "p7", nombre: "Queso de cerdo" },
    ],
  },
  {
    id: "3",
    nombre: "DON CELESTINO",
    logo: "",
    rubro: "Dulces y conservas",
    fechaRegistro: "05/08/2026",
    estado: "nuevo",
    representante: {
      nombre: "Celestino Ferrero",
      telefono: "+54 9 351 555-0303",
      email: "doncelestino@gmail.com",
    },
    direccion: "Calle Belgrano 120, Villa General Belgrano, Córdoba",
    productos: [
      { id: "p8", nombre: "Dulce de membrillo casero" },
      { id: "p9", nombre: "Mermelada de frutos rojos" },
    ],
  },
];
