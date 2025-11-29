import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalProductos: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    alertasStock: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      
      console.log('API Base:', apiBase);
      console.log('Token:', token);
      
      const [usersResponse, productsResponse, ordersResponse, alertsResponse] = await Promise.all([
        fetch(`${apiBase}/users/get_all.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBase}/products/get_all.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBase}/orders/get_all.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBase}/products/stock_alert.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('Responses:', {
        users: usersResponse.status,
        products: productsResponse.status,
        orders: ordersResponse.status,
        alerts: alertsResponse.status
      });

      if (!usersResponse.ok) {
        const error = await usersResponse.json();
        throw new Error(`Error en usuarios: ${error.message || usersResponse.statusText}`);
      }
      if (!productsResponse.ok) {
        const error = await productsResponse.json();
        throw new Error(`Error en productos: ${error.message || productsResponse.statusText}`);
      }
      if (!ordersResponse.ok) {
        const error = await ordersResponse.json();
        throw new Error(`Error en pedidos: ${error.message || ordersResponse.statusText}`);
      }
      if (!alertsResponse.ok) {
        const error = await alertsResponse.json();
        throw new Error(`Error en alertas: ${error.message || alertsResponse.statusText}`);
      }

      const usersData = await usersResponse.json();
      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();
      const alertsData = await alertsResponse.json();

      console.log('Data loaded:', {
        users: usersData.length,
        products: productsData.length,
        orders: ordersData.length,
        alerts: alertsData.length
      });

      // Manejar tanto formato de array directo como objeto con propiedad data
      const productsArray = Array.isArray(productsData) ? productsData : (productsData.data || []);
      const usersArray = Array.isArray(usersData) ? usersData : (usersData.data || []);
      const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData.data || []);
      const alertsArray = Array.isArray(alertsData) ? alertsData : (alertsData.data || []);

      setStats({
        totalUsuarios: usersArray.length,
        totalProductos: productsArray.length,
        totalPedidos: ordersArray.length,
        pedidosPendientes: ordersArray.filter(order => order.estado === 'pendiente').length,
        alertasStock: alertsArray.length
      });

      // Simular actividad reciente
      const activity = [
        { type: 'user', message: 'Nuevo usuario registrado: Recepcionista 2', time: 'Hace 5 min' },
        { type: 'order', message: 'Pedido #PED20231215001 creado', time: 'Hace 15 min' },
        { type: 'product', message: 'Producto PROD010 agregado al sistema', time: 'Hace 1 hora' },
        { type: 'alert', message: 'Alerta de stock: Mouse Inalámbrico', time: 'Hace 2 horas' }
      ];
      setRecentActivity(activity);
    } catch (error) {
      console.error('Dashboard error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudieron cargar los datos del dashboard'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard - Administrador</h1>
        <p>Bienvenido/a, {user?.nombre}. Panel de control del sistema.</p>
      </div>

      {/* Estadísticas Principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalUsuarios}</div>
            <div className="stat-label">Total Usuarios</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalProductos}</div>
            <div className="stat-label">Total Productos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalPedidos}</div>
            <div className="stat-label">Total Pedidos</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pedidosPendientes}</div>
            <div className="stat-label">Pedidos Pendientes</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-number">{stats.alertasStock}</div>
            <div className="stat-label">Alertas de Stock</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Acciones Rápidas */}
        <div className="section">
          <h2>Acciones Rápidas</h2>
          <div className="quick-actions-grid">
            <div 
              className="action-card"
              onClick={() => window.location.href = '/admin/usuarios'}
            >
              <div className="action-icon">➕</div>
              <div className="action-title">Gestionar Usuarios</div>
              <div className="action-description">
                Crear, editar y administrar usuarios del sistema
              </div>
            </div>

            <div 
              className="action-card"
              onClick={() => window.location.href = '/admin/productos'}
            >
              <div className="action-icon">📦</div>
              <div className="action-title">Gestionar Productos</div>
              <div className="action-description">
                Administrar catálogo de productos y stock
              </div>
            </div>

            <div 
              className="action-card"
              onClick={() => window.location.href = '/recepcionista/reportes'}
            >
              <div className="action-icon">📊</div>
              <div className="action-title">Ver Reportes</div>
              <div className="action-description">
                Generar reportes y estadísticas del sistema
              </div>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="section">
          <div className="section-header">
            <h2>Actividad Reciente</h2>
            <button className="btn btn-secondary">
              Ver Todo
            </button>
          </div>

          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon activity-${activity.type}`}>
                  {activity.type === 'user' && '👤'}
                  {activity.type === 'order' && '📦'}
                  {activity.type === 'product' && '📋'}
                  {activity.type === 'alert' && '⚠️'}
                </div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado del Sistema */}
        <div className="section">
          <h2>Estado del Sistema</h2>
          <div className="system-status">
            <div className="status-item online">
              <div className="status-indicator"></div>
              <div className="status-info">
                <div className="status-title">Base de Datos</div>
                <div className="status-description">Conectada y operacional</div>
              </div>
            </div>

            <div className="status-item online">
              <div className="status-indicator"></div>
              <div className="status-info">
                <div className="status-title">Servidor API</div>
                <div className="status-description">Respondiendo correctamente</div>
              </div>
            </div>

            <div className="status-item online">
              <div className="status-indicator"></div>
              <div className="status-info">
                <div className="status-title">Aplicación Web</div>
                <div className="status-description">Funcionando normalmente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;