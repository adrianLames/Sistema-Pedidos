import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import AdminNotifications from '../admin/AdminNotifications';
import ReceptionistReports from '../recepcionista/ReceptionistReports';
import BodegueroNotifications from '../bodeguero/BodegueroNotifications';
import AccessibilitySettings from './AccessibilitySettings';

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showAccessibility, setShowAccessibility] = useState(false);

  const getRoleName = (role) => {
    const roles = {
      'admin': 'Administrador',
      'recepcionista': 'Recepcionista',
      'bodeguero': 'Bodeguero'
    };
    return roles[role] || role;
  };

  const handleLogout = () => {
    // Anunciar cierre de sesión
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = 'Sesión cerrada correctamente';
    }
    logout();
  };

  return (
    <header className="header" role="banner">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
          aria-expanded={sidebarOpen}
          aria-controls="navigation"
          type="button"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
        <div className="header-title">
          <h1 id="app-title">Sistema de Pedidos</h1>
          <span className="user-role" aria-label={`Rol actual: ${getRoleName(user?.rol)}`}>
            {getRoleName(user?.rol)}
          </span>
        </div>
      </div>
      <div className="header-right" role="region" aria-label="Información de usuario y acciones">
        {user?.rol === 'admin' && <AdminNotifications />}
        {user?.rol === 'recepcionista' && <ReceptionistReports />}
        {user?.rol === 'bodeguero' && <BodegueroNotifications />}
        
        <div className="accessibility-container">
          <button
            className="accessibility-btn"
            onClick={() => setShowAccessibility(!showAccessibility)}
            aria-label="Configuración de accesibilidad"
            type="button"
            title="Accesibilidad"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12H5M19 12H22M12 2V5M12 19V22M6.34315 6.34315L8.46447 8.46447M15.5355 15.5355L17.6569 17.6569M6.34315 17.6569L8.46447 15.5355M15.5355 8.46447L17.6569 6.34315" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {showAccessibility && (
            <div className="accessibility-dropdown">
              <AccessibilitySettings />
            </div>
          )}
        </div>
        
        <div className="user-info">
          <div className="user-details">
            <span className="user-name">{user?.nombre}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="logout-btn"
            aria-label={`Cerrar sesión de ${user?.nombre}`}
            type="button"
            title="Cerrar sesión"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M17 16L21 12M21 12L17 8M21 12H9M9 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H9" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="sr-only">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;