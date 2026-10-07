import type { Empresa } from "./empresas.types";

export interface EmpresaCardProps {
  empresa: Empresa;
  onClick: (empresa: Empresa) => void;
}

/** Iniciales de respaldo cuando la empresa todavía no tiene logo cargado. */
function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();
}

export default function EmpresaCard({ empresa, onClick }: EmpresaCardProps) {
  return (
    <div
      className="empresa-card"
      onClick={() => onClick(empresa)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(empresa);
      }}
    >
      <div className="empresa-card-logo">
        {empresa.logo ? (
          <img src={empresa.logo} alt={empresa.nombre} />
        ) : (
          <span>{iniciales(empresa.nombre)}</span>
        )}
      </div>

      <div className="empresa-card-info">
        <span className="empresa-card-nombre">{empresa.nombre}</span>
        <span className="empresa-card-meta">
          {empresa.rubro} · Registrado el {empresa.fechaRegistro}
        </span>
      </div>

      <span className={`empresa-badge empresa-badge--${empresa.estado}`}>
        {empresa.estado === "nuevo" ? "Nuevo" : "Modificado"}
      </span>

      <button
        type="button"
        className="empresa-card-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClick(empresa);
        }}
        aria-label={`Ver detalle de ${empresa.nombre}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
