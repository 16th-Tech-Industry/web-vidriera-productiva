import { useState, useEffect } from "react";
import "./EventosView.css";
import "./MisPostulacionesView.css";
import { API_URL } from '../../config';

// 📌 ID temporal de la empresa de prueba (coincide con la creada en Oracle)
const ID_EMPRESA_ACTIVA = 1;

// 📌 Interface del objeto tal como lo devuelve el endpoint GET /api/v1/postulaciones/empresa/1
interface PostulacionBackend {
  id_postulacion: number;
  id_empresa: number;
  id_evento: number;
  fecha_postulacion: string;
  estado: string;
  motivo_rechazo?: string | null;
  evento: {
    id: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    hora: string;
    lugar: string;
    color: string;
  };
}

// 📌 Interface adaptada para los componentes visuales de la interfaz
interface EventoPostuladoUI {
  id: string;
  idPostulacion: number;
  categoria: string;
  color: string;
  titulo: string;
  descripcion: string;
  hora: string;
  dia: string;
  mes: string;
  mesNombre: string;
  anio: string;
  lugar: string;
  estado: string;
  fechaPostulacion: string;
  motivoRechazo?: string | null;
}

const meses_abrev = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

const meses_nombres = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const color_categoria: Record<string, string> = {
  blue: "Feria / Exposición",
  green: "Taller / Capacitación",
  amber: "Networking / Otro",
};

function parsearFechaISO(fechaISO: string) {
  const partes = fechaISO.split("-");
  if (partes.length !== 3) {
    return { dia: "01", mes: "ENE", mesNombre: "enero", anio: "2026" };
  }
  const [anio, mes, dia] = partes;
  const mesID = parseInt(mes, 10) - 1;

  return {
    dia: String(parseInt(dia, 10)).padStart(2, "0"),
    mes: meses_abrev[mesID] ?? "ENE",
    mesNombre: meses_nombres[mesID] ?? "enero",
    anio,
  };
}

