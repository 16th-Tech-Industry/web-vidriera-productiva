import "./registro.css";


export const Registro= () => {
  return (
    <section className="registro">
      <img src="./public/Ministerio-Agroindustria-Registro.jpeg" alt="Registro"/>
      <h1>Registro</h1>
      <h3>Nombre de la empresa</h3>
      <input type="email" />
      <h3>Numero de telefono</h3>
      <input type="text" />
      <h3>Razon social</h3>
      <input type="text" />
      <button>Registrarse</button>
      
    </section>
  )
}
