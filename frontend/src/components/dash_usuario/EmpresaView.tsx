import { useEffect, useState } from 'react';
import './EmpresaView.css';
import AltaEmpresa from './AltaEmpresa';
import type { EstadoEmpresa } from '../dashboard_admin/Empresas/empresas.types';
import { API_URL } from '../../config';

interface EmpresaBackend {
  id_empresa: number;
  cuit: number;
  razon_social: string;
  nombre_empresa: string;
  rubro: string;
  id_representante: number;
  estado: EstadoEmpresa | number;
  motivo_rechazo?: string | null;
  ubicacion: {
    zona: string;
    departamento: string;
    localidad: string;
    calle: string;
    numero: number;
    latitud: number;
    longitud: number;
  };
  descripcion: string;
  correo_empresa: string;
  redes: {
    numero_contacto?: string | null;
    instagram?: string | null;
    pagina_web?: string | null;
  };
}

export default function EmpresaView() {
  const [editando, setEditando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [empresaData, setEmpresaData] = useState<EmpresaBackend | null>(null);

  const cargarMiEmpresa = async () => {
    setCargando(true);
    try {
      const token = 
        localStorage.getItem("authToken")||
        localStorage.getItem("access_token")||
        localStorage.getItem("token")||
      "";

       if (!token){
        setEmpresaData(null);
        setCargando(false);
      return;
    }

      const response = await fetch(`${API_URL}/api/v1/dashboard/empresas/mia`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: EmpresaBackend = await response.json();
        setEmpresaData(data);
      } else if (response.status === 404) {
        setEmpresaData(null);
      } else {
        console.error("Error al obtener la empresa", response.statusText);
      }
    } catch (err) {
      console.error("error de conexión", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMiEmpresa();
  }, []);

  const calcularProgreso = () => {
    if (!empresaData) return 0;
    const campos = [
      empresaData.nombre_empresa,
      empresaData.rubro,
      empresaData.ubicacion?.localidad,
      empresaData.ubicacion?.calle,
      empresaData.descripcion,
      empresaData.correo_empresa,
      empresaData.redes?.numero_contacto,
      empresaData.redes?.instagram,
      empresaData.redes?.pagina_web,
    ];
    const completados = campos.filter((v) => typeof v === 'string' && v.trim() !== '').length;
    return Math.round((completados / campos.length) * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditando(false);
    setToast('¡Perfil actualizado con éxito!');
    setTimeout(() => setToast(null), 3000);
  };

  if (cargando) {
    return (
      <div className="view-container" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#64748b", fontWeight: 600 }}>Cargando perfil institucional</p>
      </div>
    );
  }

  // Si empresa no existe, carga form de alta
  if (!empresaData) {
    return <AltaEmpresa onComplete={cargarMiEmpresa} />;
  }

  const progreso = calcularProgreso();

const obtenerEstadoBadge = (estado: number | EstadoEmpresa | string) => {

    const estadoNum = Number(estado);

    if (estadoNum === 1 || String(estado) === 'APROBADA' || String(estado) === 'APROBADO') {
      return { texto: " Aprobada (visible en vidriera)", css: "is-active" };
    }

    if (estadoNum === 2 || String(estado) === 'RECHAZADA' || String(estado) === 'RECHAZADO') {
      return { texto: " Rechazada", css: "is-inactive" };
    }
    return { texto: " Pendiente de evaluación", css: "is-pending" };
  };

  const estadoInfo = obtenerEstadoBadge(empresaData.estado);

  return (
    <div className="view-container">
      {toast && <div className="toast-notification"> {toast}</div>}

      <div className="content-top-row">
        <div>
          <h1>Mi Empresa</h1>
          <p>Perfil institucional visible en la Vidriera Productiva.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditando(!editando)}>
          {editando ? 'Cancelar' : 'Editar Información'}
        </button>
      </div>

      {/* Cartel de motivo de rechazo */}
            {(Number(empresaData.estado) === 2 || (empresaData.estado as unknown as string) === 'RECHAZADA') && empresaData.motivo_rechazo && (
        <div
          style={{
 
            background: "#fee2e2",
            border: "1px solid #f87171",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            color: "#991b1b",
          }}
        >
          <strong>Solicitud rechazada</strong>
          <p style={{ margin: "4px 0 0 0" }}>{empresaData.motivo_rechazo}</p>
        </div>
    
      )}

      <div className="top-stats-grid">
        <div className="profile-completion-card">
          <div className="completion-info">
            <span>Perfil completado</span><strong>{progreso}%</strong>
          </div>
          <div className="progress-bar-background">
            <div className="progress-bar-fill" style={{ width: `${progreso}%` }}></div>
          </div>
        </div>

      
        <div className="map-status-card">
          <div>
            <span className="status-label">Estado de Revisión</span>
            <span className={`status-value ${estadoInfo.css}`}>
              {estadoInfo.texto}
            </span>
          </div>
        </div>
      </div>

      <div className="empresa-card-container">
        <div className="empresa-card">
          <div className="avatar-column">
            <div className="avatar-placeholder">
              🏢
            </div>
          </div>

          <div className="empresa-info">
            {editando ? (
              <form onSubmit={handleSubmit} className="empresa-form">
                <div className="form-grid">
                  <div className="fg">
                    <label>Nombre Comercial / Fantasía</label>
                    <input
                      type="text"
                      value={empresaData.nombre_empresa}
                      onChange={(e) =>
                        setEmpresaData({ ...empresaData, nombre_empresa: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="fg">
                    <label>Rubro</label>
                    <input type="text" value={empresaData.rubro} disabled />
                  </div>
                  <div className="fg full">
                    <label>Descripción</label>
                    <textarea
                      rows={3}
                      value={empresaData.descripcion || ""}
                      onChange={(e) =>
                        setEmpresaData({ ...empresaData, descripcion: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-save" style={{ marginTop: "16px" }}>
                  Guardar Cambios
                </button>
              </form>
            ) : (
              <div className="empresa-details">
                <h3>{empresaData.nombre_empresa}</h3>
                <span className="badge-rubro">{empresaData.rubro}</span>
                <p className="desc">{empresaData.descripcion || "Sin descripción asignada."}</p>

                <div className="details-grid">
                  <p>
                    <strong>📄 CUIT:</strong> {empresaData.cuit}
                  </p>
                  <p>
                    <strong>📍 Ubicación:</strong> {empresaData.ubicacion?.localidad || "-"},{" "}
                    {empresaData.ubicacion?.departamento || "-"} ({empresaData.ubicacion?.calle || "-"})
                  </p>
                  <p>
                    <strong>🗺️ Zona / Región:</strong> {empresaData.ubicacion?.zona || "-"}
                  </p>
                  <p>
                    <strong>✉️ Email:</strong> {empresaData.correo_empresa || "-"}
                  </p>
                  <p>
                    <strong>📞 Teléfono:</strong> {empresaData.redes?.numero_contacto || "-"}
                  </p>
                  <p>
                    <strong>📸 Instagram:</strong> {empresaData.redes?.instagram || "-"}
                  </p>
                  <p>
                    <strong>🌐 Sitio Web:</strong> {empresaData.redes?.pagina_web || "-"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}