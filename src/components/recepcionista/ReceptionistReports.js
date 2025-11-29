import React, { useState, useEffect, useRef } from 'react';
import './ReceptionistReports.css';

const ReceptionistReports = () => {
  const [reports, setReports] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef();

  useEffect(() => {
    fetchReports();
    
    // Actualizar reportes cada 30 segundos
    const interval = setInterval(() => {
      fetchReports();
    }, 30000);
    
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log('=== FETCHING REPORTS ===');
      console.log('API Base:', apiBase);
      console.log('User ID:', user?.id);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('URL:', `${apiBase}/orders/reportes.php?recepcionista_id=${user?.id}`);
      
      const response = await fetch(`${apiBase}/orders/reportes.php?recepcionista_id=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Reports received:', data);
        console.log('Number of reports:', data.length);
        setReports(data);
        setUnreadCount(data.filter(r => !r.leida).length);
      } else {
        const errorText = await response.text();
        console.error('Error fetching reports:', response.status, errorText);
      }
    } catch (e) {
      console.error('Exception fetching reports:', e);
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
        setReports(reports.map(r => r.id === id ? { ...r, leida: 1 } : r));
        setUnreadCount(reports.filter(r => r.id !== id && !r.leida).length);
      }
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  return (
    <div className="receptionist-reports" ref={panelRef}>
      <button className="reports-bell" onClick={() => setOpen(!open)} aria-label="Reportes de pedidos">
        <span role="img" aria-label="Campana">🔔</span>
        {unreadCount > 0 && <span className="reports-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="reports-panel">
          <div className="reports-panel-header">Reportes de Pedidos</div>
          {loading ? (
            <div className="reports-loading">Cargando...</div>
          ) : reports.length === 0 ? (
            <div className="reports-empty">No hay reportes</div>
          ) : (
            <ul className="reports-list">
              {reports.map(rep => (
                <li key={rep.id} className={rep.leida ? 'read' : 'unread'} onClick={() => markAsRead(rep.id)}>
                  <div className="report-type">{rep.tipo}</div>
                  <div className="report-msg">{rep.mensaje}</div>
                  <div className="report-meta">Pedido #{rep.pedido_id} - {rep.usuario_nombre} ({rep.rol})</div>
                  <div className="report-date">{new Date(rep.fecha_reporte).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceptionistReports;
