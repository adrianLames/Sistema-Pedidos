import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { useAccessibility, useKeyboardUser } from './utils/accessibility';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notifications from './components/common/Notifications';
import { SkipLink } from './components/common/AccessibleComponents';
import './styles/global.css';
import './App.css';

function ProtectedRoute({ children, ...rest }) {
  const { user } = useAuth();
  return (
    <Route
      {...rest}
      render={({ location }) =>
        user ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}

function AppContent() {
  // Activar características de accesibilidad
  useAccessibility();
  useKeyboardUser();

  useEffect(() => {
    // Anunciar la app ha cargado
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = 'Aplicación cargada correctamente';
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }, []);

  return (
    <div className="App">
      {/* Skip links para navegación rápida */}
      <SkipLink targetId="main-content">Saltar al contenido principal</SkipLink>
      
      <Notifications />
      <Switch>
        <Route path="/login" component={Login} />
        <ProtectedRoute path="/">
          <Dashboard />
        </ProtectedRoute>
        <Redirect to="/" />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;