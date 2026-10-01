import { useState, useEffect } from 'react';
import './App.css';
import './components/Login/login.css';
import { Login } from './components/Login/Login';
import { ForgotPassword } from './components/recuperacion_contrasena/recuperar-contrasena';
import { Registro } from './components/registro_usuario/registrousuario';
import { Dashboard } from './components/dashboard_admin/Dashboard';
import { Mapa } from './components/mapa/mapa';
import { Calendario } from './components/calendario/calendario';
import { Nav, Footer } from './components';
import { CarruselNovedades } from './components/noticias/noticias';
import EventosView from './components/dash_usuario/EventosView';
import EmpresaView from './components/dash_usuario/EmpresaView';
import ProductosView from './components/dash_usuario/ProductosView';

type AuthView = 'mapa' | 'login' | 'register-user' | 'forgot-password' | 'dashboard-admin' | 'dashboard-usuario';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('mapa');
  const [vistaUsuario, setVistaUsuario] = useState<'empresa' | 'productos' | 'eventos'>('empresa');
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    setIsDark(saved === 'dark');
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const navegar = (vista: AuthView, url: string) => {
    setCurrentView(vista);
    window.history.pushState({}, '', url);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCurrentView('login');
  };

  const ObtenerDatosIniciales = (nombre: string) => {
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    return (nombre[0] || 'U').toUpperCase();
  };

  // COLORES COMO EN TU FOTO
  const sidebarBg = isDark? '#0f172a' : '#12395e'; // azul oscuro institucional
  const headerBg = isDark? '#1e293b' : '#f1f5f9'; // blanco grisáceo
  const headerColor = isDark? '#fff' : '#12395e';
  const contentBg = isDark? '#0f172a' : '#ffffff';
  const activeBtnBg = isDark? '#1E3A8A' : '#1e4a7a';

  return (
    <main className="app-container">
      {currentView === 'mapa' && (
        <>
          <Nav label="🔒 Iniciar Sesión" onLoginClick={() => setCurrentView('login')} onRegisterClick={() => setCurrentView('register-user')} />
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4rem', padding: '2rem 1.5rem 5rem 1.5rem', boxSizing: 'border-box' }}>
            <div style={{ width: '100%' }}><Mapa /></div>
            <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Agenda de Eventos</h2>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>Explorá las ferias, exposiciones y congresos</p>
              </div>
              <Calendario />
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Novedades y Destacados</h2>
              </div>
              <CarruselNovedades />
            </div>
          </div>
          <Footer />
        </>
      )}

      {currentView === 'login' && (
        <Login
          onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
          onNavigateToRegister={() => setCurrentView('register-user')}
          onNavigateToHome={() => navegar('mapa', '/')}
          onLoginSuccess={(data: any) => {
            const email = data?.user?.email || data?.email || '';
            let nombre = data?.user?.name || data?.nombre;
            if (email === 'doncampo@gmail.com') nombre = 'Franco';
            else if (!nombre && email) {
              const partesEmail = email.split('@')[0];
              nombre = partesEmail.charAt(0).toUpperCase() + partesEmail.slice(1);
            }
            setNombreUsuario(nombre || 'Usuario');
            const rolUsuario = data?.user?.role?? data?.role;
            if (Number(rolUsuario) === 1 || email === 'admin@admin.com') {
              setCurrentView('dashboard-admin');
            } else {
              setCurrentView('dashboard-usuario');
            }
          }}
        />
      )}

      {currentView === 'register-user' && <Registro onNavigateToLogin={() => setCurrentView('login')} onRegisterSuccess={() => setCurrentView('login')} />}
      {currentView === 'forgot-password' && <ForgotPassword onNavigateToLogin={() => setCurrentView('login')} />}
      {currentView === 'dashboard-admin' && <Dashboard userName={nombreUsuario} userInitials={ObtenerDatosIniciales(nombreUsuario)} onLogout={handleLogout} onGoToLanding={() => navegar('mapa', '/')} />}

      {currentView === 'dashboard-usuario' && (
        <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>
          <aside style={{ width: '260px', backgroundColor: sidebarBg, color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '0 20px', height: '54px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${isDark? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}`, boxSizing: 'border-box' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#fff', letterSpacing: '0.5px' }}>CBA | Vidriera Productiva</h3>
            </div>
            <div style={{ padding: '15px 20px 0 20px' }}>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Hola,</p>
              <p style={{ fontWeight: 'bold', margin: '2px 0 0 0', color: '#fff' }}>{nombreUsuario}</p>
            </div>
            <nav style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <button onClick={() => setVistaUsuario('empresa')} style={{ background: vistaUsuario === 'empresa'? activeBtnBg : 'transparent', color: '#fff', border: 'none', padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%' }}>🏢 Mi Empresa</button>
              <button onClick={() => setVistaUsuario('productos')} style={{ background: vistaUsuario === 'productos'? activeBtnBg : 'transparent', color: '#fff', border: 'none', padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%' }}>🍯 Productos</button>
              <button onClick={() => setVistaUsuario('eventos')} style={{ background: vistaUsuario === 'eventos'? activeBtnBg : 'transparent', color: '#fff', border: 'none', padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%' }}>📅 Eventos</button>
            </nav>
            <div style={{ padding: '20px' }}>
              <button onClick={handleLogout} style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Cerrar Sesión</button>
            </div>
          </aside>

          <div className="dashboard-main" style={{ flex: 1, background: contentBg, display: 'flex', flexDirection: 'column' }}>
            <header style={{
              background: headerBg,
              height: '54px',
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              color: headerColor,
              borderBottom: `1px solid ${isDark? '#334155' : '#e2e8f0'}`,
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }}>
              <span>Ministerio de BioAgroIndustria - <strong>Panel de Gestión de PyMEs</strong></span>
            </header>
            <div className="dashboard-content" style={{ background: contentBg, flex: 1, padding: '24px 32px' }}>
              {vistaUsuario === 'empresa' && <EmpresaView />}
              {vistaUsuario === 'productos' && <ProductosView />}
              {vistaUsuario === 'eventos' && <EventosView />}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;