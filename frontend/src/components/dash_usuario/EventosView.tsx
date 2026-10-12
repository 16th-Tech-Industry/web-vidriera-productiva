import { useState, useEffect } from "react";
import "./EventosView.css";

interface EventoBackend {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  hora: string;
  lugar: string;
  color: string;
}

interface EventoUI{
  id: string;
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
  cierraEn: string;
  postulado: boolean;
}

const meses_abrev= [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

const meses_nombres= [
   "enero", "febrero", "marzo", "abril", "mayo", "junio",
   "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const color_categoria: Record<string, string>= {
  blue: "Feria / Exposición",
  green: "Taller / Capacitación",
  amber: "Networking / Otro",
};

function parsearFechaISO(fechaISO: string){
  const partes= fechaISO.split("-");
  if (partes.length!==3){
    return{ dia: "01", mes: "ENE", mesNombre: "enero", anio: "2026"};
  }
  const [anio, mes, dia]= partes;
  const mesID= parseInt(mes,10) -1;

  return{
    dia: String(parseInt(dia, 10)).padStart(2,"0"),
    mes: meses_abrev[mesID]?? "ENE",
    mesNombre: meses_nombres[mesID]?? "enero",
    anio,
  };
}

function calcularCierraEn(fechaISO: string): string{
  const partes= fechaISO.split("-");
  if (partes.length!==3) return "Inscripción abierta";

  const [anio, mes, dia]= partes;
  const fechaEvento= new Date(parseInt(anio, 10), parseInt(mes, 10) -1, parseInt(dia, 10));
  const hoy= new Date();

  fechaEvento.setHours(0,0,0,0);
  hoy.setHours(0,0,0,0);

  const difTiempo= fechaEvento.getTime() - hoy.getTime();
  const difDias= Math.ceil(difTiempo / (1000 *60 *60 *24));

  if(difDias<0) return "Evento finalizado";
  if(difDias===0) return "Cierra hoy";
  if(difDias===1) return "Cierra mañana";
  return `Cierra en ${difDias} días`;
}

export default function EventosView() {
  const [eventos, setEventos]= useState<EventoUI[]>([]);
  const [cargando, setCargando]= useState<boolean>(true);
  const [toast, setToast]= useState<string | null>(null);

  useEffect(() =>{
    const cargarEventos= async() =>{
      setCargando(true);

      try{
        const response= await fetch("http://localhost:8000/api/v1/eventos/");
        if(response.ok){
          const data: EventoBackend[]= await response.json();

          const guardadas = JSON.parse(localStorage.getItem("misPostulaciones") || "[]") as string[];

          const adaptados: EventoUI[]= data.map((ev) =>{
           const {dia, mes, mesNombre, anio}= parsearFechaISO(ev.fecha);
           const colorLimpio=(ev.color|| "blue"). toLowerCase().trim();

           return{
            id: ev.id,
            categoria: color_categoria[colorLimpio]?? "Evento",
            color: colorLimpio,
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            hora: ev.hora,
            dia,
            mes,
            mesNombre,
            anio,
            lugar: ev.lugar || "Córdoba, Argentina",
            cierraEn: calcularCierraEn(ev.fecha),
            postulado: guardadas.includes(String(ev.id)),
           };
          });

          setEventos(adaptados);
        } else{
          console.error("Error al cargar evento", response.statusText);
        }
      } catch(err){
        console.error("Error cargando evento", err);
      } finally{
        setCargando(false);
      }
    };

    cargarEventos();

  }, []);

  const toggle= (id: string, titulo: string, postulado: boolean) =>{
    setEventos((prev) =>
      prev.map((e) => (e.id=== id? {...e, postulado:!e.postulado}:e))
    );

    const guardadas = JSON.parse(
      localStorage.getItem("misPostulaciones") || "[]"
    ) as string[];
    const nuevas = postulado
    ? guardadas.filter((x) => x!== id)
      : [...guardadas, id];
    localStorage.setItem("misPostulaciones", JSON.stringify(nuevas));

    setToast(
      postulado
    ? `Cancelaste tu postulación a ${titulo}`
      : `Estas postulado a ${titulo}`
    );
    setTimeout(()=> setToast(null), 3000);
  };

  return(
    <main className="eventos-view">
      <div className="eventos-header-flex">
        <div>
          <h1>Próximos Eventos</h1>
          <p>Elegí a cuáles querés postular tu marca</p>
        </div>
      </div>

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

      {cargando?(
        <p style={{color: "#475569", margin:"20px 0"}}>Cargando eventos disponibles...</p>
      ) : eventos.length===0? (
        <p style={{color: "#475569", margin:"20px 0"}}>No hay eventos disponibles en este momento</p>
      ) : (
        <div className="eventos-lista-v2">
          {eventos.map((e) =>(
            <article key={e.id} className="evento-card-v2">

              <div className="calendario-bloque" role="img" aria-label={`${e.dia} de ${e.mesNombre} de ${e.anio}`}>
                <span className="calendario-mes" aria-hidden="true">{e.mes}</span>
                <span className="calendario-dia" aria-hidden="true">{e.dia}</span>
              </div>

              <div className="evento-detalles">
                <span className={`tag tag--${e.color}`}>{e.categoria}</span>
                <h2>{e.titulo}</h2>
                <p className="meta">
                  {e.dia} de {e.mesNombre} {e.anio} {e.hora && `• ${e.hora}`} - {e.lugar}
                </p>
                <p className="cierre">{e.cierraEn}</p>
              </div>

              <div className="evento-accion">
                <button className={`btn-postular ${e.postulado? "postulado" : ""}`}
                onClick={() => toggle(e.id, e.titulo, e.postulado)} aria-pressed={e.postulado}>
                {e.postulado? "✓ Postulado":"Postularme"}
                </button>
              </div>
            </article>
          )
        )
      }
      </div>
      )
      }
      <p className="nota-secundaria">Los eventos están sujetos a cambios. Te avisaremos por email si hay novedades.</p>
    </main>
  );
}