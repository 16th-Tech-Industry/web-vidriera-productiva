import { useMemo, useState } from "react";
import EventoFormModal from "./EventoFormModal";
import { EVENTOS_MOCK, type Evento } from "./eventos.types";
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
  const [mesActual, setMesActual] = useState(() => new Date(2026, 9, 1)); // Octubre 2026, alineado a los mocks
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS_MOCK);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);

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

  const handleGuardar = (datos: Omit<Evento, "id"> & { id?: string }) => {
    // TODO: conectar con el backend, ej. POST /eventos o PUT /eventos/{id}
    if (datos.id) {
      setEventos((prev) => prev.map((ev) => (ev.id === datos.id ? { ...ev, ...datos, id: ev.id } : ev)));
    } else {
      setEventos((prev) => [...prev, { ...datos, id: crypto.randomUUID() }]);
    }
    setModalAbierto(false);
  };

  const handleEliminar = (id: string) => {
    // TODO: conectar con el backend, ej. DELETE /eventos/{id}
    if (window.confirm("¿Seguro que querés eliminar este evento?")) {
      setEventos((prev) => prev.filter((ev) => ev.id !== id));
      setModalAbierto(false);
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

        {listaAMostrar.length === 0 ? (
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
