import { useRef, useState } from "react";
import type { DragEvent } from "react";
import "./noticiasAdmin.css";

/**
 * Vista "Noticias" del Dashboard Administrador.
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
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [publicado, setPublicado] = useState(false);
  const [errores, setErrores] = useState<{ titulo?: boolean; cuerpo?: boolean }>({});
  const [archivoImagen, setArchivoImagen]= useState<File | null>(null);

  const cuerpoRef = useRef<HTMLDivElement>(null);
  const inputImagenRef = useRef<HTMLInputElement>(null);

  const handleArchivoImagen = (file: File | undefined) => {
    if (!file) return;
    setArchivoImagen(file); //guardar
    const url = URL.createObjectURL(file);
    setImagenPreview(url);
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
////////////////////////////////////////////////////////
  const handlePublicar = async () => {
    const cuerpoVacio = !cuerpoRef.current?.innerText.trim();
    const tituloVacio = !titulo.trim();
    setErrores({ titulo: tituloVacio, cuerpo: cuerpoVacio });
    if (tituloVacio || cuerpoVacio) return;

/*const formData = new FormData();
formData.append("titulo", titulo);
formData.append("cuerpo", cuerpoRef.current?.innerHTML ?? "");

if (archivoImagen){
  formData.append("imagen", archivoImagen);
}*/

try{//endpoint
  const formData= new FormData();
  formData.append("titulo",titulo);
  formData.append("cuerpo", cuerpoRef.current?.innerHTML ??"");
  if(archivoImagen){
    formData.append("imagen",archivoImagen);
  }

  const token = localStorage.getItem("authToken");
  console.log("Token exacto enviado:", token);
  if (!token) {
      console.error("No se encontró el token de autenticación (authToken). Inicia sesión de nuevo.");
      return;
    }

  const response = await fetch("http://localhost:8000/api/v1/noticias/", {
    method:"POST",
    headers:{
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.ok){
    const noticiaCreada= await response.json();
    console.log("Creacion ok", noticiaCreada);

    setPublicado(true);
    setTitulo("");

    if(cuerpoRef.current) cuerpoRef.current.innerHTML="";
    setImagenPreview(null);
    setArchivoImagen(null);
    setTimeout(() => setPublicado(false), 3000);
  } else{
    const errorData= await response.json();
    console.error("eeror al guardar", errorData);
    }
} catch(error){
  console.error("error ered")
}
};

    // TODO: conectar con el backend, ej. POST /noticias
   /* const noticia = {
      titulo,
      imagen: imagenPreview,
      cuerpoHtml: cuerpoRef.current?.innerHTML ?? "",
    };
    console.log("Publicar noticia:", noticia);

    setPublicado(true);
    setTimeout(() => setPublicado(false), 3000);
  };*/
/////////////////////////////////////////////////////////
  return (
    <>
      <div className="noticias-admin-header">
        <h1 className="dashboard-heading">Gestión de Noticias</h1>
        <button type="button" className="noticias-admin-publicar" onClick={handlePublicar}>
          Publicar Noticia
        </button>
      </div>

      {publicado && <p className="noticias-admin-exito">✅ Noticia publicada correctamente.</p>}

      <div className="noticias-admin-form">
        <label className="noticias-admin-label">
          Título de la Noticia {errores.titulo && <span className="noticias-admin-req">*</span>}
        </label>
        <input
          type="text"
          maxLength={200}
          className={`noticias-admin-input ${errores.titulo ? "is-error" : ""}`}
          placeholder="Escribí el título de la noticia aquí..."
          value={titulo}
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
            accept="image/*"
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
    </>
  );
}
