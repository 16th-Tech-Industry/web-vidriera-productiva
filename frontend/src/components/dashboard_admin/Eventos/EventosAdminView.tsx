import { useMemo, useState, useEffect } from "react";
import EventoFormModal from "./EventoFormModal";
import type { Evento } from "./eventos.types";
import "./eventosAdmin.css";

const DIAS_SEMANA = ["D", "L", "M", "X", "J", "V", "S"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface CeldaDia {
  fecha: Date;
  iso: string;
  enMesActual: boolean;
}

function construirGrilla(mesRef: Date): CeldaDia[] {
  const primerDiaMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const diaSemanaInicio = primerDiaMes.getDay(); // 0 = domingo
  const inicioGrilla = new Date(primerDiaMes);
  inicioGrilla.setDate(primerDiaMes.getDate() - diaSemanaInicio);

  const celdas: CeldaDia[] = [];
  for (let i = 0; i < 42; i++) {
    const fecha = new Date(inicioGrilla);
    fecha.setDate(inicioGrilla.getDate() + i);
    celdas.push({
      fecha,
      iso: toISODate(fecha),
      enMesActual: fecha.getMonth() === mesRef.getMonth(),
    });
  }
  return celdas;
}

export function EventosAdminView() {
  const [mesActual, setMesActual] = useState(() => new Date()); //fecha en sistema
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando]= useState<boolean>(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);

  const cargarEventos= async() =>{
    setCargando(true);
    try{
      const response= await fetch ("http://localhost:8000/api/v1/eventos/");
      if(response.ok){
        const data= await response.json();
        setEventos(data);
      } else{
        console.error("error en servidor");
      }
    } catch (err){
        console.error("error al cargar los eventos", err);
    } finally{
      setCargando(false);
    }
  };

  useEffect(()=> {
    cargarEventos();
  },[]);

  const celdas = useMemo(() => construirGrilla(mesActual), [mesActual]);
  const hoyISO = toISODate(new Date());

  const eventosPorFecha = useMemo(() => {
    const mapa = new Map<string, Evento[]>();
    for (const ev of eventos) {
      const lista = mapa.get(ev.fecha) ?? [];
      lista.push(ev);
      mapa.set(ev.fecha, lista);
    }
    return mapa;
  }, [eventos]);

  const eventosDelDia = diaSeleccionado ? eventosPorFecha.get(diaSeleccionado) ?? [] : [];

  const eventosDelMesOrdenados = useMemo(() => {
    return eventos
      .filter((ev) => ev.fecha.startsWith(
        `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, "0")}`
      ))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [eventos, mesActual]);

  const cambiarMes = (delta: number) => {
    setMesActual((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setDiaSeleccionado(null);
  };

  const irAHoy = () => {
    const hoy = new Date();
    setMesActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setDiaSeleccionado(hoyISO);
  };

  const abrirNuevoEvento = (fecha?: string) => {
    setEventoEditando(null);
    setDiaSeleccionado(fecha ?? diaSeleccionado);
    setModalAbierto(true);
  };

  const abrirEdicion = (evento: Evento) => {
    setEventoEditando(evento);
    setModalAbierto(true);
  };

  const handleGuardar = async (datos: Omit<Evento, "id"> & { id?: string }) => {
    // TODO: conectar con el backend, ej. POST /eventos o PUT /eventos/{id}
    try{
      const token= localStorage.getItem("authToken") || localStorage.getItem("access_token");
      const esEdicion= Boolean(datos.id);

      const url= esEdicion 
      ? `http://localhost:8000/api/v1/eventos/${datos.id}`
      : "http://localhost:8000/api/v1/eventos/";
      
      const method= esEdicion ? "PATCH" : "POST";

      const response= await fetch( url, {
        method,
        headers:{
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      });

    if (response.ok){
      await cargarEventos();
      setModalAbierto(false);
    } else{
      alert("error al giardar evento, verifica campos");
    }
    } catch(err){
      console.error("Error al guardar", err);
  }
  };

  const handleEliminar = async(id: string) => {
    // TODO: conectar con el backend, ej. DELETE /eventos/{id}
    if (!window.confirm("¿Seguro que querés eliminar este evento?")) return;
    
    try{
      const token= localStorage.getItem("authToken") || localStorage.getItem("access_token");

      const response= await fetch(`http://localhost:8000/api/v1/eventos/${id}`,{
        method: "DELETE",
        headers:{
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.ok){
        await cargarEventos();
        setModalAbierto(false);
      } else{
        alert("No se puede elminar");
      }
    } catch(err){
      console.error("Error al eliminar evento", err);
    }
  };

  const listaAMostrar = diaSeleccionado ? eventosDelDia : eventosDelMesOrdenados;
  const tituloLista = diaSeleccionado
    ? `Eventos del ${diaSeleccionado.split("-").reverse().join("/")}`
    : `Todos los eventos de ${MESES[mesActual.getMonth()]}`;

  return (
    <>
      <div className="eventos-admin-header">
        <h1 className="dashboard-heading">Calendario de Ferias y Eventos</h1>
        <button type="button" className="eventos-admin-btn-agregar" onClick={() => abrirNuevoEvento()}>
          + Agregar Evento
        </button>
      </div>

      <div className="eventos-admin-nav">
        <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
          ‹
        </button>
        <span className="eventos-admin-mes">
          {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
        </span>
        <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
          ›
        </button>
        <button type="button" className="eventos-admin-btn-hoy" onClick={irAHoy}>
          Hoy
        </button>
      </div>

      <div className="eventos-admin-grid">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="eventos-admin-dia-header">
            {d}
          </div>
        ))}

        {celdas.map((celda) => {
          const eventosDia = eventosPorFecha.get(celda.iso) ?? [];
          const esHoy = celda.iso === hoyISO;
          const esSeleccionado = celda.iso === diaSeleccionado;

          return (
            <button
              type="button"
              key={celda.iso}
              className={[
                "eventos-admin-celda",
                !celda.enMesActual && "is-fuera-de-mes",
                esHoy && "is-hoy",
                esSeleccionado && "is-seleccionado",
                eventosDia.length > 0 && "tiene-eventos",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setDiaSeleccionado(celda.iso === diaSeleccionado ? null : celda.iso)}
              onDoubleClick={() => abrirNuevoEvento(celda.iso)}
              title="Click para ver eventos, doble click para agregar uno"
            >
              <span>{celda.fecha.getDate()}</span>
              {eventosDia.length > 0 && (
                <div className="eventos-admin-dots">
                  {eventosDia.slice(0, 3).map((ev) => (
                    <span key={ev.id} className={`eventos-admin-dot eventos-admin-dot--${ev.color}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <section className="dashboard-section">
        <div className="eventos-admin-lista-header">
          <h2 className="section-heading">{tituloLista}</h2>
          {diaSeleccionado && (
            <button type="button" className="eventos-admin-btn-limpiar" onClick={() => setDiaSeleccionado(null)}>
              Ver todo el mes
            </button>
          )}
        </div>

      {cargando ? (
        <p className="eventos-admin-vacio">Cargando Eventos...</p>
        ): listaAMostrar.length === 0 ? (
        <p className="eventos-admin-vacio">No hay eventos para mostrar acá.</p>
        ) : (
          <div className="eventos-admin-lista">
            {listaAMostrar.map((ev) => (
              <div key={ev.id} className="eventos-admin-item">
                <span className={`eventos-admin-item-color eventos-admin-item-color--${ev.color}`} />
                <div className="eventos-admin-item-info">
                  <span className="eventos-admin-item-fecha">
                    {ev.fecha.split("-").reverse().join("/")} {ev.hora && `· ${ev.hora}`}
                  </span>
                  <span className="eventos-admin-item-titulo">{ev.titulo}</span>
                  {ev.lugar && <span className="eventos-admin-item-lugar">📍 {ev.lugar}</span>}
                </div>
                <button
                  type="button"
                  className="eventos-admin-btn-editar"
                  onClick={() => abrirEdicion(ev)}
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <EventoFormModal
        abierto={modalAbierto}
        fechaInicial={diaSeleccionado ?? hoyISO}
        evento={eventoEditando}
        onClose={() => setModalAbierto(false)}
        onGuardar={handleGuardar}
        onEliminar={handleEliminar}
      />
    </>
  );
}

