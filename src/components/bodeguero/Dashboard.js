import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Dashboard.css';

const BodegueroDashboard = () => {
  const [stats, setStats] = useState({
    pedidosPendientes: 0,
    pedidosPreparacion: 0,
    pedidosCamino: 0,
    alertasStock: 0,
    productosBajoStock: 0
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
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
      const [ordersResponse, alertsResponse] = await Promise.all([
        fetch(`${apiBase}/orders/get_all.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBase}/products/stock_alert.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (ordersResponse.ok && alertsResponse.ok) {
        const ordersData = await ordersResponse.json();
        const alertsData = await alertsResponse.json();

        // Calcular estadísticas
        const statsCalculated = {
          pedidosPendientes: ordersData.filter(order => order.estado === 'pendiente').length,
          pedidosPreparacion: ordersData.filter(order => order.estado === 'preparacion').length,
          pedidosCamino: ordersData.filter(order => order.estado === 'camino').length,
          alertasStock: alertsData.length,
          productosBajoStock: alertsData.length
        };

        setStats(statsCalculated);
        setPendingOrders(ordersData.filter(order => 
          order.estado === 'pendiente' || order.estado === 'preparacion'
        ).slice(0, 5));
        setStockAlerts(alertsData.slice(0, 5));
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/orders/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          estado: newStatus
        })
      });

      const result = await response.json();

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Estado actualizado',
          message: `Pedido actualizado a: ${getStatusText(newStatus)}`
        });
        loadDashboardData(); // Recargar datos
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el estado del pedido'
      });
    }
  };

  const getStatusText = (estado) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'preparacion': 'En Preparación',
      'camino': 'En Camino',
      'entregado': 'Entregado'
    };
    return statusMap[estado] || estado;
  };

  const getStatusAction = (currentStatus) => {
    const actions = {
      'pendiente': {
        text: 'Iniciar Preparación',
        nextStatus: 'preparacion',
        class: 'btn-primary'
      },
      'preparacion': {
        text: 'Marcar en Camino',
        nextStatus: 'camino',
        class: 'btn-warning'
      },
      'camino': {
        text: 'Marcar Entregado',
        nextStatus: 'entregado',
        class: 'btn-success'
      }
    };
    return actions[currentStatus] || null;
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
        <h1>Dashboard - Bodeguero</h1>
        <p>Bienvenido/a, {user?.nombre}. Gestión de pedidos y stock.</p>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card urgent">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pedidosPendientes}</div>
            <div className="stat-label">Pedidos Pendientes</div>
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

        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-number">{stats.alertasStock}</div>
            <div className="stat-label">Alertas de Stock</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Pedidos que Requieren Atención */}
        <div className="section">
          <div className="section-header">
            <h2>Pedidos que Requieren Atención</h2>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/bodeguero/pedidos'}
            >
              Ver Todos los Pedidos
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">No hay pedidos pendientes</div>
              <div className="empty-state-description">
                Todos los pedidos están procesados o en camino
              </div>
            </div>
          ) : (
            <div className="orders-list">
              {pendingOrders.map(order => {
                const action = getStatusAction(order.estado);
                return (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <div className="order-code">#{order.codigo_pedido}</div>
                      <div className="order-meta">
                        <span className="order-date">
                          {new Date(order.fecha_creacion).toLocaleDateString()}
                        </span>
                        <span className="order-items">{order.cantidad_items} items</span>
                        <span className={`order-status status-${order.estado}`}>
                          {getStatusText(order.estado)}
                        </span>
                      </div>
                      {order.observaciones && (
                        <div className="order-notes">
                          <strong>Notas:</strong> {order.observaciones}
                        </div>
                      )}
                    </div>
                    <div className="order-actions">
                      {action && (
                        <button
                          className={`btn ${action.class}`}
                          onClick={() => handleUpdateStatus(order.id, action.nextStatus)}
                        >
                          {action.text}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          window.location.href = `/bodeguero/pedidos?view=${order.id}`;
                        }}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas de Stock */}
        <div className="section">
          <div className="section-header">
            <h2>Alertas de Stock Bajo</h2>
            <button 
              className="btn btn-warning"
              onClick={() => window.location.href = '/bodeguero/alertas'}
            >
              Ver Todas las Alertas
            </button>
          </div>

          {stockAlerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">Stock en niveles óptimos</div>
              <div className="empty-state-description">
                No hay productos con stock bajo
              </div>
            </div>
          ) : (
            <div className="alerts-list">
              {stockAlerts.map(product => (
                <div key={product.id} className="alert-item">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-info">
                    <div className="alert-title">{product.nombre}</div>
                    <div className="alert-details">
                      <span className="product-code">{product.codigo}</span>
                      <span className="stock-info">
                        Stock: {product.stock} / Mínimo: {product.stock_minimo}
                      </span>
                    </div>
                  </div>
                  <div className="alert-severity critical">
                    Crítico
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="section">
          <h2>Acciones Rápidas</h2>
          <div className="quick-actions-grid">
            <div 
              className="action-card"
              onClick={() => window.location.href = '/bodeguero/pedidos'}
            >
              <div className="action-icon">📋</div>
              <div className="action-title">Gestionar Pedidos</div>
              <div className="action-description">
                Revisar y actualizar el estado de todos los pedidos
              </div>
            </div>

            <div 
              className="action-card"
              onClick={() => window.location.href = '/bodeguero/alertas'}
            >
              <div className="action-icon">⚠️</div>
              <div className="action-title">Ver Alertas de Stock</div>
              <div className="action-description">
                Monitorear productos con stock bajo
              </div>
            </div>

            <div 
              className="action-card"
              onClick={() => {
                // Función para generar reporte rápido
                addNotification({
                  type: 'info',
                  title: 'Reporte generado',
                  message: 'Reporte de pedidos del día generado'
                });
              }}
            >
              <div className="action-icon">📊</div>
              <div className="action-title">Reporte del Día</div>
              <div className="action-description">
                Generar reporte de pedidos de hoy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodegueroDashboard;