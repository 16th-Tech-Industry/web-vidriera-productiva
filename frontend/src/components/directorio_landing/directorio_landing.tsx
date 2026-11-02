import './directorio_landing.css';

// El PDF va en frontend/public con este nombre (todavía no está cargado).
const MANUAL_EXPOSITORES_URL = '/manual-expositores.pdf';

interface DirectorioLandingProps {
  onCompletarFormularioClick: () => void;
}

export function DirectorioLanding({ onCompletarFormularioClick }: DirectorioLandingProps) {
  return (
    <section className="directorio-landing">
      <div className="directorio-landing__caja">
        <h2 className="directorio-landing__titulo">Directorio Córdoba Vidriera Productiva</h2>
        <p className="directorio-landing__texto">
          Sume su emprendimiento al directorio oficial y acceda a nuevas oportunidades comerciales y de exhibición.
        </p>
        <div className="directorio-landing__acciones">
          <button
            type="button"
            className="directorio-landing__btn directorio-landing__btn--principal"
            onClick={onCompletarFormularioClick}
          >
            Completar Formulario
          </button>
          <a
            className="directorio-landing__btn directorio-landing__btn--secundario"
            href={MANUAL_EXPOSITORES_URL}
            download
          >
            <span aria-hidden="true">⤓</span> Manual de Expositores
          </a>
        </div>
      </div>
    </section>
  );
}
