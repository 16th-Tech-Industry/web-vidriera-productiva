import { useEffect, useState } from "react";
import type { Empresa } from "./empresas.types";

export interface EmpresaDetailModalProps {
  empresa: Empresa | null;
  onClose: () => void;
  onAprobar?: (empresa: Empresa) => Promise<void>;
  onRechazar?: (empresa: Empresa, motivo: string) => Promise<void>;
}

export default function EmpresaDetailModal({
  empresa,
  onClose,
  onAprobar,
  onRechazar,
}: EmpresaDetailModalProps) {
  const isOpen = empresa !== null;
  // Rechazar pide un motivo (el backend lo exige y se lo manda al representante)
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRechazando(false);
    setMotivo("");
    setError(null);
  }, [empresa?.id]);

  const ejecutar = async (accion: () => Promise<void> | undefined) => {
    setProcesando(true);
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className={`empresa-modal-overlay ${isOpen ? "is-open" : ""}`} onClick={onClose}>
      <aside
        className={`empresa-modal ${isOpen ? "is-open" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={empresa ? `Detalle de ${empresa.nombre}` : "Detalle de empresa"}
      >
        {empresa && (
          <>
            <div className="empresa-modal-header">
              <button
                type="button"
                className="empresa-modal-close"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <span className={`empresa-badge empresa-badge--${empresa.estado}`}>
                {empresa.estado === "nuevo" ? "Nuevo" : "Modificado"}
              </span>

              <h2 className="empresa-modal-nombre">{empresa.nombre}</h2>
              <p className="empresa-modal-rubro">{empresa.rubro}</p>
              {empresa.fechaRegistro && <p className="empresa-modal-fecha">Registrado el {empresa.fechaRegistro}</p>}
            </div>

            <div className="empresa-modal-body">
              <section className="empresa-modal-section">
                <h3>Datos de la empresa</h3>
                <p>{empresa.razonSocial}</p>
                <p>CUIT {empresa.cuit}</p>
                <p>{empresa.correo}</p>
                <p>{empresa.descripcion}</p>
              </section>

              <section className="empresa-modal-section">
                <h3>Representante / Nexo</h3>
                <p>{empresa.representante.nombre}</p>
                <p>{empresa.representante.telefono}</p>
                <p>{empresa.representante.email}</p>
              </section>

              <section className="empresa-modal-section">
                <h3>Ubicación</h3>
                <p>{empresa.direccion}</p>
              </section>

              {(empresa.sitioWeb || empresa.redesSociales) && (
                <section className="empresa-modal-section">
                  <h3>Presencia digital</h3>
                  {empresa.sitioWeb && <p>{empresa.sitioWeb}</p>}
                  {empresa.redesSociales && <p>{empresa.redesSociales}</p>}
                </section>
              )}

              <section className="empresa-modal-section">
                <h3>Productos ({empresa.productos.length})</h3>
                <ul className="empresa-modal-productos">
                  {empresa.productos.map((producto) => (
                    <li key={producto.id}>
                      <span className="empresa-modal-producto-thumb">
                        {producto.imagen ? (
                          <img src={producto.imagen} alt={producto.nombre} />
                        ) : (
                          "🧀"
                        )}
                      </span>
                      {producto.nombre}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {error && <p className="empresa-modal-error">{error}</p>}

            {rechazando ? (
              <div className="empresa-modal-rechazo">
                <label htmlFor="motivo-rechazo">Motivo del rechazo (lo recibe el representante)</label>
                <textarea
                  id="motivo-rechazo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Ej.: falta la constancia de CUIT, la dirección no coincide..."
                  autoFocus
                />
                <div className="empresa-modal-footer">
                  <button
                    type="button"
                    className="empresa-modal-btn"
                    onClick={() => setRechazando(false)}
                    disabled={procesando}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    className="empresa-modal-btn empresa-modal-btn--rechazar"
                    onClick={() => ejecutar(() => onRechazar?.(empresa, motivo.trim()))}
                    disabled={procesando || !motivo.trim()}
                  >
                    {procesando ? "Rechazando..." : "Confirmar rechazo"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="empresa-modal-footer">
                <button
                  type="button"
                  className="empresa-modal-btn empresa-modal-btn--rechazar"
                  onClick={() => setRechazando(true)}
                  disabled={procesando}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className="empresa-modal-btn empresa-modal-btn--aprobar"
                  onClick={() => ejecutar(() => onAprobar?.(empresa))}
                  disabled={procesando}
                >
                  {procesando ? "Aprobando..." : "Aprobar"}
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
