import "./navbar_landing.css";
import logo from '../../assets/ministerio+cba.svg';

interface NavLandingProps {
  label: string;
  onLoginClick: () => void;
}

export function Nav({ label, onLoginClick }: NavLandingProps) {
  return (
    <nav className="nav">
      <img className="logo" src={logo} alt="Logo" />
      <button className="login-btn" onClick={onLoginClick}>
        {label}
      </button>
    </nav>
  );
}
