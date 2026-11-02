import "./navbar.css";
import ministerioLogo from "../../assets/ministerio+cba.svg";

export interface NavbarProps {
  onLogout?: () => void;
}

// Barra superior del dashboard admin: solo los logos y el cierre de sesión.
export default function Navbar({ onLogout }: NavbarProps) {
  return (
    <header className="navbar">
      <img src={ministerioLogo} alt="Ministerio de Bioagroindustria - Córdoba" className="navbar-logo" />

      <button type="button" className="navbar-logout" onClick={onLogout} aria-label="Cerrar sesión">
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span className="navbar-logout-texto">Cerrar sesión</span>
      </button>
    </header>
  );
}
