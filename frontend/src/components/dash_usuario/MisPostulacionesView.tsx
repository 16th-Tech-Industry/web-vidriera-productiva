import { useState, useEffect } from "react";
import "./EventosView.css";
import "./MisPostulacionesView.css";

type Evento = {
  id: number; 
  categoria: string; 
  titulo: string; 
  dia: string; 
  mes: string; 
  anio: string; 
  lugar: string; 
  estado?: string;
  fechaPostulacion?: string;
};

export default function MisPostulacionesView() {
  const [misEventos, setMisEventos] = useState<Evento[]>([]);
  const [filtro, setFiltro] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [eventoActivo, setEventoActivo] = useState<Evento | null>(null);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("misPostulaciones") || "[]") as number[];
    const todos = JSON.parse(localStorage.getItem("eventos_detalle") || "[]") as Evento[];
    const lista = todos.length ? todos : [
      { id: 1, categoria: "Vinos y Delicatessen", titulo: "Expo Delicatessen & Vinos", dia: "15", mes: "AGO", anio: "2026", lugar: "Córdoba, Argentina" },
      { id: 2, categoria: "Agroalimentaria", titulo: "Feria Agroalimentaria", dia: "20", mes: "SEP", anio: "2026", lugar: "Córdoba, Argentina" },
      { id: 3, categoria: "Regional", titulo: "Encuentro Productivo Regional", dia: "10", mes: "OCT", anio: "2026", lugar: "Córdoba, Argentina" },
    ];
    setMisEventos(lista.filter(e => ids.includes(e.id)).map(e => ({...e, estado: e.estado || "pendiente", fechaPostulacion: e.fechaPostulacion || new Date().toLocaleDateString()})));
  }, []);

  // 2 y 4. Lógica de filtros + buscador + histórico
  const filtrados = misEventos.filter(e => {
    const busca = e.titulo.toLowerCase().includes(busqueda.toLowerCase()) || e.categoria.toLowerCase().includes(busqueda.toLowerCase());
    
    if (filtro === "Histórico") {
      // Si el año ya pasó, va a histórico
      return parseInt(e.anio) < new Date().getFullYear() && busca;
    }
    if (filtro === "Todas") return busca;
    return e.estado?.toLowerCase() === filtro.toLowerCase().slice(0, -1) && busca; // Pendientes -> pendiente
  });

  if(misEventos.length === 0){
    return (
      <main className="eventos-view">
        <h1>Mis Postulaciones</h1>
        <p>Todavía no te postulaste a ningún evento. Andá a Eventos para postularte.</p>
      </main>
    )
  }

  return (
    <main className="eventos-view">
      <h1>Mis Postulaciones</h1>
      <p>Eventos a los que te postulaste y su estado.</p>

      {/* 2. FILTROS Y BUSCADOR */}
      <div className="filtros-bar">
        <div className="tabs">
          {["Todas", "Pendientes", "Aprobadas", "Rechazadas", "Histórico"].map(tab => (
            <button key={tab} className={`tab-btn ${filtro === tab ? "active" : ""}`} onClick={() => setFiltro(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Buscar feria..." className="buscador-input" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className="eventos-lista-v2">
        {filtrados.length === 0 ? <p>No hay resultados para "{busqueda}" en {filtro}.</p> : null}
        {filtrados.map(e => (
          <article key={e.id} className="evento-card-v2 mis-postulacion-card" onClick={() => setEventoActivo(e)} style={{cursor: 'pointer'}}>
            <div className="calendario-bloque">
              <span className="calendario-mes">{e.mes}</span>
              <span className="calendario-dia">{e.dia}</span>
            </div>
            <div className="evento-detalles">
              <span className="tag">
                {e.categoria} • <span className={`estado-badge estado-${e.estado?.toLowerCase()}`}>{e.estado?.toUpperCase()}</span>
              </span>
              <h3>{e.titulo}</h3>
              <p className="meta">{e.lugar} • {e.anio}</p>
            </div>
          </article>
        ))}
      </div>

      {/* 3. DETALLE / LÍNEA DE TIEMPO */}
      {eventoActivo && (
        <div className="modal-overlay" onClick={() => setEventoActivo(null)}>
          <div className="modal-detalle" onClick={e => e.stopPropagation()}>
            <h2>{eventoActivo.titulo}</h2>
            <span className={`estado-badge estado-${eventoActivo.estado?.toLowerCase()}`}>{eventoActivo.estado?.toUpperCase()}</span>
            
            <div className="timeline">
              <div className="timeline-item done">
                <div className="dot"></div>
                <p><b>Postulado el {eventoActivo.fechaPostulacion}</b><br/>Tu solicitud fue recibida por el Ministerio.</p>
              </div>
              <div className={`timeline-item ${eventoActivo.estado !== 'pendiente' ? 'done' : 'active'}`}>
                <div className="dot"></div>
                <p><b>En evaluación</b><br/>El equipo técnico revisa tu PyME.</p>
              </div>
              <div className={`timeline-item ${eventoActivo.estado === 'rechazado' ? 'rejected' : eventoActivo.estado === 'aprobado' ? 'done' : ''}`}>
                <div className="dot"></div>
                <p>
                  <b>{eventoActivo.estado === 'pendiente' ? 'Pendiente de resolución' : eventoActivo.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}</b><br/>
                  {eventoActivo.estado === 'rechazado' ? 'Motivo: Cupos cubiertos / Documentación.' : eventoActivo.estado === 'aprobado' ? '¡Felicitaciones! Revisá tu email para el stand.' : 'Te avisaremos por mail cuando cambie el estado.'}
                </p>
              </div>
            </div>
            <button className="btn-cerrar" onClick={() => setEventoActivo(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </main>
  );
}