import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from './components/Login';
import { Mapa } from './components/mapa/mapa';
import { Calendario } from './components/calendario/calendario';
import { CarruselNovedades } from './components/noticias/noticias';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/mapa"
          element={
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
                boxSizing: 'border-box'
              }}
            >
              {/* 1. MAPA */}
              <div style={{ width: '100%' }}>
                <Mapa />
              </div>

              {/* 2. CALENDARIO */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Agenda de Eventos
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                    Explorá las ferias, exposiciones y congresos
                  </p>
                </div>
                <Calendario />
              </div>

              {/* 3. CALESITA / NOVEDADES */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.5rem'
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
          }
        />
      </Routes>
    </Router>
  );
}

export default App;