import { useEffect, useState } from "react";
import type { ColorEvento, Evento } from "./eventos.types";

export interface EventoFormModalProps {
  abierto: boolean;
  fechaInicial?: string;
  evento?: Evento | null;
  onClose: () => void;
  onGuardar: (evento: Omit<Evento, "id"> & { id?: string }) => void;
  onEliminar?: (id: string) => void;
}

const COLORES: { value: ColorEvento; label: string }[] = [
  { value: "blue", label: "Feria / Exposición" },
  { value: "green", label: "Taller / Capacitación" },
  { value: "amber", label: "Networking / Otro" },
];

const vacio = { fecha: "", titulo: "", descripcion: "", hora: "", lugar: "", color: "blue" as ColorEvento };

export default function EventoFormModal({
  abierto,
  fechaInicial,
  evento,
  onClose,
  onGuardar,
  onEliminar,
}: EventoFormModalProps) {
  const [form, setForm] = useState(vacio);
  const [errorTitulo, setErrorTitulo] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    if (evento) {
      setForm({
        fecha: evento.fecha,
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        hora: evento.hora ?? "",
        lugar: evento.lugar ?? "",
        color: evento.color,
      });
    } else {
      setForm({ ...vacio, fecha: fechaInicial ?? vacio.fecha });
    }
    setErrorTitulo(false);
  }, [abierto, evento, fechaInicial]);

  if (!abierto) return null;

  const handleGuardar = () => {
    if (!form.titulo.trim() || !form.fecha) {
      setErrorTitulo(true);
      return;
    }
    onGuardar({ id: evento?.id, ...form });
  };

  return (
    <div className="evento-modal-overlay" onClick={onClose}>
      <div className="evento-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="evento-modal-titulo">{evento ? "Editar evento" : "Agregar evento"}</h2>

        <label className="evento-form-label">
          Título {errorTitulo && <span className="evento-form-req">*</span>}
        </label>
        <input
          type="text"
          className={`evento-form-input ${errorTitulo ? "is-error" : ""}`}
          value={form.titulo}
          onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
          placeholder="Ej: Gran Feria Agrícola"
        />

        <div className="evento-form-row">
          <div className="evento-form-col">
            <label className="evento-form-label">Fecha</label>
            <input
              type="date"
              className="evento-form-input"
              value={form.fecha}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
            />
          </div>
          <div className="evento-form-col">
            <label className="evento-form-label">Horario</label>
            <input
              type="text"
              className="evento-form-input"
              placeholder="09:00 - 18:00"
              value={form.hora}
              onChange={(e) => setForm((prev) => ({ ...prev, hora: e.target.value }))}
            />
          </div>
        </div>

        <label className="evento-form-label">Lugar</label>
        <input
          type="text"
          className="evento-form-input"
          value={form.lugar}
          onChange={(e) => setForm((prev) => ({ ...prev, lugar: e.target.value }))}
          placeholder="Ej: Recinto Feria Central"
        />

        <label className="evento-form-label">Categoría</label>
        <select
          className="evento-form-input"
          value={form.color}
          onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value as ColorEvento }))}
        >
          {COLORES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <label className="evento-form-label">Descripción</label>
        <textarea
          className="evento-form-input evento-form-textarea"
          value={form.descripcion}
          onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
          placeholder="Detalle del evento..."
        />

        <div className="evento-modal-footer">
          {evento && onEliminar && (
            <button
              type="button"
              className="evento-modal-btn evento-modal-btn--eliminar"
              onClick={() => onEliminar(evento.id)}
            >
              Eliminar
            </button>
          )}
          <div className="evento-modal-footer-derecha">
            <button type="button" className="evento-modal-btn evento-modal-btn--cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="evento-modal-btn evento-modal-btn--guardar" onClick={handleGuardar}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
