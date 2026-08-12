import { useState, type FormEvent } from 'react';
import logo from '../../assets/ministerio+cba.svg';
import '../Login/login.css';

interface LoginProps {
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export function Login({ onNavigateToRegister, onNavigateToForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validación de Email
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  
  // Validación de Contraseña (mínimo 8 caracteres)
  const isPasswordValid = password.length >= 8;

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!isEmailValid) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (!isPasswordValid) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setErrors({});

      try {
        // SIMULACIÓN DE CONSULTA AL BACKEND
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (password !== '12345678') {
          setErrors({ general: 'El correo o la contraseña son incorrectos.' });
        } else {
          console.log('Inicio de sesión exitoso');
        }
      } catch {
        setErrors({ general: 'Error al conectar con el servidor.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getInputClass = (field: 'email' | 'password', isValid: boolean) => {
    if (!touched[field]) return 'input-field';
    return isValid ? 'input-field input-success' : 'input-field input-error';
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo Ministerio de Bioagroindustria" className="login-logo" />

      <h2>Iniciar Sesión</h2>

      {errors.general && <div className="alert-error">{errors.general}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            className={getInputClass('email', isEmailValid)}
            placeholder="ej. usuario@correo.com"
          />
          {touched.email && errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <div className="password-label-wrapper">
            <label htmlFor="password">Contraseña</label>
            {/* Opción "¿Olvidaste tu contraseña?" junto a la etiqueta o debajo */}
            <button
              type="button"
              className="link-button forgot-password-link"
              onClick={onNavigateToForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            className={getInputClass('password', isPasswordValid)}
            placeholder="••••••••"
          />
          {touched.password && errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Continuar'}
        </button>
      </form>

      {/* Opción para Registrarse */}
      <div className="register-footer">
        <span>¿No tienes una cuenta? </span>
        <button
          type="button"
          className="link-button register-link"
          onClick={onNavigateToRegister}
        >
          Regístrate aquí
        </button>
      </div>
    </div>
  );
}