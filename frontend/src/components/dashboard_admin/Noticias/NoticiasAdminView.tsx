import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  crearNoticia,
  editarNoticia,
  eliminarNoticia,
  listarNoticias,
  type Noticia,
} from "../../../api/noticias";
import "./noticiasAdmin.css";

/**
 * Vista "Noticias" del Dashboard Administrador.
 *
 * Publica, edita y elimina noticias contra /api/v1/noticias (ver
 * src/api/noticias.ts); lo que se publica acá aparece en el carrusel
 * de novedades de la landing.
 *
 * El editor de cuerpo usa contentEditable + document.execCommand
 * como base simple para negrita/cursiva/alineación/imagen/link, sin
 * agregar una librería externa de rich text. Es una primera versión
 * funcional; si más adelante hace falta algo más robusto (undo/redo
 * prolijo, pegado limpio desde Word, etc.) conviene migrar a una
 * librería como TipTap o Slate.
 */
export function NoticiasAdminView() {
  const [titulo, setTitulo] = useState("");
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [errores, setErrores] = useState<{ titulo?: boolean; cuerpo?: boolean }>({});
  const [guardando, setGuardando] = useState(false);

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  // Noticia que se está editando; null = el formulario publica una nueva
  const [editando, setEditando] = useState<Noticia | null>(null);

  const cuerpoRef = useRef<HTMLDivElement>(null);
  const inputImagenRef = useRef<HTMLInputElement>(null);

  const cargarNoticias = () => {
    setCargandoLista(true);
    listarNoticias()
      .then(setNoticias)
      .catch((e: Error) => setMensajeError(`No se pudieron cargar las noticias: ${e.message}`))
      .finally(() => setCargandoLista(false));
  };

  useEffect(cargarNoticias, []);

  const mostrarExito = (mensaje: string) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const limpiarFormulario = () => {
    setTitulo("");
    setImagenArchivo(null);
    setImagenPreview(null);
    setErrores({});
    setEditando(null);
    if (cuerpoRef.current) cuerpoRef.current.innerHTML = "";
    if (inputImagenRef.current) inputImagenRef.current.value = "";
  };

  const handleArchivoImagen = (file: File | undefined) => {
    if (!file) return;
    setImagenArchivo(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleArchivoImagen(e.dataTransfer.files?.[0]);
  };

  const ejecutarComando = (comando: string, valor?: string) => {
    cuerpoRef.current?.focus();
    document.execCommand(comando, false, valor);
  };

  const insertarImagenEnCuerpo = () => {
    const url = window.prompt("Pegá la URL de la imagen a insertar:");
    if (url) ejecutarComando("insertImage", url);
  };

  const insertarLink = () => {
    const url = window.prompt("Pegá el link:");
    if (url) ejecutarComando("createLink", url);
  };

  const handlePublicar = async () => {
    const cuerpoVacio = !cuerpoRef.current?.innerText.trim();
    const tituloVacio = !titulo.trim();
    setErrores({ titulo: tituloVacio, cuerpo: cuerpoVacio });
    setMensajeError(null);
    if (tituloVacio || cuerpoVacio) return;

    const datos = {
      titulo: titulo.trim(),
      cuerpo: cuerpoRef.current?.innerHTML ?? "",
      imagen: imagenArchivo,
    };

    setGuardando(true);
    try {
      if (editando) {
        await editarNoticia(editando.id, datos);
        mostrarExito("✅ Noticia actualizada correctamente.");
      } else {
        await crearNoticia(datos);
        mostrarExito("✅ Noticia publicada correctamente.");
      }
      limpiarFormulario();
      cargarNoticias();
    } catch (e) {
      setMensajeError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (noticia: Noticia) => {
    setEditando(noticia);
    setTitulo(noticia.titulo);
    setImagenArchivo(null);
    setImagenPreview(noticia.imagen_url);
    setErrores({});
    setMensajeError(null);
    if (cuerpoRef.current) cuerpoRef.current.innerHTML = noticia.cuerpo;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (noticia: Noticia) => {
    if (!window.confirm(`¿Eliminar la noticia "${noticia.titulo}"? No se puede deshacer.`)) return;
    setMensajeError(null);
    try {
      await eliminarNoticia(noticia.id);
      if (editando?.id === noticia.id) limpiarFormulario();
      setNoticias((prev) => prev.filter((n) => n.id !== noticia.id));
      mostrarExito("🗑️ Noticia eliminada.");
    } catch (e) {
      setMensajeError((e as Error).message);
    }
  };

  return (
    <>
      <div className="noticias-admin-header">
        <h1 className="dashboard-heading">Gestión de Noticias</h1>
        <div className="noticias-admin-acciones">
          {editando && (
            <button type="button" className="noticias-admin-cancelar" onClick={limpiarFormulario} disabled={guardando}>
              Cancelar edición
            </button>
          )}
          <button type="button" className="noticias-admin-publicar" onClick={handlePublicar} disabled={guardando}>
            {guardando ? "Guardando..." : editando ? "Guardar Cambios" : "Publicar Noticia"}
          </button>
        </div>
      </div>

      {mensajeExito && <p className="noticias-admin-exito">{mensajeExito}</p>}
      {mensajeError && <p className="noticias-admin-error">{mensajeError}</p>}
      {editando && <p className="noticias-admin-editando">Editando: «{editando.titulo}»</p>}

      <div className="noticias-admin-form">
        <label className="noticias-admin-label">
          Título de la Noticia {errores.titulo && <span className="noticias-admin-req">*</span>}
        </label>
        <input
          type="text"
          className={`noticias-admin-input ${errores.titulo ? "is-error" : ""}`}
          placeholder="Escribí el título de la noticia aquí..."
          value={titulo}
          maxLength={200}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <label className="noticias-admin-label">Imagen de Portada</label>
        <div
          className="noticias-admin-dropzone"
          onClick={() => inputImagenRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {imagenPreview ? (
            <img src={imagenPreview} alt="Portada" className="noticias-admin-preview" />
          ) : (
            <>
              <span>Arrastrá una imagen aquí o hacé click para subir</span>
              <span className="noticias-admin-dropzone-icon" aria-hidden>
                📤
              </span>
            </>
          )}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            ref={inputImagenRef}
            className="noticias-admin-input-file"
            onChange={(e) => handleArchivoImagen(e.target.files?.[0])}
          />
        </div>

        <label className="noticias-admin-label">
          Cuerpo de la Noticia {errores.cuerpo && <span className="noticias-admin-req">*</span>}
        </label>
        <div className={`noticias-admin-editor ${errores.cuerpo ? "is-error" : ""}`}>
          <div className="noticias-admin-toolbar">
            <button type="button" onClick={() => ejecutarComando("bold")} title="Negrita">
              <strong>B</strong>
            </button>
            <button type="button" onClick={() => ejecutarComando("italic")} title="Cursiva">
              <em>I</em>
            </button>
            <button type="button" onClick={insertarImagenEnCuerpo} title="Insertar imagen">
              🖼️
            </button>
            <button type="button" onClick={insertarLink} title="Insertar link">
              🔗
            </button>
            <span className="noticias-admin-toolbar-sep" />
            <button type="button" onClick={() => ejecutarComando("justifyLeft")} title="Alinear izquierda">
              ⇤
            </button>
            <button type="button" onClick={() => ejecutarComando("justifyCenter")} title="Centrar">
              ⇔
            </button>
            <button type="button" onClick={() => ejecutarComando("justifyRight")} title="Alinear derecha">
              ⇥
            </button>
          </div>
          <div
            ref={cuerpoRef}
            className="noticias-admin-editable"
            contentEditable
            data-placeholder="Escribí el contenido de la noticia aquí..."
            suppressContentEditableWarning
          />
        </div>
      </div>

      <section className="noticias-admin-publicadas">
        <h2 className="section-heading">Noticias publicadas</h2>
        {cargandoLista ? (
          <p className="noticias-admin-vacio">Cargando...</p>
        ) : noticias.length === 0 ? (
          <p className="noticias-admin-vacio">Todavía no hay noticias publicadas.</p>
        ) : (
          <ul className="noticias-admin-lista">
            {noticias.map((noticia) => (
              <li key={noticia.id} className="noticias-admin-item">
                {noticia.imagen_url ? (
                  <img src={noticia.imagen_url} alt="" className="noticias-admin-item-imagen" />
                ) : (
                  <div className="noticias-admin-item-imagen" aria-hidden />
                )}
                <div className="noticias-admin-item-texto">
                  <strong>{noticia.titulo}</strong>
                  <span>{new Date(noticia.fecha_creacion).toLocaleDateString("es-AR")}</span>
                </div>
                <button type="button" className="noticias-admin-item-boton" onClick={() => handleEditar(noticia)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="noticias-admin-item-boton is-peligro"
                  onClick={() => handleEliminar(noticia)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
