import { useState, type FormEvent } from 'react';
import logo from '../../assets/ministerio+cba.svg';
import '../Login/login.css';
import '../registro_usuario/registrousuario.css';

interface RegistroProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: (userData: any) => void;
}

export function Registro({ onNavigateToLogin, onRegisterSuccess }: RegistroProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors: { [key: string]: string } = {};

    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!apellido.trim()) newErrors.apellido = 'El apellido es obligatorio.';

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!isEmailValid) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (!isPasswordValid) {
      newErrors.password = 'Debe tener al menos 8 caracteres.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setErrors({});
      setSuccessMessage('');

      try {
        const response = await fetch('http://localhost:8000/api/v1/register/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim(),
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.detail || 'Error al registrar el usuario.';
          setErrors({
            general: typeof errorMsg === 'string' ? errorMsg : 'Datos inválidos.',
          });
          return;
        }

        setSuccessMessage('¡Usuario registrado con éxito!');

        // Muestra el cartel verde por 2.5 segundos antes de avanzar
        setTimeout(() => {
          if (onRegisterSuccess) {
            onRegisterSuccess(data);
          } else if (onNavigateToLogin) {
            onNavigateToLogin();
          }
        }, 2500);
      } catch {
        setErrors({
          general: 'No se pudo conectar con el servidor backend.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getInputClass = (field: string, isValid: boolean) => {
    if (!touched[field]) return 'input-field';
    return isValid ? 'input-field input-success' : 'input-field input-error';
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo Ministerio de Bioagroindustria" className="login-logo" />

      <h2>Registra tu usuario</h2>

      {errors.general && (
        <div
          className="alert-error"
          style={{
            backgroundColor: '#f8d7da',
            color: '#842029',
            border: '1px solid #f5c2c7',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: 500,
            textAlign: 'center',
            margin: '0 auto 1.2rem auto',
            width: 'fit-content',
            display: 'block',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div
          className="alert-success"
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: 500,
            textAlign: 'center',
            margin: '0 auto 1.2rem auto',
            width: 'fit-content',
            display: 'block',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => handleBlur('nombre')}
            className={getInputClass('nombre', nombre.trim().length > 0)}
            placeholder="ej. Jhon"
          />
          {touched.nombre && errors.nombre && (
            <span className="error-message">{errors.nombre}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="apellido">Apellido</label>
          <input
            id="apellido"
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            onBlur={() => handleBlur('apellido')}
            className={getInputClass('apellido', apellido.trim().length > 0)}
            placeholder="ej. Doe"
          />
          {touched.apellido && errors.apellido && (
            <span className="error-message">{errors.apellido}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            className={getInputClass('email', isEmailValid)}
            placeholder="ministerio@minbai.com"
          />
          {touched.email && errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono de contacto (opcional)</label>
          <input
            id="telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            onBlur={() => handleBlur('telefono')}
            className="input-field"
            placeholder="+54 9 999 9999"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            className={getInputClass('password', isPasswordValid)}
            placeholder="••••••••"
          />
          {touched.password && errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            className={getInputClass('confirmPassword', doPasswordsMatch)}
            placeholder="••••••••"
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Continuar'}
        </button>
      </form>

      <div className="register-footer">
        <span>¿Ya tienes una cuenta? </span>
        <button
          type="button"
          className="link-button register-link"
          onClick={onNavigateToLogin}
        >
          Inicia sesión aquí
        </button>
      </div>
    </div>
  );
}