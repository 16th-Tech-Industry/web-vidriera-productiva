import { useState } from 'react';
import { Login } from './components/Login/Login';
import { ForgotPassword } from './components/recuperacion_contrasena/recuperar-contrasena';

// Definimos las vistas disponibles
type AuthView = 'login' | 'register' | 'forgot-password';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <main className="app-container">
      {currentView === 'login' && (
        <Login
          onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
          onNavigateToRegister={() => setCurrentView('register')}
        />
      )}

      {currentView === 'forgot-password' && (
        <ForgotPassword
          onNavigateToLogin={() => setCurrentView('login')}
        />
      )}

      {currentView === 'register' && (
        <div>
          {/* Aquí irá tu componente Register cuando lo crees */}
          <button onClick={() => setCurrentView('login')}>Volver al Login</button>
        </div>
      )}
    </main>
  );
}

export default App;