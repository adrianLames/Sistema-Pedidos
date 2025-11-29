import React, { useEffect, useRef } from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { trapFocus, announceToScreenReader } from '../../utils/accessibility';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, location }) => {
  const { user } = useAuth();
  const sidebarRef = useRef(null);

  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/usuarios', label: 'Gestión de Usuarios', icon: '👥' },
    { path: '/admin/productos', label: 'Gestión de Productos', icon: '📦' }
  ];

  const recepcionistaMenu = [
    { path: '/recepcionista/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/recepcionista/crear-pedido', label: 'Crear Pedido', icon: '➕' },
    { path: '/recepcionista/pedidos', label: 'Ver Pedidos', icon: '📋' },
    { path: '/recepcionista/reportes', label: 'Reportes', icon: '📈' }
  ];

  const bodegueroMenu = [
    { path: '/bodeguero/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/bodeguero/pedidos', label: 'Procesar Pedidos', icon: '🚚' },
    { path: '/bodeguero/alertas', label: 'Alertas de Stock', icon: '⚠️' }
  ];

  const getMenuItems = () => {
    switch (user?.rol) {
      case 'admin': return adminMenu;
      case 'recepcionista': return recepcionistaMenu;
      case 'bodeguero': return bodegueroMenu;
      default: return [];
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Trap focus cuando el sidebar está abierto
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const removeTrap = trapFocus(sidebarRef.current);
      announceToScreenReader('Menú lateral abierto', 'polite');
      
      return () => {
        removeTrap();
        announceToScreenReader('Menú lateral cerrado', 'polite');
      };
    }
  }, [isOpen]);

  // Manejar tecla Escape para cerrar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleLinkClick = (label) => {
    announceToScreenReader(`Navegando a ${label}`, 'polite');
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside 
        ref={sidebarRef}
        id="navigation"
        className={`sidebar ${isOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Menú de navegación principal"
        aria-hidden={!isOpen}
      >
        <nav className="sidebar-nav">
          <div className="sidebar-header">
            <h2 id="sidebar-title">Menú Principal</h2>
            <button
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Cerrar menú lateral"
              type="button"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          
          <ul 
            className="sidebar-menu" 
            role="list"
            aria-labelledby="sidebar-title"
          >
            {menuItems.map((item) => (
              <li key={item.path} role="listitem">
                <NavLink
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => handleLinkClick(item.label)}
                  activeClassName="active"
                  aria-label={item.label}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <span className="sidebar-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          
          <div className="sidebar-footer" role="region" aria-label="Información de usuario">
            <div className="user-card">
              <div 
                className="user-avatar"
                role="img"
                aria-label={`Avatar de ${user?.nombre}`}
              >
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.nombre}</div>
                <div className="user-role">
                  {user?.rol === 'admin' && 'Administrador'}
                  {user?.rol === 'recepcionista' && 'Recepcionista'}
                  {user?.rol === 'bodeguero' && 'Bodeguero'}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default withRouter(Sidebar);