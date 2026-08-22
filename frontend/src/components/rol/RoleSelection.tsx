import logo from '../../assets/ministerio+cba.svg';
import '../Login/login.css';

interface RoleSelectionProps {
  onSelectUser: () => void;
  onSelectCompany: () => void;
  onBackToLogin: () => void;
}

export function RoleSelection({ onSelectUser, onSelectCompany, onBackToLogin }: RoleSelectionProps) {
  return (
    <div className="login-container">
      <img src={logo} alt="Logo Ministerio de Bioagroindustria" className="login-logo" />

      <h2>¿Cómo deseas registrarte?</h2>
      <p style={{ textAlign: 'center', color: '#e0e7ff', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Selecciona el tipo de cuenta que mejor se adapte a tu actividad
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <button
          type="button"
          onClick={onSelectUser}
          className="btn-submit"
          style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 'bold' }}
        >
          👤 Usuario Particular / Productor
        </button>

        <button
          type="button"
          onClick={onSelectCompany}
          className="btn-submit"
          style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 'bold' }}
        >
          🏢 Empresa / Organización
        </button>
      </div>

      <div className="register-footer" style={{ marginTop: '2rem' }}>
        <span>¿Ya tienes una cuenta? </span>
        <button type="button" className="link-button register-link" onClick={onBackToLogin}>
          Inicia sesión aquí
        </button>
      </div>
    </div>
  );
}