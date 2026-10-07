import { useState, useRef, useEffect } from "react";
import "./navbar.css";
import ministerioLogo from "../../assets/ministerio+cba.svg";

export interface NavbarProps {
  title: string;
  subtitle: string;
  userName: string;
  userInitials: string;
  onLogout?: () => void;
}

/**
 * Navbar del dashboard.
 * Al hacer click en el usuario (avatar + nombre) se abre un
 * desplegable con la opción de "Cerrar sesión".
 */
export default function Navbar({
  title,
  subtitle,
  userName,
  userInitials,
  onLogout,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cierra el desplegable si se hace click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <header className="navbar">
      <div className="navbar-titles">
        <img src={ministerioLogo} alt="Ministerio de Córdoba" className="navbar-logo" />
        <div className="navbar-titles-text">
          <span className="navbar-title">{title}</span>
          <span className="navbar-subtitle">{subtitle}</span>
        </div>
      </div>

      <div className="navbar-user" ref={menuRef}>
        <button
          type="button"
          className="navbar-user-btn"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <span className="navbar-avatar">{userInitials}</span>
          <span className="navbar-username">{userName}</span>
          <svg
            className={`navbar-chevron ${open ? "is-open" : ""}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div className="navbar-dropdown" role="menu">
            <button
              type="button"
              className="navbar-dropdown-item navbar-logout"
              onClick={handleLogoutClick}
              role="menuitem"
            >
              <svg
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
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}