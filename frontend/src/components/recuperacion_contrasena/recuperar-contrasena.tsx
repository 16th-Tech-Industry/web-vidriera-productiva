import { useState, type FormEvent } from 'react';
import logo from '../../assets/ministerio+cba.svg';
import './recuperar-contrasena.css';

interface ForgotPasswordProps {
  onNavigateToLogin?: () => void;
}

export function ForgotPassword({ onNavigateToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleBlur = () => {
    setTouched(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!email.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }

    if (!isEmailValid) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Error al procesar la solicitud.');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError('No se pudo conectar con el servidor backend (FastAPI).');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = () => {
    if (!touched) return 'input-field';
    return isEmailValid ? 'input-field input-success' : 'input-field input-error';
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo Ministerio de Bioagroindustria" className="login-logo" />

      <h2>Recuperar Contraseña</h2>

      {isSubmitted ? (
        <div className="form-feedback-container">
          <div className="alert-success">
            Te hemos enviado un enlace de recuperación a <strong>{email}</strong>.
          </div>
          <button
            type="button"
            className="btn-submit"
            onClick={onNavigateToLogin}
          >
            Volver al inicio
          </button>
        </div>
      ) : (
        <>
          <p className="forgot-description">
            Ingresa tu correo electrónico registrado y te enviaremos instrucciones para restablecer tu contraseña.
          </p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="recovery-email">Correo electrónico</label>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleBlur}
                className={getInputClass()}
                placeholder="ej. usuario@correo.com"
              />
              {touched && error && <span className="error-message">{error}</span>}
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          <div className="register-footer">
            <span>¿Te acordaste de tu clave? </span>
            <button
              type="button"
              className="link-button register-link"
              onClick={onNavigateToLogin}
            >
              Iniciar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}