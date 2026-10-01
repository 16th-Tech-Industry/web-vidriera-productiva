import { useEffect, useState } from "react";
import "./navbar_landing.css";
import logo from '../../assets/ministerio+cba.svg';

interface NavLandingProps {
  label: string;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export function Nav({ label, onLoginClick, onRegisterClick }: NavLandingProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const shouldBeDark = saved === 'dark';
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
    setIsDark(shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setIsDark(!isDark);
  };

  return (
    <nav className="nav">
      <img className="logo" src={logo} alt="Logo" style={{height: 36}} />
      <div className="nav-actions">
        <button className="theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
        <button className="register-btn" onClick={onRegisterClick}>Registro</button>
        <button className="login-btn" onClick={onLoginClick}>{label}</button>
      </div>
    </nav>
  );
}