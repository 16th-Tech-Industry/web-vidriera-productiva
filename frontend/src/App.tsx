import { useState } from 'react';
import './components/Login/login.css';
import { Login } from './components/Login/Login';
import { ForgotPassword } from './components/recuperacion_contrasena/recuperar-contrasena';
import { Registro } from './components/registro_usuario/registrousuario';
import { Dashboard } from './components/dashboard_admin/Dashboard';
import { Mapa } from './components/mapa/mapa';
import { Calendario } from './components/calendario/calendario';
import { CarruselNovedades } from './components/noticias/noticias';

// Definimos las vistas disponibles
type AuthView = 'mapa' |'login' | 'register-user' | 'forgot-password' | 'dashboard-admin';

function App() {
  // Si la ruta en el navegador es /login, arranca en login; si no, en mapa
  const [currentView, setCurrentView] = useState<AuthView>(() => {
    return window.location.pathname === '/login' ? 'login' : 'mapa';
  });
  // Helper para cambiar de vista y actualizar la URL sin recargar
  const navegar = (vista: AuthView, url: string) => {
    setCurrentView(vista);
    window.history.pushState({}, '', url);
  }

  return (
    <main className="app-container">
      {/* 1. Vista Pública Principal: Mapa + Calendario + Noticias */}
      {currentView === 'mapa' && (
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4rem',
            padding: '2rem 1.5rem 5rem 1.5rem',
            boxSizing: 'border-box',
          }}
        >
          {/* Botón de Acceso Institucional / Login */}
          <button
            onClick={() => setCurrentView('login')}
            style={{
              alignSelf: 'flex-end',
              padding: '10px 20px',
              backgroundColor: '#00457F',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 69, 127, 0.3)',
              transition: 'background-color 0.2s ease',
            }}
          >
            🔒 Iniciar Sesión
          </button>

          {/* Sección Mapa */}
          <div style={{ width: '100%' }}>
            <Mapa />
          </div>

          {/* Sección Calendario */}
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Agenda de Eventos
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                Explorá las ferias, exposiciones y congresos provinciales
              </p>
            </div>
            <Calendario />
          </div>

          {/* Sección Novedades / Noticias */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Novedades y Destacados
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                Actualidad del sector productivo provincial
              </p>
            </div>
            <CarruselNovedades />
          </div>
        </div>
      )}
      
      {/* 1. Iniciar Sesión */}
      {currentView === 'login' && (
        <Login
          onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
          onNavigateToRegister={() => setCurrentView('register-user')}
          //Agrega Heyme para iniciar dash después del logueo//
          onLoginSuccess={(data: any) => {console.log('Logueado:', data);
            setCurrentView('dashboard-admin');
          }}
          
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