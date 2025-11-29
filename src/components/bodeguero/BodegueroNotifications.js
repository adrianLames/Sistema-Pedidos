import React, { useState, useEffect, useRef } from 'react';
import './BodegueroNotifications.css';

const BodegueroNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef();

  useEffect(() => {
    fetchNotifications();
    
    // Actualizar notificaciones cada 30 segundos
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    // Cerrar panel al hacer click fuera
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Obtener notificaciones de reportes asignados al bodeguero
      const response = await fetch(`${apiBase}/orders/reportes.php?bodeguero_id=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Error fetching notifications:', response.status);
      }
    } catch (e) {
      console.error('Exception fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiBase}/orders/reportes.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, leida: 1 } : n));
      }
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="bodeguero-notifications" ref={panelRef}>
      <button className="notif-bell" onClick={() => setOpen(!open)} aria-label="Reportes">
        <span role="img" aria-label="Campana">🔔</span>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">Reportes Asignados</div>
          {loading ? (
            <div className="notif-loading">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">No hay reportes pendientes</div>
          ) : (
            <ul className="notif-list">
              {notifications.map(notif => (
                <li 
                  key={notif.id} 
                  className={notif.leida ? 'read' : 'unread'} 
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-type">{notif.tipo}</div>
                  <div className="notif-msg">{notif.mensaje}</div>
                  {notif.numero_pedido && (
                    <div className="notif-pedido">Pedido: {notif.numero_pedido}</div>
                  )}
                  <div className="notif-date">
                    {new Date(notif.fecha_reporte).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BodegueroNotifications;
