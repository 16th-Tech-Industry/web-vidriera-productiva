import StatCard from "./StatCard";
import NewsCard from "./NewsCard";
import EventCard from "./EventCard";
//import fotoEjemplo from "../../../assets/foto_ejemplo.png";
import { useEffect, useState } from "react";
//import { Noticias } from '../../noticias/noticias';


//datos back
interface Noticias{
  id: number | string;
  titulo: string;
  cuerpo?: string;
  imagen_url?: string;
}

interface Eventos{
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  hora: string;
  lugar: string;
  color: string;
}

// TODO: reemplazar por datos reales que vengan del backend (FastAPI)
const STATS = [
  { icon: "👤", value: 34, label: "Inscripciones a revisar" },
  { icon: "✅", value: 245, label: "PyMEs en el mapa" },
  { icon: "🕒", value: 12, label: "Correcciones pendientes" },
  { icon: "📅", value: "02", label: "Ferias este mes" },
];

const meses_format=[
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

function parseFecha(fechaISO: string) {
  const partes= fechaISO.split("-");
  if(partes.length !==3) return{ day:"01", month:"ENE" };
  const [_, mes, dia]= partes;
  const mesId= parseInt(mes,10)-1;
  return{
    day:dia,
    month: meses_format[mesId] ?? "ENE",
  };
  
}

/*const EVENTS: Array<{
  day: string;
  month: string;
  title: string;
  description: string;
  time: string;
  location: string;
  badgeColor: "blue" | "green";
}> = [
  {
    day: "24",
    month: "OCT",
    title: "Gran Feria Agrícola",
    description:
      "Exhibición de maquinaria, semillas y productos de la región central. Oportunidades de networking para productores.",
    time: "09:00 - 18:00",
    location: "Recinto Feria Central",
    badgeColor: "blue",
  },
  {
    day: "02",
    month: "NOV",
    title: "Taller de Hidroponía",
    description:
      "Capacitación teórica y práctica sobre sistemas de cultivo sin suelo para espacios reducidos urbanos y semi-urbanos.",
    time: "14:00 - 17:00",
    location: "Centro de Innovación Agraria",
    badgeColor: "green",
  },
];*/

/** Vista de Inicio del Dashboard: tarjetas de estadísticas, noticias y próximos eventos. */
export function InicioView() {
  const [noticias,  setNoticias]= useState <Noticias[]>([]);
  const [eventos, setEventos]= useState <Eventos[]>([]);
  const [cargandoNoticias, setCargandoNoticias]= useState <boolean>(true);
  const [cargandoEventos, setCargandoEventos]= useState <boolean>(true);

  useEffect(() =>{
    const obtenerNoticias= async() =>{
      try{
        const response= await fetch ("http://localhost:8000/api/v1/noticias/");
        
        if(response.ok){
          const data: Noticias[]= await response.json();
          setNoticias(data);
        } else{
          console.error("error al cargar", response.statusText);
        }
      } catch(error){
        console.error("error red", error);
      }finally{
        setCargandoNoticias(false);
      }
    };
    obtenerNoticias();
  }, []);

  useEffect(() =>{
    const obtenerEventos= async() =>{
      try{
        const response= await fetch("http://localhost:8000/api/v1/eventos/");
        if (response.ok){
          const data: Eventos[]= await response.json();
          setEventos(data);
        } else{
          console.error("Error al cargar eventos", response.statusText);
        }
      } catch (error){
        console.error("error en eventos", error);
      } finally{
        setCargandoEventos(false);
      }
    };
    obtenerEventos();
  }, []);

  return (
    <>
      <h1 className="dashboard-heading">Panel de control - Administrador</h1>

      <div className="stats-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
{/* Sección de NOTICAS */}
      <section className="dashboard-section">
        <h2 className="section-heading">Noticias</h2>

        {cargandoNoticias?(
          <p style={{ color: "#64748b" }}>Cargando Noticias...</p>
          )  : noticias.length=== 0?(
            <p style={{ color: "#64748b" }}>No hay noticias registradas.</p>
          ) :(
             <div className="news-grid">
              { noticias.map((item) =>(
                <NewsCard
                  key={item.id}
                  image={item.imagen_url || 'https://via.placeholder.com/300x165?text=Novedad'}
                  text={item.titulo}
                />
              ))}
              </div>
              )
        }
      </section>

{/* Sección de Próximos Eventos */}
      <section className="dashboard-section">
        <h2 className="section-heading">Próximos Eventos</h2>
       
       {cargandoEventos ?(
        <p style={{ color: "#64748b" }}>Cargando Eventos...</p>
          )  : noticias.length=== 0?(
            <p style={{ color: "#64748b" }}>No hay eventos para mostrar.</p>
          ) :(  
            <div className="events-grid">
              {eventos.map((ev) =>{
                const{day, month}= parseFecha(ev.fecha);
                removeEventListener
                return(
                  <EventCard
                    key={ev.id}
                    day={day}
                    month={month}
                    title={ev.titulo}
                    description={ev.descripcion}
                    time={ev.hora}
                    location={ev.lugar}
                    badgeColor={ev.color === "green" ? "green": "blue"}
                  />
                )
              }
              )

              }

            </div>
       )

       }
      </section>
    </>
  );
}
