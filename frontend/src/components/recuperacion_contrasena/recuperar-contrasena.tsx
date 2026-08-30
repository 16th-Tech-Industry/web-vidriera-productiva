import { useState, type FormEvent } from 'react';
import logo from '../../assets/ministerio+cba.svg';
import './recuperar-contrasena.css';

interface ForgotPasswordProps {
  onNavigateToLogin?: () => void;
}

export function ForgotPassword({ onNavigateToLogin }: ForgotPasswordProps) {
  const [step, setStep] = useState<'email' | 'reset'>('email');

  // Campos del formulario
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Control de estados
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = newPassword.length >= 8;
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Paso 1: Pedir token de recuperación
  const handleRequestToken = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !isEmailValid) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Error al procesar la solicitud.');
        return;
      }

      setStep('reset');
    } catch {
      setError('No se pudo conectar con el servidor backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Restablecer contraseña con el token
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Debes ingresar el token de recuperación recibido.');
      return;
    }

    if (!isPasswordValid) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'El token es inválido o ha expirado.');
        return;
      }

      setSuccessMessage('¡Contraseña actualizada correctamente!');
    } catch {
      setError('No se pudo conectar con el servidor backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo Ministerio de Bioagroindustria" className="login-logo" />

      <h2>Recuperar Contraseña</h2>

      {successMessage ? (
        <div className="form-feedback-container">
          <div className="alert-success">{successMessage}</div>
          <button type="button" className="btn-submit" onClick={onNavigateToLogin}>
            Iniciar sesión
          </button>
        </div>
      ) : step === 'email' ? (
        <>
          <p className="forgot-description">
            Ingresa tu correo electrónico registrado para generar el token de recuperación.
          </p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleRequestToken} noValidate>
            <div className="form-group">
              <label htmlFor="recovery-email">Correo electrónico</label>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="ej. usuario@correo.com"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'Generando...' : 'Continuar'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="forgot-description">
            Ingresa el token recibido (mira la consola de FastAPI) y tu nueva contraseña.
          </p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleResetPassword} noValidate>
            <div className="form-group">
              <label htmlFor="token">Token de recuperación</label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input-field"
                placeholder="Pega el token aquí"
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar contraseña</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={confirmPassword ? (doPasswordsMatch ? 'input-field input-success' : 'input-field input-error') : 'input-field'}
                placeholder="Repite la contraseña"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
            </button>
          </form>
        </>
      )}

      <div className="register-footer" style={{ marginTop: '1.5rem' }}>
        <span>¿Recordaste tu clave? </span>
        <button type="button" className="link-button register-link" onClick={onNavigateToLogin}>
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}