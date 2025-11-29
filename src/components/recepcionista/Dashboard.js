import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Dashboard.css';

const RecepcionistaDashboard = () => {
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pedidosPendientes: 0,
    pedidosPreparacion: 0,
    pedidosCamino: 0,
    pedidosEntregados: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
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
      const [ordersResponse, statsResponse] = await Promise.all([
        fetch(`${apiBase}/orders/get_all.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBase}/orders/reports.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (ordersResponse.ok && statsResponse.ok) {
        const ordersData = await ordersResponse.json();
        const statsData = await statsResponse.json();

        // Calcular estadísticas
        const statsCalculated = {
          totalPedidos: ordersData.length,
          pedidosPendientes: ordersData.filter(order => order.estado === 'pendiente').length,
          pedidosPreparacion: ordersData.filter(order => order.estado === 'preparacion').length,
          pedidosCamino: ordersData.filter(order => order.estado === 'camino').length,
          pedidosEntregados: ordersData.filter(order => order.estado === 'entregado').length
        };

        setStats(statsCalculated);
        setRecentOrders(ordersData.slice(0, 5)); // Últimos 5 pedidos
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos del dashboard'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: { class: 'badge-pending', text: 'Pendiente' },
      preparacion: { class: 'badge-preparation', text: 'En Preparación' },
      camino: { class: 'badge-camino', text: 'En Camino' },
      entregado: { class: 'badge-delivered', text: 'Entregado' },
      cancelado: { class: 'badge-cancelled', text: 'Cancelado' }
    };

    const config = statusConfig[estado] || statusConfig.pendiente;
    return <span className={`badge ${config.class}`}>{config.text}</span>;
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
        <h1>Dashboard - Recepcionista</h1>
        <p>Bienvenido/a, {user?.nombre}. Aquí tienes un resumen de la actividad.</p>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalPedidos}</div>
            <div className="stat-label">Total Pedidos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pedidosPendientes}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pedidosPreparacion}</div>
            <div className="stat-label">En Preparación</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pedidosCamino}</div>
            <div className="stat-label">En Camino</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pedidosEntregados}</div>
            <div className="stat-label">Entregados</div>
          </div>
        </div>
      </div>

      {/* Pedidos Recientes */}
      <div className="recent-orders">
        <div className="section-header">
          <h2>Pedidos Recientes</h2>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/recepcionista/pedidos'}
          >
            Ver Todos
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No hay pedidos recientes</div>
            <div className="empty-state-description">
              Crea tu primer pedido para comenzar
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/recepcionista/crear-pedido'}
            >
              Crear Primer Pedido
            </button>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Items</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="order-code">#{order.codigo_pedido}</td>
                    <td>{new Date(order.fecha_creacion).toLocaleDateString()}</td>
                    <td>{order.cantidad_items} items</td>
                    <td>{getStatusBadge(order.estado)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => window.location.href = `/recepcionista/pedidos?order=${order.id}`}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <div 
            className="action-card"
            onClick={() => window.location.href = '/recepcionista/crear-pedido'}
          >
            <div className="action-icon">➕</div>
            <div className="action-title">Crear Pedido</div>
            <div className="action-description">Crear un nuevo pedido para bodega</div>
          </div>

          <div 
            className="action-card"
            onClick={() => window.location.href = '/recepcionista/pedidos'}
          >
            <div className="action-icon">📋</div>
            <div className="action-title">Ver Pedidos</div>
            <div className="action-description">Revisar todos los pedidos</div>
          </div>

          <div 
            className="action-card"
            onClick={() => window.location.href = '/recepcionista/reportes'}
          >
            <div className="action-icon">📊</div>
            <div className="action-title">Reportes</div>
            <div className="action-description">Generar reportes de pedidos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecepcionistaDashboard;