import { useState } from 'react';
import './components/Login/login.css';
import { Login } from './components/Login/Login';
import { ForgotPassword } from './components/recuperacion_contrasena/recuperar-contrasena';
import { Registro } from './components/registro_usuario/registrousuario';
import { Dashboard } from './components/dashboard_admin/Dashboard';
import { Mapa } from './components/mapa/mapa';
import { Calendario } from './components/calendario/calendario';
import {Nav, Footer } from './components';
import { CarruselNovedades } from './components/noticias/noticias';
import {EventosView} from './components/dash_usuario/EventosView'; 

// Importación de las vistas de usuario
import EmpresaView from './components/dash_usuario/EmpresaView';
import ProductosView from './components/dash_usuario/ProductosView';

// Definimos las vistas disponibles agregando 'dashboard-usuario'
type AuthView = 'mapa' | 'login' | 'register-user' | 'forgot-password' | 'dashboard-admin' | 'dashboard-usuario' | 'eventos'; 

function App() {
  // Si la ruta en el navegador es /login, arranca en login; si no, en mapa
  const [currentView, setCurrentView] = useState<AuthView>(() => {
    return window.location.pathname === '/login' ? 'login' : 'mapa';
  });

  // Estado interno para saber qué pestaña está activa dentro del Dashboard de Usuario
  const [vistaUsuario, setVistaUsuario] = useState<'empresa' | 'productos'>('empresa');
  
  // Estado para guardar el nombre del usuario logueado
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');

  // Helper para cambiar de vista y actualizar la URL sin recargar
  const navegar = (vista: AuthView, url: string) => {
    setCurrentView(vista);
    window.history.pushState({}, '', url);
  };

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
          {/* Navbar / Botón de Acceso Institucional / Login */}
          <nav>
            <Nav label="🔒 Iniciar Sesión" onLoginClick={() => setCurrentView('login')} />
          </nav>
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
          <footer><Footer /></footer>
        </div>
      
      )}
      
      
      {/* 1. Iniciar Sesión */}
      {currentView === 'login' && (
        <Login
          onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
          onNavigateToRegister={() => setCurrentView('register-user')}
          onNavigateToHome={() => navegar('mapa', '/')}
          onLoginSuccess={(data: any) => {
            console.log('--- DATOS QUE DEVUELVE EL LOGIN ---', data);

            // Extraemos el email y el nombre de manera flexible
            const email = data?.user?.email || data?.email || '';
            let nombre = data?.user?.name || data?.nombre;

            // Si es la cuenta de prueba de Don Campo o cualquier otra, adaptamos el saludo
            if (email === 'doncampo@gmail.com') {
              nombre = 'Franco'; 
            } else if (!nombre && email) {
              const partesEmail = email.split('@')[0];
              nombre = partesEmail.charAt(0).toUpperCase() + partesEmail.slice(1);
            }

            setNombreUsuario(nombre || 'Usuario');

            const rolUsuario = data?.user?.role ?? data?.role;
            const emailUsuario = email;

            if (rolUsuario === 1 || emailUsuario === 'admin@admin.com') {
              setCurrentView('dashboard-admin');
            } else {
              setCurrentView('dashboard-usuario');
            }
          }}
        />
      )}

      {/* 3. Formulario de Registro */}
      {currentView === 'register-user' && (
        <Registro
          onNavigateToLogin={() => setCurrentView('login')}
          onRegisterSuccess={(data: any) => {
            console.log('Usuario registrado:', data);
            setCurrentView('login');
          }}
        />
      )}

      {/* 4. Recuperación de Contraseña */}
      {currentView === 'forgot-password' && (
        <ForgotPassword
          onNavigateToLogin={() => setCurrentView('login')}
        />
      )}

      {/* 5. Dashboard Administrador */}
      {currentView === 'dashboard-admin' && (
        <Dashboard
          userName="Nombre Real"
          userInitials="NR"
          onLogout={() => setCurrentView('login')}
        />
      )}

      {/* 6. Dashboard Usuario / PyME (Formato original exacto) */}
      {currentView === 'dashboard-usuario' && (
        <div className="dashboard-layout">
          
          {/* Sidebar lateral del Usuario con el saludo personalizado */}
          <aside style={{ width: '260px', backgroundColor: 'var(--sidebar-bg)', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#fff', color: 'var(--text-dark)', fontWeight: '900', padding: '8px 10px', borderRadius: '8px', fontSize: '1.1rem' }}>CBA</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '0.5px' }}>VIDRIERA PRODUCTIVA</h3>
              </div>
            </div>

            {/* Saludo personalizado */}
            <div style={{ padding: '15px 20px 0 20px' }}>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Hola,</p>
              <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: '2px 0 0 0' }}>{nombreUsuario}</p>
            </div>

            <nav style={{ padding: '15px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '10px', marginBottom: '5px' }}>Menú PyME</p>
              
              <button 
                onClick={() => setVistaUsuario('empresa')}
                style={{ 
                  background: vistaUsuario === 'empresa' ? '#1E3A8A' : 'transparent', 
                  color: '#fff', border: 'none', padding: '12px 15px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', 
                  fontWeight: vistaUsuario === 'empresa' ? '600' : '400', display: 'flex', alignItems: 'center', gap: '10px', width: '100%'
                }}
              >
                🏢 Mi Empresa
              </button>

              <button 
                onClick={() => setVistaUsuario('productos')}
                style={{ 
                  background: vistaUsuario === 'productos' ? '#1E3A8A' : 'transparent', 
                  color: '#fff', border: 'none', padding: '12px 15px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', 
                  fontWeight: vistaUsuario === 'productos' ? '600' : '400', display: 'flex', alignItems: 'center', gap: '10px', width: '100%'
                }}
              >
                🍯 Productos
              </button>
            </nav>

            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                onClick={() => setCurrentView('login')}
                style={{ width: '100%', background: 'var(--accent-red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cerrar Sesión
              </button>
            </div>
          </aside>

          {/* Contenido Principal */}
          <div className="dashboard-main">
            <header style={{ background: 'var(--topbar-bg)', padding: '15px 32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '14px' }}>
              <span>MINISTERIO DE BIOAGROINDUSTRIA — <strong>PANEL DE GESTIÓN PYME</strong></span>
            </header>

            <div className="dashboard-content">
              {vistaUsuario === 'empresa' && <EmpresaView />}
              {vistaUsuario === 'productos' && <ProductosView />}
            </div>
          </div>

        </div>
      )}
    </main>
  );
}

export default App;