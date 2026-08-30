import { useState } from 'react';
import './components/Login/login.css';
import { Login } from './components/Login/Login';
import { ForgotPassword } from './components/recuperacion_contrasena/recuperar-contrasena';
import { Registro } from './components/registro_usuario/registrousuario';
import { Dashboard } from './components/dashboard_admin/Dashboard';

// Definimos las vistas disponibles
type AuthView = 'login' | 'register-user' | 'forgot-password' | 'dashboard-admin';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <main className="app-container">
      {/* 1. Iniciar Sesión */}
      {currentView === 'login' && (
        <Login
          onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
          onNavigateToRegister={() => setCurrentView('register-user')}
          onLoginSuccess={(data: any) => console.log('Logueado:', data)}
        />
      )}

      {/* 2. Formulario de Registro */}
      {currentView === 'register-user' && (
        <Registro
          onNavigateToLogin={() => setCurrentView('login')}
          onRegisterSuccess={(data: any) => {
            console.log('Usuario registrado:', data);
            setCurrentView('login');
          }}
        />
      )}

      {/* 3. Recuperación de Contraseña */}
      {currentView === 'forgot-password' && (
        <ForgotPassword
          onNavigateToLogin={() => setCurrentView('login')}
        />
      )}
      {/* 4. Dashboard Administrador */}
{currentView === 'dashboard-admin' && (
  <Dashboard
    userName="Nombre Real"
    userInitials="NR"
    onLogout={() => setCurrentView('login')}
  />
)}
    </main>
  );
}

export default App;