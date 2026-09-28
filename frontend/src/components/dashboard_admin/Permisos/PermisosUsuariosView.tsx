import {useState, useEffect} from 'react';


interface RepUsuario{
    id: number;
    nombre?: string;
    name?: string;     
    apellido: string; 
    ast_name?: string;
    email: string;
    estado?: number | string;
    status?: number | string;
    rol?: number;
    role?: number;
}

export function PermisosUsuariosView(){
    const [usuarios, setUsuarios]= useState <RepUsuario[]>([]);
    const [busqueda, setBusqueda]= useState <string>("");
    const [cargando, setCargando]= useState <boolean>(true);
    const [error, setError]= useState <string|null>(null);
    const [mensajeExito, setMensajeExito] = useState <string|null>(null);

//obtener representantes
const obtenerUsuarios= async() =>{
    setCargando(true);
    setError(null);

    try{
        const token= localStorage.getItem("authToken") || localStorage.getItem("access_token");

        const response= await fetch ("http://localhost:8000/api/v1/users/", {
            headers:{
                Authorization: `Bearer ${token}`,
            },
        });

        if(response.ok){
            const data: RepUsuario[]= await response.json();
            setUsuarios(data);
        } else{
            const errorData= await response.json();
            setError(errorData.detail||"error al obtener datos");
        }
    } catch(err){
        console.error("error de conexion", err);
        setError("No se puede encontrar datos");
    } finally{
        setCargando(false);
    }
};

useEffect(() =>{
    obtenerUsuarios();
},[]);

//cambiar permisos
const cambiarRol= async (idUsuario: number, rolActual: boolean) =>{
    const nuevoRol= rolActual? 0:1;
    const accionTexto= rolActual? "Quitar permiso administrador" : "Otorgar permiso administrador";


if (!window.confirm(`¿Confirma que desea ${accionTexto} a este usuario?`)){
    return ("Rol modificado");
    }

try {
    const token= localStorage.getItem("authToken") || localStorage.getItem("access_token");

    const response= await fetch(`http://localhost:8000/api/v1/users/${idUsuario}/rol/`,{
        method: 'PATCH',
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({role: nuevoRol}),
    });

    if (response.ok){
        setUsuarios((prev)=>
            prev.map((u)=> (u.id===idUsuario ? {...u, role: nuevoRol}: u))
    );

    setMensajeExito ("Permisos actualzados");
    setTimeout(() => setMensajeExito(null), 3500);
    
    } else {
        const errData= await response.json();
        alert(errData.detail || "No se modificaron los permisos.");
    }
}  catch(err){
    console.error("error al actualizar", err);
    alert("Error al intentar actualizar el rol")
}
}
//búsqueda
const filtroUsuarios= usuarios.filter((usuario) => {
    const termino= busqueda.toLowerCase().trim();
    const nombreCompleto=  `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.toLocaleLowerCase();
    const mail= ( usuario.email ?? "").toLocaleLowerCase();

    return(
        nombreCompleto.includes(termino) || mail.includes(termino)
    );
});

//lo que muestra en pantall
return (
    <div style={{padding: "1.5rem"}}>
        <h1 className="dashboard-heading">Gestión de permisos de usuarios</h1>
        <p style={{color:"#64748b", marginBottom: "1.5rem"}}>Administración de roles</p>

{/*barra de búsqueda */}
        <div style={{marginBottom: "1.5rem", maxWidth: "500px"}}>
            <input type="text"
            placeholder='Buscar por nombre, apellido o mail' 
            value={busqueda}
            onChange={(e)=> setBusqueda(e.target.value)}
            style={{
                width:"100%",
                padding:"0.75rem 1rem",
                borderRadius:"8px",
                border:"1px solid #cbd5e1",
                fontSize:"0.95rem",
                outline:"none",
            }}
            />
        </div>

        {mensajeExito &&(
            <div style={{padding: "0.75rem 1rem", backgroundColor:"#dcfce7", color:"#166534", borderRadius:"8px", marginBottom:"1rem"}}>
                {mensajeExito}
            </div>
        )}

        {error &&(
            <div style={{padding: "0.75rem 1rem", backgroundColor:"#fee2e2", color:"#991b1b", borderRadius:"8px", marginBottom:"1rem"}}>
                {error}
            </div>
        )}

{/*vista usuarios */}
    {cargando? (
        <p style={{color: "#64748b"}}>Cargando usuarios</p>
    ) : filtroUsuarios.length===0?(
        <p style={{color:"#64748b"}}> No se encoontraron representantes</p>
    ) : (
        <div style={{overflowX:"auto",backgroundColor: "#ffffff", borderRadius:"10px", boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
            <table style={{width:"100%", borderCollapse:"collapse", textAlign:"left"}}>
                <thead>
                    <tr style={{backgroundColor:"#f8fafc", borderBottom:"1px solid #e2e8f0"}}>
                        <th style={{padding:"1rem"}}>Nombre</th>
                        <th style={{padding:"1rem"}}>Apellido</th>
                        <th style={{padding:"1rem"}}>Email</th>
                        <th style={{padding:"1rem"}}>Estado</th>
                        <th style={{padding:"1rem", textAlign:"center"}}>Cambiar rol</th>
                    </tr>
                </thead>
                
                <tbody>
                    {filtroUsuarios.map((usuario)=>{
                        const rolNumero= usuario.rol ?? usuario.rol ?? 0;
                        const esAdmin = rolNumero === 1;

                        const estadoVal= usuario.estado;
                        const estaActivo = estadoVal ===1 || estadoVal === "1" || estadoVal === "activo" || estadoVal === "ACTIVO" || estadoVal === undefined;

                        return(/**estado */
                            <tr key={usuario.id} style={{ borderBottom: "1px solid  #f1f5f9" }}>
                                <td style={{ padding: "1rem", fontWeight: "500" }}>{usuario.nombre || "-"}</td>
                                <td style={{ padding: "1rem", fontWeight: "500" }}>{usuario.apellido || "-"}</td>
                                <td style={{ padding: "1rem", fontWeight: "500" }}>{usuario.email || "-"}</td>

                                <td style={{ padding: "1rem" }}>
                                <span style={{
                                    padding: "0.25rem 0.6rem",
                                    borderRadius: "12px",
                                    fontWeight: "bold",
                                    fontSize: "0.8rem",
                                    backgroundColor: estaActivo ? "#dcfce7" : "#fef3c7",
                                    color: estaActivo ? "#15803d" : "#b45309",
                                }}>
                                    {estaActivo ? "Activo" : "Intactivo"}
                                </span>
                            </td>

                            <td style={{
                                padding: "0.25rem 0.6rem",
                                borderRadius: "12px",
                                fontWeight: "bold",
                                fontSize: "0.8rem",
                                backgroundColor: esAdmin ? "#dbeafe" : "#f1f5f9",
                                color: esAdmin ? "#1d4ed8" : "#475569",
                            }}>
                                {esAdmin ? "Administrador" : "Representante"}
                            </td>

                            {/* Botón Cambiar Rol */}
                            <td style={{ padding: "1rem", textAlign: "center" }}>
                                <button 
                                    onClick={() => cambiarRol(usuario.id, esAdmin)}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "6px",
                                            border: "none",
                                            fontSize: "0.85rem",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            backgroundColor: esAdmin ? "#ef4444" : "#0284c7",
                                            color: "#ffffff",
                                            transition: "background 0.2s",
                                        }}>
                                        {esAdmin ? "Quitar" : "Otorgar"}
                                </button>

                            </td>

                    </tr>    
                    )} 
                    )}
                </tbody>

            </table>

        </div>
    )

}

    </div>
)};
