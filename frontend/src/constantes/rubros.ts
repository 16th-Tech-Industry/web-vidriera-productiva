// Rubros de las empresas: única lista para el alta de empresa (dashboard de
// usuario) y para los filtros, la leyenda y los pines del mapa público.
// `valor` es lo que se guarda en ubicacion/rubro de la empresa.

export interface Rubro {
  valor: string;
  etiqueta: string;
  color: string;
}

export const RUBROS: Rubro[] = [
  { valor: 'AGROALIMENTO', etiqueta: 'Agroalimento', color: '#f39200' },
  { valor: 'AGROINDUSTRIA', etiqueta: 'Agroindustria', color: '#00aeef' },
  { valor: 'TEXTIL', etiqueta: 'Textil', color: '#e63946' },
  { valor: 'METALURGICA', etiqueta: 'Metalúrgica', color: '#2a9d8f' },
  { valor: 'MADERA Y MUEBLES', etiqueta: 'Madera y muebles', color: '#8b5e3c' },
  { valor: 'SERVICIOS', etiqueta: 'Servicios', color: '#9b5de5' },
  { valor: 'OTRO', etiqueta: 'Otro', color: '#708090' },
];

const COLOR_SIN_RUBRO = '#708090';

export function colorDeRubro(valor: string): string {
  return RUBROS.find((r) => r.valor === valor)?.color ?? COLOR_SIN_RUBRO;
}
