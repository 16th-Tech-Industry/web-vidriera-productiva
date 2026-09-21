import { useState } from "react";
import "./EventosView.css";

export default function EventosView() {
  // Lista de eventos disponibles con su estado de postulación
  const [listaEventos, setListaEventos] = useState([
    {
      id: 1,
      titulo: "Expo Delicatessen & vinos",
      dia: "15",
      mes: "AGO",
      anio: "2026",
      lugar: "Cordoba Argentina",
      postulado: false,
    },
    {
      id: 2,
      titulo: "Feria Agroalimentaria",
      dia: "20",
      mes: "SEP",
      anio: "2026",
      lugar: "Cordoba Argentina",
      postulado: false,
    },
    {
      id: 3,
      titulo: "Encuentro Productivo Regional",
      dia: "10",
      mes: "OCT",
      anio: "2026",
      lugar: "Cordoba Argentina",
      postulado: false,
    },
  ]);

  // Función para manejar la postulación
  const handlePostularse = (id: number) => {
    setListaEventos(
      listaEventos.map((evento) => {
        if (evento.id === id) {
          const nuevoEstado = !evento.postulado;
          if (nuevoEstado) {
            alert(`¡Te has postulado con éxito a "${evento.titulo}"!`);
          } else {
            alert(`Has cancelado tu postulación a "${evento.titulo}".`);
          }
          return { ...evento, postulado: nuevoEstado };
        }
        return evento;
      })
    );
  };

  return (
    <main className="eventos-view">
      {/* Cabecera limpia sin botón de creación */}
      <div className="eventos-header-flex">
        <div>
          <h1>Próximos eventos</h1>
          <p>Mira los próximos eventos de prensa y convocatorias.</p>
        </div>
      </div>

      {/* Caja azul principal con la lista de eventos */}
      <div className="eventos-box-azul">
        <div className="eventos-lista">
          {listaEventos.map((evento) => (
            <div className="evento-fila" key={evento.id}>
              <div className="calendario-bloque">
                <span className="calendario-mes">{evento.mes}</span>
                <span className="calendario-dia">{evento.dia}</span>
              </div>

              <div className="evento-detalles" style={{ flex: 1 }}>
                <h3>{evento.titulo}</h3>
                <p className="evento-fecha">{evento.dia} de {evento.mes.toLowerCase()} de {evento.anio}</p>
                <p className="evento-lugar">{evento.lugar}</p>
              </div>

              {/* Botón de Postulación */}
              <div>
                <button
                  className={`btn-postular ${evento.postulado ? "postulado" : ""}`}
                  onClick={() => handlePostularse(evento.id)}
                >
                  {evento.postulado ? "✓ Postulado" : "Postularme"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de aviso inferior */}
      <div className="eventos-footer-aviso">
        <span className="aviso-icono">ℹ️</span>
        <p>Los eventos estan sujetoa a cambios. Te mantendremos informados.</p>
      </div>
    </main>
  );
}