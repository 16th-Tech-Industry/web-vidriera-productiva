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
import MisPostulacionesView from './components/dash_usuario/MisPostulacionesView';

type AuthView = 'mapa' | 'login' | 'register-user' | 'forgot-password' | 'dashboard-admin' | 'dashboard-usuario';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('mapa');
  const [vistaUsuario, setVistaUsuario] = useState<'empresa' | 'productos' | 'eventos' | 'mis-postulaciones'>('empresa');
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [isDark, setIsDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const sidebarUsuarioBg = isDark? '#1a365d' : '#12395e';
  const logo = "/CbaProdLOGO.ico";
  const headerBg = isDark? '#1e293b' : '#f1f5f9';
  const headerColor = isDark? '#fff' : '#12395e';
  const contentBg = isDark? '#0f172a' : '#ffffff';
  const activeBtnBg = isDark? '#1E3A8A' : '#1e4a7a';

  return (
    <main className="app-container">
      {currentView === 'mapa' && (
        <>
          <Nav label=" Iniciar Sesión" onLoginClick={() => setCurrentView('login')} onRegisterClick={() => setCurrentView('register-user')} />
          <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4rem', padding: '2rem 1.5rem 5rem 1.5rem', boxSizing: 'border-box' }}>
            <div style={{ width: '100%' }}><Mapa /></div>
            <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
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
          <aside style={{ width: sidebarCollapsed? '72px' : '260px', backgroundColor: sidebarUsuarioBg, color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.25s ease' }}>
            <div style={{ padding: '0 16px', height: '64px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid rgba(255,255,255,0.15)`, boxSizing: 'border-box', justifyContent: sidebarCollapsed? 'center' : 'flex-start' }}>
              <img src={logo} alt="Logo CBA" style={{ height: '40px', width: '40px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '2px' }} />
              {!sidebarCollapsed && <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>CBA | Vidriera</h3>}
            </div>

            {!sidebarCollapsed && (
              <div style={{ padding: '15px 20px 0 20px' }}>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Hola,</p>
                <p style={{ fontWeight: 'bold', margin: '2px 0 0 0', color: '#fff' }}>{nombreUsuario}</p>
              </div>
            )}

            <nav style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <button onClick={() => setVistaUsuario('empresa')} title="Mi Empresa" style={{ background: vistaUsuario === 'empresa'? activeBtnBg : 'transparent', color: '#fff', border: 'none', padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: sidebarCollapsed? 'center' : 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14H3z"/><path d="M9 10h6M9 14h6M9 18h6"/></svg>
                {!sidebarCollapsed && 'Mi Empresa'}
              </button>

              <button onClick={() => setVistaUsuario('productos')} title="Productos" style={{ background: vistaUsuario === 'productos'? activeBtnBg : 'transparent', color: '#fff', border: 'none', padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: sidebarCollapsed? 'center' : 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>
                {!sidebarCollapsed && 'Productos'}
              </button>

              <button onClick={() => setVistaUsuario('eventos')} title="Eventos" style={{ background: vistaUsuario === 'eventos'? activeBtnBg : 'transparent', color: '#fff', border: 'none', padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: sidebarCollapsed? 'center' : 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {!sidebarCollapsed && 'Eventos'}
              </button>

              <button onClick={() => setVistaUsuario('mis-postulaciones')} title="Mis Postulaciones" style={{ background: vistaUsuario === 'mis-postulaciones'? activeBtnBg : 'transparent', color: '#fff', border: 'none', padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: sidebarCollapsed? 'center' : 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M5 5a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-14z"/><path d="M3 7l18 0"/></svg>
                {!sidebarCollapsed && 'Mis Postulaciones'}
              </button>
            </nav>

            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sidebarCollapsed? '>' : '<'}
              </button>
              <button onClick={handleLogout} style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: sidebarCollapsed? '0.7rem' : '0.9rem' }}>
                {sidebarCollapsed? '↪' : 'Cerrar Sesión'}
              </button>
            </div>
          </aside>

          <div className="dashboard-main" style={{ flex: 1, background: contentBg, display: 'flex', flexDirection: 'column' }}>
            <header style={{ background: headerBg, height: '54px', padding: '0 32px', display: 'flex', alignItems: 'center', color: headerColor, borderBottom: `1px solid ${isDark? '#334155' : '#e2e8f0'}`, fontSize: '0.85rem', boxSizing: 'border-box' }}>
              <span>Ministerio de BioAgroIndustria - <strong>Panel de Gestión de PyMEs</strong></span>
            </header>
            <div className="dashboard-content" style={{ background: contentBg, flex: 1, padding: '24px 32px' }}>
              {vistaUsuario === 'empresa' && <EmpresaView />}
              {vistaUsuario === 'productos' && <ProductosView />}
              {vistaUsuario === 'eventos' && <EventosView />}
              {vistaUsuario === 'mis-postulaciones' && <MisPostulacionesView />}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;