import "./EventosView.css";

function EventosView() {
  return (
    <main>
    <article className="eventos-view">
      <h1>Proximos Eventos</h1>
      <p>Mira los proximos eventos de prensa y convocatorias.</p>
        <section className="eventos-list">
            <article className="evento-item">
              <img src="https://via.placeholder.com/150" alt="Evento 1" />
              <h2>Evento 1</h2>
              <p>Descripción del evento 1.</p>
            </article>
            <article className="evento-item">
              <img src="https://via.placeholder.com/150" alt="Evento 2" />
              <h2>Evento 2</h2>
              <p>Descripción del evento 2.</p>
            </article>
        </section>
    </article>
    <footer>
      <p>Los eventos estan sujetoa a cambios. Te mantendremos informado.</p>
    </footer>
    </main>
  );
}

export default EventosView;