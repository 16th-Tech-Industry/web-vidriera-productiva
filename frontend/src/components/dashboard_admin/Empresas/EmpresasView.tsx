import { useState } from "react";
import EmpresaCard from "./EmpresaCard";
import EmpresaDetailModal from "./EmpresaDetailModal";
import { EMPRESAS_PENDIENTES, type Empresa } from "./empresas.types";
import "./empresas.css";

/** Vista "Empresas": listado de PyMEs pendientes de validar por el agente ministerial. */
export function EmpresasView() {
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_PENDIENTES);
  const [seleccionada, setSeleccionada] = useState<Empresa | null>(null);

  const handleAprobar = (empresa: Empresa) => {
    // TODO: conectar con el backend, ej. PATCH /productores/{id}/aprobar
    setEmpresas((prev) => prev.filter((e) => e.id !== empresa.id));
    setSeleccionada(null);
  };

  const handleRechazar = (empresa: Empresa) => {
    // TODO: conectar con el backend, ej. PATCH /productores/{id}/rechazar
    setEmpresas((prev) => prev.filter((e) => e.id !== empresa.id));
    setSeleccionada(null);
  };

  return (
    <>
      <h1 className="dashboard-heading">Empresas pendientes de validar</h1>

      {empresas.length === 0 ? (
        <p className="empresas-vacio">No hay empresas pendientes de validación por el momento.</p>
      ) : (
        <div className="empresas-list">
          {empresas.map((empresa) => (
            <EmpresaCard key={empresa.id} empresa={empresa} onClick={setSeleccionada} />
          ))}
        </div>
      )}

      <EmpresaDetailModal
        empresa={seleccionada}
        onClose={() => setSeleccionada(null)}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
      />
    </>
  );
}
