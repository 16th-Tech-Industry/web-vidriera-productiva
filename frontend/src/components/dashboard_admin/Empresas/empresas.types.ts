import type { EmpresaPendiente } from "../../../api/empresasAdmin";

// Hoy toda empresa pendiente es "nuevo": el backend no tiene todavía un
// circuito de modificación que la devuelva a revisión.
export type EstadoEmpresa = "nuevo" | "modificado";

export interface Producto {
  id: string;
  nombre: string;
  imagen?: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  razonSocial: string;
  cuit: string;
  logo: string;
  rubro: string;
  // La tabla empresas no guarda fecha de alta todavía
  fechaRegistro?: string;
  estado: EstadoEmpresa;
  descripcion: string;
  correo: string;
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

/** Convierte una empresa de GET /dashboard/empresas/pendientes a lo que muestran la tarjeta y el detalle. */
export function aEmpresaVista(e: EmpresaPendiente): Empresa {
  const { calle, numero, localidad, departamento } = e.ubicacion;
  const redes = [e.redes.instagram, e.redes.facebook].filter(Boolean).join(" · ");
  return {
    id: String(e.id_empresa),
    nombre: e.nombre_empresa,
    razonSocial: e.razon_social,
    cuit: String(e.cuit),
    logo: e.productos.find((p) => p.imagen_url)?.imagen_url ?? "",
    rubro: e.rubro,
    estado: "nuevo",
    descripcion: e.descripcion,
    correo: e.correo_empresa,
    representante: {
      nombre: e.representante ? `${e.representante.nombre} ${e.representante.apellido}` : "Sin datos del representante",
      telefono: e.representante?.telefono || e.redes.numero_contacto || "Sin teléfono",
      email: e.representante?.email ?? "",
    },
    direccion: `${calle} ${numero}, ${localidad}, ${departamento}, Córdoba`,
    sitioWeb: e.redes.pagina_web ?? undefined,
    redesSociales: redes || undefined,
    productos: e.productos.map((p) => ({ id: String(p.id), nombre: p.nombre, imagen: p.imagen_url ?? undefined })),
  };
}
