import { useCallback, useEffect, useState } from "react";
import EmpresaCard from "./EmpresaCard";
import EmpresaDetailModal from "./EmpresaDetailModal";
import { aEmpresaVista, type Empresa } from "./empresas.types";
import { aprobarEmpresa, listarPendientes, rechazarEmpresa } from "../../../api/empresasAdmin";
import "./empresas.css";

/**
 * Vista "Empresas": PyMEs pendientes de validar por el agente ministerial.
 * Lee GET /dashboard/empresas/pendientes y aprueba/rechaza contra el backend
 * (ver src/api/empresasAdmin.ts); al aprobar, la empresa pasa al mapa público.
 */
export function EmpresasView() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<Empresa | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const pendientes = await listarPendientes();
      setEmpresas(pendientes.map(aEmpresaVista));
    } catch (e) {
      setError(`No se pudieron cargar las empresas: ${(e as Error).message}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mostrarAviso = (mensaje: string) => {
    setAviso(mensaje);
    setTimeout(() => setAviso(null), 4000);
  };

  // Los errores de aprobar/rechazar los muestra el modal (por eso se relanzan)
  const handleAprobar = async (empresa: Empresa) => {
    await aprobarEmpresa(Number(empresa.id));
    setSeleccionada(null);
    mostrarAviso(`✅ "${empresa.nombre}" aprobada: ya aparece en el mapa público.`);
    await cargar();
  };

  const handleRechazar = async (empresa: Empresa, motivo: string) => {
    await rechazarEmpresa(Number(empresa.id), motivo);
    setSeleccionada(null);
    mostrarAviso(`"${empresa.nombre}" rechazada. Se le avisó al representante.`);
    await cargar();
  };

  return (
    <>
      <div className="empresas-header">
        <h1 className="dashboard-heading">Empresas pendientes de validar</h1>
        <button type="button" className="empresas-actualizar" onClick={cargar} disabled={cargando}>
          {cargando ? "Cargando..." : "↻ Actualizar"}
        </button>
      </div>

      {aviso && <p className="empresas-aviso">{aviso}</p>}
      {error && <p className="empresas-error">{error}</p>}

      {!error && !cargando && empresas.length === 0 ? (
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
