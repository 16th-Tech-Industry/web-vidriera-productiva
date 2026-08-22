import { useState, type FormEvent } from 'react';
import logo from '../../assets/ministerio+cba.svg';
import '../Login/login.css';

interface LoginProps {
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  onLoginSuccess?: (userData: any) => void;
}

export function Login({ 
  onNavigateToRegister, 
  onNavigateToForgotPassword, 
  onLoginSuccess 
}: LoginProps) {
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
        const response = await fetch('http://localhost:8000/api/v1/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.detail || 'El correo o la contraseña son incorrectos.';
          setErrors({ 
            general: typeof errorMsg === 'string' ? errorMsg : 'Datos inválidos proporcionados.' 
          });
          return;
        }

        // Almacenar token o sesión si el backend lo devuelve
        if (data.access_token) {
          localStorage.setItem('authToken', data.access_token);
        }
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }

        console.log('Inicio de sesión exitoso:', data);

        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
      } catch (err) {
        setErrors({ 
          general: 'No se pudo conectar con el servidor backend (verifique si FastAPI está corriendo en el puerto 8000).' 
        });
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
            autoComplete="email"
          />
          {touched.email && errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <div className="password-label-wrapper">
            <label htmlFor="password">Contraseña</label>
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
            autoComplete="current-password"
          />
          {touched.password && errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>

        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Continuar'}
        </button>
      </form>

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