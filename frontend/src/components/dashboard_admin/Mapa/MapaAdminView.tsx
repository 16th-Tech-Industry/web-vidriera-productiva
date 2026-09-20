import { useState } from "react";
import { Mapa } from "../../mapa/mapa";
import db from "../../../assets/db.json";
import "./mapaAdmin.css";

interface ProductorUbicacion {
  id: number;
  nombre: string;
  rubro: string;
  lat: number;
  lng: number;
}

/**
 * Vista "Mapa" del Dashboard Administrador.
 *
 * Reutiliza el componente público <Mapa /> (mismo mapa que ve la
 * ciudadanía) y agrega, al costado, un panel simple para que el
 * agente pueda corregir manualmente la ubicación (lat/lng) de una
 * PyME cuando la geolocalización cargada no sea correcta.
 *
 * NOTA: esta vista es una primera base a propósito simple (el equipo
 * todavía no definió el flujo final de edición de ubicaciones, por
 * ejemplo si se va a poder arrastrar el pin directo sobre el mapa).
 * Por ahora el guardado es solo en estado local del navegador:
 * falta conectar con el backend (ej. PATCH /productores/{id}/ubicacion).
 */
export function MapaAdminView() {
  const [productores, setProductores] = useState<ProductorUbicacion[]>(
    (db.productores as ProductorUbicacion[]).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      rubro: p.rubro,
      lat: p.lat,
      lng: p.lng,
    }))
  );
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [borrador, setBorrador] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });

  const iniciarEdicion = (p: ProductorUbicacion) => {
    setEditandoId(p.id);
    setBorrador({ lat: String(p.lat), lng: String(p.lng) });
  };

  const cancelarEdicion = () => setEditandoId(null);

  const guardarUbicacion = (id: number) => {
    const nuevaLat = parseFloat(borrador.lat);
    const nuevaLng = parseFloat(borrador.lng);
    if (Number.isNaN(nuevaLat) || Number.isNaN(nuevaLng)) return;

    // TODO: conectar con el backend, ej. PATCH /productores/{id}/ubicacion
    setProductores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lat: nuevaLat, lng: nuevaLng } : p))
    );
    setEditandoId(null);
  };

  return (
    <>
      <h1 className="dashboard-heading">Mapa</h1>
      <p className="mapa-admin-subtitulo">
        Este es el mismo mapa que ven los visitantes de la página pública. Desde acá podés
        corregir manualmente la ubicación de una PyME si su geolocalización no es correcta.
      </p>

      <div className="mapa-admin-layout">
        <div className="mapa-admin-mapa">
          <Mapa />
        </div>

        <aside className="mapa-admin-lista">
          <h2 className="section-heading">Ubicaciones registradas</h2>

          <div className="mapa-admin-items">
            {productores.map((p) => (
              <div key={p.id} className="mapa-admin-item">
                <div className="mapa-admin-item-info">
                  <span className="mapa-admin-item-nombre">{p.nombre}</span>
                  <span className="mapa-admin-item-rubro">{p.rubro}</span>
                </div>

                {editandoId === p.id ? (
                  <div className="mapa-admin-item-form">
                    <label>
                      Lat
                      <input
                        type="number"
                        step="any"
                        value={borrador.lat}
                        onChange={(e) =>
                          setBorrador((prev) => ({ ...prev, lat: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Lng
                      <input
                        type="number"
                        step="any"
                        value={borrador.lng}
                        onChange={(e) =>
                          setBorrador((prev) => ({ ...prev, lng: e.target.value }))
                        }
                      />
                    </label>
                    <div className="mapa-admin-item-acciones">
                      <button
                        type="button"
                        className="mapa-admin-btn mapa-admin-btn--cancelar"
                        onClick={cancelarEdicion}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="mapa-admin-btn mapa-admin-btn--guardar"
                        onClick={() => guardarUbicacion(p.id)}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mapa-admin-btn mapa-admin-btn--editar"
                    onClick={() => iniciarEdicion(p)}
                  >
                    Editar ubicación
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
