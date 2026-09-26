import {useState, useEffect} from 'react';

interface RepUsuario{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    estado: number | string;
    rol: number;
}

export function PermisosUsuariosView(){
    const [usuarios, setUsuarios]= useState <RepUsuario[]>([]);
    const [busqueda, setBusqueda]= useState <string>("");
    const [cargando, setCargando]= useState <boolean>(true);
    const [error, setError]= useState <string|null>(null)

//obtener representantes
const obtenerUsuarios= async() =>{
    setCargando(true);
    setError(null);

    try{
        const token= localStorage.getItem("authToken") || localStorage.getItem("access_token");

        const response= await fetch ("http://localhost:8000/api/v1/users/", {
            headers:{
                Autorization: `Bearer ${token}`,
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
},[]);}

//cambiar permisos
