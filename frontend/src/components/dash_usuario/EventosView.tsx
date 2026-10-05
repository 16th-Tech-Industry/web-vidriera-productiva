import { useState } from "react";
import "./EventosView.css";

type Evento = {
  id: number;
  categoria: string;
  titulo: string;
  dia: string;
  mes: string;
  anio: string;
  lugar: string;
  cierraEn: string;
  postulado: boolean;
};

const inicial: Evento[] = [
  { id: 1, categoria: "Vinos y Delicatessen", titulo: "Expo Delicatessen & Vinos", dia: "15", mes: "AGO", anio: "2026", lugar: "Córdoba, Argentina", cierraEn: "Cierra en 5 días", postulado: false },
  { id: 2, categoria: "Agroalimentaria", titulo: "Feria Agroalimentaria", dia: "20", mes: "SEP", anio: "2026", lugar: "Córdoba, Argentina", cierraEn: "Cierra en 12 días", postulado: false },
  { id: 3, categoria: "Regional", titulo: "Encuentro Productivo Regional", dia: "10", mes: "OCT", anio: "2026", lugar: "Córdoba, Argentina", cierraEn: "Cierra en 30 días", postulado: false },
];

export default function EventosView() {
  const [eventos, setEventos] = useState(inicial);
  const [toast, setToast] = useState<string | null>(null);

  const toggle = (id: number, titulo: string, postulado: boolean) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, postulado: !e.postulado } : e));
    setToast(postulado ? `Cancelaste tu postulación a ${titulo}` : `Listo, estás postulado a ${titulo}`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <main className="eventos-view">
      <div className="eventos-header-flex">
        <div>
          <h1>Próximos eventos</h1>
          <p>Elegí a cuáles querés postular tu marca.</p>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="eventos-lista-v2">
        {eventos.map(e => (
          <article key={e.id} className="evento-card-v2">
            <div className="calendario-bloque" aria-label={`${e.dia} de ${e.mes} ${e.anio}`}>
              <span className="calendario-mes">{e.mes}</span>
              <span className="calendario-dia">{e.dia}</span>
            </div>
            <div className="evento-detalles">
              <span className="tag">{e.categoria}</span>
              <h3>{e.titulo}</h3>
              <p className="meta">{e.dia} de {e.mes.toLowerCase()} {e.anio} • {e.lugar}</p>
              <p className="cierre">{e.cierraEn}</p>
            </div>
            <div className="evento-accion">
              <button
                className={`btn-postular ${e.postulado ? "postulado" : ""}`}
                onClick={() => toggle(e.id, e.titulo, e.postulado)}
                aria-pressed={e.postulado}
              >
                {e.postulado ? "✓ Postulado" : "Postularme"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="nota-secundaria">Los eventos están sujetos a cambios. Te avisaremos por email si hay novedades.</p>
    </main>
  );
}