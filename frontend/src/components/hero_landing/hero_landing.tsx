import './hero_landing.css';
// Foto: "Soja en Febrero" de Alejo Cristian Santo… (Panoramio), Wikimedia Commons, licencia CC BY-SA 3.0
// https://commons.wikimedia.org/wiki/File:Soja_en_Febrero_-_panoramio.jpg
import fondoHero from '../../assets/hero_campo_verde.jpg';

interface HeroLandingProps {
  onInscripcionClick: () => void;
  onConocerMasClick: () => void;
}

export function HeroLanding({ onInscripcionClick, onConocerMasClick }: HeroLandingProps) {
  return (
    <section className="hero-landing" style={{ backgroundImage: `url(${fondoHero})` }}>
      <div className="hero-landing__contenido">
        <p className="hero-landing__ministerio">Ministerio de Bioagroindustria</p>
        <h1 className="hero-landing__titulo">Córdoba Vidriera Productiva</h1>
        <p className="hero-landing__bajada">
          Apoyando a pequeños y medianos productores del sector agroalimentario y agroindustrial.
        </p>
        <div className="hero-landing__acciones">
          <button className="hero-landing__btn hero-landing__btn--principal" onClick={onInscripcionClick}>
            Inscripción al Programa
          </button>
          <button className="hero-landing__btn hero-landing__btn--secundario" onClick={onConocerMasClick}>
            Conocer Más
          </button>
        </div>
      </div>
    </section>
  );
}
