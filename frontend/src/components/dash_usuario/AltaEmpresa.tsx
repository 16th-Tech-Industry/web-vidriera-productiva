import { useState, useEffect } from 'react';
import './AltaEmpresa.css';

interface Departamento {
  id: number;
  nombre: string;
  zona: string;
}

interface Localidad {
  id: number;
  nombre: string;
}

const RUBROS = [
  "AGROALIMENTO",
  "AGROINDUSTRIA",
  "TEXTIL",
  "METALURGICA",
  "MADERA Y MUEBLES",
  "SERVICIOS",
  "OTRO",
];

export default function AltaEmpresa({ onComplete }: { onComplete: () => void }) {
  const [depto, setDepto] = useState("");
  const [zona, setZona] = useState("");
  const [idDepto, setIdDepto] = useState<string>("");
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  

  const [cargandoLocalidades, setCargandoLocalidades] = useState(false);

  const [busquedaLocalidad, setBusquedaLocalidad] = useState("");
  const [mostrarDropdownLocalidad, setMostrarDropdownLocalidad] = useState(false);

  const [isDark, setIsDark] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombreEmpresa: "",
    nombreFantasia: "",
    cuit: "",
    rubro: "AGROALIMENTO",
    correoEmpresa: "",
    descripcion: "",
    localidad: "",
    direccion: "",
    numero: "123",
    telefono: "",
    instagram: "",
    paginaWeb: "",
  });

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const cargarDepartamentosBD = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/ubicaciones/departamentos");
        if (res.ok) {
          const data = await res.json();
          setDepartamentos(Array.isArray(data) ? data : []);
        } else {
          setDepartamentos([]);
        }
      } catch (err) {
        console.error("Error al obtener departamentos de la BD:", err);
        setDepartamentos([]);
      }
    };
    cargarDepartamentosBD();
  }, []);

  const handleDepartamentoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idSeleccionado = e.target.value;
    setIdDepto(idSeleccionado);

    const deptoEncontrado = Array.isArray(departamentos)
      ? departamentos.find((d) => d && String(d.id) === idSeleccionado)
      : null;
    const nombreDepto = deptoEncontrado ? deptoEncontrado.nombre : "";
    setDepto(nombreDepto);
    setZona(deptoEncontrado ? deptoEncontrado.zona : "");

    setForm((prev) => ({ ...prev, localidad: "" }));
    setBusquedaLocalidad("");
    setLocalidades([]);
    setMostrarDropdownLocalidad(false);

    if (idSeleccionado) {

      setCargandoLocalidades(true);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/ubicaciones/localidades/${idSeleccionado}`);
        if (res.ok) {
          const data = await res.json();
          setLocalidades(Array.isArray(data) ? data : []);

          setMostrarDropdownLocalidad(true);
        } else {
          setLocalidades([]);
        }
      } catch (err) {
        console.error("Error al obtener localidades de la BD:", err);
        setLocalidades([]);
      } finally {
  
        setCargandoLocalidades(false);
      }
    }
  };


  const normalizar = (str: string) =>
    (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const seguroLocalidades = Array.isArray(localidades) ? localidades : [];
  const terminoBusqueda = normalizar(busquedaLocalidad);


  const localidadesFiltradas = seguroLocalidades.filter((l) => {
    if (!l || !l.nombre) return false;
    return normalizar(l.nombre).includes(terminoBusqueda);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    if (!form.localidad) {
      setErrorMsg("Por favor seleccione una localidad de la lista desplegable.");
      setCargando(false);
      return;
    }

    const cuitLimpio = form.cuit.replace(/\D/g, "");
    const cuitNumerico = parseInt(cuitLimpio, 10);

    if (isNaN(cuitNumerico) || cuitLimpio.length !== 11) {
      setErrorMsg("Introduzca 11 dígitos sin guiones");
      setCargando(false);
      return;
    }

    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "";

    if (!token) {
      setErrorMsg("No autenticado. Vuelva a iniciar sesión");
      setCargando(false);
      return;
    }

    const payloadBackend = {
      cuit: cuitNumerico,
      razon_social: form.nombreEmpresa,
      nombre_empresa: form.nombreFantasia || form.nombreEmpresa,
      rubro: form.rubro,
      ubicacion: {
        zona: zona,
        departamento: depto,
        localidad: form.localidad,
        calle: form.direccion,
        numero: parseInt(form.numero, 10) || 0,
        latitud: -31.42,
        longitud: -64.18,
      },
      descripcion: form.descripcion || "Sin descripción proporcionada",
      correo_empresa: form.correoEmpresa,
      redes: {
        numero_contacto: form.telefono || null,
        facebook: null,
        instagram: form.instagram || null,
        pagina_web: form.paginaWeb || null,
      },
    };

    try {
      const response = await fetch("http://localhost:8000/api/v1/dashboard/empresas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadBackend),
      });

      if (response.status === 201 || response.ok) {
        onComplete();
      } else {
        const errData = await response.json();
        setErrorMsg(
          typeof errData.detail === "string"
            ? errData.detail
            : "Error al registrar la empresa. Verifique los datos"
        );
      }
    } catch (err) {
      console.error("Error de conexión", err);
      setErrorMsg("Sin conexión con Backend (puerto 8000)");
    } finally {
      setCargando(false);
    }
  };

  const cardBg = isDark ? '#1e293b' : '#9cc2e6';
  const borderColor = isDark ? '#334155' : 'transparent';
  const textPrimary = isDark ? '#f1f5f9' : '#12395e';
  const textSecondary = isDark ? '#94a3b8' : '#0f2f4d';
  const labelColor = isDark ? '#cbd5e1' : '#0f2f4d';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: `1px solid ${isDark ? '#334155' : '#7aadd6'}`,
    outline: 'none',
    fontSize: '13px',
    background: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: labelColor,
    display: 'block',
    marginBottom: '6px',
    marginLeft: '4px'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '20px',
        padding: '26px 28px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.35)' : '0 12px 32px rgba(15,57,94,0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: textSecondary, letterSpacing: '0.8px', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', textTransform: 'uppercase' }}>
            <span>MINISTERIO DE BIOAGROINDUSTRIA</span>
            <span>| Córdoba</span>
          </div>
          <h1 style={{ color: textPrimary, fontSize: '20px', margin: '8px 0 0 0', fontWeight: 800 }}>Registra tu empresa</h1>
        </div>

        {errorMsg && (
          <div style={{
            background: "#ef4444",
            color: "#ffffff",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            textAlign: "center",
            fontWeight: 600,
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nombre de la empresa</label>
            <input style={inputStyle} value={form.nombreEmpresa} onChange={e => setForm({ ...form, nombreEmpresa: e.target.value })} placeholder="ej. Bioagroindustria" required />
          </div>

          <div>
            <label style={labelStyle}>Nombre de fantasía</label>
            <input style={inputStyle} value={form.nombreFantasia} onChange={e => setForm({ ...form, nombreFantasia: e.target.value })} placeholder="ej. Agricultura y ganadería" />
          </div>

          <div>
            <label style={labelStyle}>Rubro</label>
            <select
              style={inputStyle}
              value={form.rubro}
              onChange={(e) => setForm({ ...form, rubro: e.target.value })} required>
              {RUBROS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={labelStyle}>CUIT</label>
              <input
                style={inputStyle}
                value={form.cuit}
                onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                placeholder='11 dígitos sin guiones'
                required />
            </div>

            <div>
              <label style={labelStyle}>Correo Institucional</label>
              <input
                type='email'
                style={inputStyle}
                value={form.correoEmpresa}
                onChange={(e) => setForm({ ...form, correoEmpresa: e.target.value })}
                placeholder='contacto@empresa.com'
                required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Departamento</label>
              <select style={inputStyle} value={idDepto} onChange={handleDepartamentoChange} required>
                <option value="">Seleccionar Departamento</option>
                {Array.isArray(departamentos) && departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <label style={labelStyle}>Localidad</label>
              <input
                style={{ ...inputStyle, opacity: !idDepto ? 0.5 : 1 }}
                type="text"
                placeholder={
                  !idDepto
                    ? "Elegí departamento"
                    : "Escribí o seleccioná..."
                }
                value={busquedaLocalidad}
                onChange={(e) => {
                  setBusquedaLocalidad(e.target.value);
                  setForm({ ...form, localidad: "" });
                  setMostrarDropdownLocalidad(true);
                }}
                onFocus={() => {
                  if (idDepto) setMostrarDropdownLocalidad(true);
                }}
                // 
                onBlur={() => {
                  setTimeout(() => setMostrarDropdownLocalidad(false), 200);
                }}
                disabled={!idDepto}
                required
              />

              {mostrarDropdownLocalidad && idDepto && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "180px",
                    overflowY: "auto",
                    background: isDark ? "#0f172a" : "#ffffff",
                    border: `1px solid ${isDark ? "#334155" : "#7aadd6"}`,
                    borderRadius: "10px",
                    marginTop: "4px",
                    padding: "0",
                    listStyle: "none",
                    zIndex: 100,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                  }}
                >
         
                  {cargandoLocalidades ? (
                    <li style={{ padding: "10px", fontSize: "11px", color: labelColor, textAlign: "center" }}>
                       Cargando localidades...
                    </li>
                  ) : localidadesFiltradas.length === 0 ? (
                    <li style={{ padding: "10px", fontSize: "11px", color: labelColor, textAlign: "center" }}>
                      {seguroLocalidades.length === 0
                        ? "No hay localidades registradas"
                        : "No se encontraron coincidencias"}
                    </li>
                  ) : (
                    localidadesFiltradas.map((l) => (
                      <li
                        key={l.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setForm({ ...form, localidad: l.nombre });
                          setBusquedaLocalidad(l.nombre);
                          setMostrarDropdownLocalidad(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: isDark ? "#f1f5f9" : "#0f172a",
                          borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                        }}
                      >
                        {l.nombre}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Dirección de punto de venta</label>
            <input style={inputStyle} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="ej. Figueroa Alcorta 234" required />
          </div>

          <button type="submit" disabled={cargando} style={{
            marginTop: '8px',
            background: isDark ? '#0f172a' : '#12395e',
            color: '#fff',
            padding: '13px',
            borderRadius: '12px',
            border: `1px solid ${isDark ? '#334155' : '#12395e'}`,
            fontWeight: 700,
            cursor: cargando ? 'wait' : 'pointer',
            width: '100%'
          }}>
            {cargando ? "Registrando tu empresa..." : "Registrar empresa"}
          </button>
        </form>
      </div>
    </div>
  );
}