export default function MisPostulacionesView() {
  const [misEventos, setMisEventos] = useState<EventoPostuladoUI[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtro, setFiltro] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [eventoActivo, setEventoActivo] = useState<EventoPostuladoUI | null>(null);

  // 📌 NUEVO: Consultar las postulaciones reales desde la API de FastAPI / Oracle
  useEffect(() => {
    const cargarMisPostulaciones = async () => {
      setCargando(true);
      try {
        const response = await fetch(
          `${API_URL}/api/v1/postulaciones/empresa/${ID_EMPRESA_ACTIVA}`
        );

        if (response.ok) {
          const data: PostulacionBackend[] = await response.json();

          // Transformar la respuesta del backend para la interfaz de React
          const adaptados: EventoPostuladoUI[] = data.map((item) => {
            const { dia, mes, mesNombre, anio } = parsearFechaISO(item.evento.fecha);
            const colorLimpio = (item.evento.color || "blue").toLowerCase().trim();

            return {
              id: String(item.id_evento),
              idPostulacion: item.id_postulacion,
              categoria: color_categoria[colorLimpio] ?? "Evento",
              color: colorLimpio,
              titulo: item.evento.titulo,
              descripcion: item.evento.descripcion,
              hora: item.evento.hora,
              dia,
              mes,
              mesNombre,
              anio,
              lugar: item.evento.lugar || "Córdoba, Argentina",
              estado: item.estado || "PENDIENTE",
              fechaPostulacion: item.fecha_postulacion,
              motivoRechazo: item.motivo_rechazo,
            };
          });

          setMisEventos(adaptados);
        } else {
          console.error("Error al obtener mis postulaciones:", response.statusText);
        }
      } catch (err) {
        console.error("Error de red al conectar con el servidor:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarMisPostulaciones();
  }, []);

  // 📌 Lógica de filtros por buscador, estado e histórico
  const filtrados = misEventos.filter((e) => {
    const busca =
      e.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.categoria.toLowerCase().includes(busqueda.toLowerCase());

    if (filtro === "Histórico") {
      return parseInt(e.anio, 10) < new Date().getFullYear() && busca;
    }
    if (filtro === "Todas") return busca;
    
    // Compara "PENDIENTE" con "Pendientes", "APROBADO" con "Aprobadas", etc.
    return e.estado.toLowerCase() === filtro.toLowerCase().slice(0, -1) && busca;
  });

  return (
    <main className="eventos-view">
      <h1>Mis Postulaciones</h1>
      <p>Eventos a los que te postulaste y su estado actual.</p>

      {/* 📌 Indicador de carga */}
      {cargando ? (
        <p style={{ color: "#64748b", margin: "20px 0" }}>
          Cargando tus postulaciones...
        </p>
      ) : misEventos.length === 0 ? (
        <p style={{ color: "#64748b", margin: "20px 0" }}>
          Todavía no te postulaste a ningún evento. Andá a <b>Eventos</b> para postularte.
        </p>
      ) : (
        <>
          {/* BARRA DE FILTROS Y BUSCADOR */}
          <div className="filtros-bar">
            <div className="tabs">
              {["Todas", "Pendientes", "Aprobadas", "Rechazadas", "Histórico"].map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${filtro === tab ? "active" : ""}`}
                  onClick={() => setFiltro(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Buscar evento..."
              className="buscador-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* LISTADO DE TARJETAS DE POSTULACIÓN */}
          <div className="eventos-lista-v2">
            {filtrados.length === 0 ? (
              <p style={{ color: "#64748b", margin: "10px 0" }}>
                No hay resultados para "{busqueda}" en {filtro}.
              </p>
            ) : null}

            {filtrados.map((e) => (
              <article
                key={e.id}
                className="evento-card-v2 mis-postulacion-card"
                onClick={() => setEventoActivo(e)}
                style={{ cursor: "pointer" }}
              >
                <div className="calendario-bloque">
                  <span className="calendario-mes">{e.mes}</span>
                  <span className="calendario-dia">{e.dia}</span>
                </div>

                <div className="evento-detalles">
                  <span className={`tag tag--${e.color}`}>
                    {e.categoria} •{" "}
                    <span className={`estado-badge estado-${e.estado.toLowerCase()}`}>
                      {e.estado.toUpperCase()}
                    </span>
                  </span>
                  <h3>{e.titulo}</h3>
                  <p className="meta">
                    {e.dia} de {e.mesNombre} {e.anio} {e.hora && `• ${e.hora}`} - {e.lugar}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* MODAL CON EL DETALLE / LÍNEA DE TIEMPO DEL ESTADO */}
      {eventoActivo && (
        <div className="modal-overlay" onClick={() => setEventoActivo(null)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <h2>{eventoActivo.titulo}</h2>
            <span className={`estado-badge estado-${eventoActivo.estado.toLowerCase()}`}>
              {eventoActivo.estado.toUpperCase()}
            </span>

            <div className="timeline">
              <div className="timeline-item done">
                <div className="dot"></div>
                <p>
                  <b>Postulado el {eventoActivo.fechaPostulacion}</b>
                  <br />
                  Tu solicitud fue recibida correctamente por el sistema.
                </p>
              </div>

              <div
                className={`timeline-item ${
                  eventoActivo.estado.toLowerCase() !== "pendiente" ? "done" : "active"
                }`}
              >
                <div className="dot"></div>
                <p>
                  <b>En evaluación</b>
                  <br />
                  El equipo del Ministerio está revisando tu PyME.
                </p>
              </div>

              <div
                className={`timeline-item ${
                  eventoActivo.estado.toLowerCase() === "rechazado"
                    ? "rejected"
                    : eventoActivo.estado.toLowerCase() === "aprobado"
                    ? "done"
                    : ""
                }`}
              >
                <div className="dot"></div>
                <p>
                  <b>
                    {eventoActivo.estado.toLowerCase() === "pendiente"
                      ? "Pendiente de resolución"
                      : eventoActivo.estado.toLowerCase() === "aprobado"
                      ? "Aprobado"
                      : "Rechazado"}
                  </b>
                  <br />
                  {eventoActivo.estado.toLowerCase() === "rechazado"
                    ? `Motivo: ${eventoActivo.motivoRechazo || "Cupos cubiertos."}`
                    : eventoActivo.estado.toLowerCase() === "aprobado"
                    ? "¡Felicitaciones! Revisá tu email para conocer la ubicación de tu stand."
                    : "Te avisaremos por mail cuando cambie el estado de tu postulación."}
                </p>
              </div>
            </div>

            <button className="btn-cerrar" onClick={() => setEventoActivo(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}