import { useState } from 'react';
import logo from './assets/ministerio+cba.svg';
import './components/Login/login.css';
import { Login } from './components/Login/Login';
import { ForgotPassword } from './components/recuperacion_contrasena/recuperar-contrasena';
import { Registro } from './components/registro_usuario/registrousuario';
import { RegistroEmpresa } from './components/registro_empresa/RegistroEmpresa';

// Definimos las vistas disponibles
type AuthView = 'login' | 'select-role' | 'register-user' | 'register-company' | 'forgot-password';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <main className="app-container">
      {/* 1. Iniciar Sesión */}
      {currentView === 'login' && (
        <Login
          onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
          onNavigateToRegister={() => setCurrentView('select-role')}
          onLoginSuccess={(data: any) => console.log('Logueado:', data)}
        />
      )}

      {/* 2. Selección: Usuario o Empresa */}
      {currentView === 'select-role' && (
        <div className="login-container">
          <img src={logo} alt="Logo Ministerio de Bioagroindustria" className="login-logo" />
          
          <h2>¿Cómo deseas registrarte?</h2>
          <p style={{ textAlign: 'center', color: '#e0e7ff', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Selecciona el tipo de cuenta según tu actividad
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <button
              type="button"
              className="btn-submit"
              style={{ backgroundColor: '#ffffff', color: '#1e3a8a', fontWeight: 'bold' }}
              onClick={() => setCurrentView('register-user')}
            >
              👤 Registro de Usuario
            </button>

            <button
              type="button"
              className="btn-submit"
              style={{ backgroundColor: '#ffffff', color: '#1e3a8a', fontWeight: 'bold' }}
              onClick={() => setCurrentView('register-company')}
            >
              🏢 Registro de Empresa
            </button>
          </div>

          <div className="register-footer" style={{ marginTop: '2rem' }}>
            <span>¿Ya tienes una cuenta? </span>
            <button
              type="button"
              className="link-button register-link"
              onClick={() => setCurrentView('login')}
            >
              Inicia sesión aquí
            </button>
          </div>
        </div>
      )}

      {/* 3. Formulario de Usuario Particular */}
      {currentView === 'register-user' && (
        <Registro
          onNavigateToLogin={() => setCurrentView('select-role')}
          onRegisterSuccess={(data: any) => {
            console.log('Usuario registrado:', data);
            setCurrentView('login');
          }}
        />
      )}

      {/* 4. Formulario de Empresa */}
      {currentView === 'register-company' && (
        <RegistroEmpresa
          onBack={() => setCurrentView('select-role')}
          onSuccess={(data: any) => {
            console.log('Empresa registrada:', data);
            setCurrentView('login');
          }}
        />
      )}

      {/* 5. Recuperación de Contraseña */}
      {currentView === 'forgot-password' && (
        <ForgotPassword
          onNavigateToLogin={() => setCurrentView('login')}
        />
      )}
    </main>
  );
}

export default App;