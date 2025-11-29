import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import OrderDetails from './OrderDetails';
import './OrderList.css';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filter, searchTerm]);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/orders/get_all.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        throw new Error('Error al cargar pedidos');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los pedidos'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Aplicar filtro de estado
    if (filter !== 'todos') {
      filtered = filtered.filter(order => order.estado === filter);
    }

    // Aplicar búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.codigo_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.recepcionista_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusText = (estado) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'preparacion': 'En Preparación',
      'camino': 'En Camino',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return statusMap[estado] || estado;
  };

  const getStatusClass = (estado) => {
    const classMap = {
      'pendiente': 'status-pending',
      'preparacion': 'status-preparation',
      'camino': 'status-camino',
      'entregado': 'status-delivered',
      'cancelado': 'status-cancelled'
    };
    return classMap[estado] || 'status-pending';
  };

  const getStatusIcon = (estado) => {
    const iconMap = {
      'pendiente': '⏳',
      'preparacion': '🔧',
      'camino': '🚚',
      'entregado': '✅',
      'cancelado': '❌'
    };
    return iconMap[estado] || '⏳';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const reenviarPedido = async (order) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      if (order.estado === 'entregado') {
        // 1. Obtener detalles del pedido original
        const detallesRes = await fetch(`${apiBase}/orders/get_details.php?order_id=${order.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!detallesRes.ok) throw new Error('No se pudieron obtener los detalles del pedido original');
        const detalles = await detallesRes.json();
        // 2. Preparar detalles para el nuevo pedido
        const detallesClon = detalles.map(d => ({
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario
        }));
        // 3. Crear nuevo pedido
        const crearRes = await fetch(`${apiBase}/orders/create.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ detalles: detallesClon, observaciones: `Reenvío de pedido #${order.codigo_pedido}` })
        });
        const crearData = await crearRes.json();
        if (crearRes.ok && crearData.success) {
          addNotification({
            type: 'success',
            title: 'Pedido reenviado',
            message: `Se creó un nuevo pedido con los mismos artículos (#${crearData.codigo_pedido})`
          });
          loadOrders();
        } else {
          throw new Error(crearData.message || 'No se pudo crear el nuevo pedido');
        }
      } else {
        // Si está pendiente, solo reenviar (actualizar estado)
        const response = await fetch(`${apiBase}/orders/update_status.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ pedido_id: order.id, estado: 'pendiente' })
        });
        if (response.ok) {
          addNotification({
            type: 'success',
            title: 'Pedido reenviado',
            message: `Pedido #${order.codigo_pedido} reenviado a bodega`
          });
          loadOrders();
        } else {
          throw new Error('No se pudo reenviar el pedido');
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo reenviar el pedido'
      });
    }
  };

  if (loading) {
    return (
      <div className="order-list-container">
        <div className="loading">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      <div className="page-header">
        <h1>Lista de Pedidos</h1>
        <p>Gestiona y revisa todos los pedidos del sistema</p>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por código de pedido o recepcionista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'todos' ? 'active' : ''}`}
            onClick={() => setFilter('todos')}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${filter === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFilter('pendiente')}
          >
            ⏳ Pendientes
          </button>
          <button
            className={`filter-btn ${filter === 'preparacion' ? 'active' : ''}`}
            onClick={() => setFilter('preparacion')}
          >
            🔧 En Preparación
          </button>
          <button
            className={`filter-btn ${filter === 'camino' ? 'active' : ''}`}
            onClick={() => setFilter('camino')}
          >
            🚚 En Camino
          </button>
          <button
            className={`filter-btn ${filter === 'entregado' ? 'active' : ''}`}
            onClick={() => setFilter('entregado')}
          >
            ✅ Entregados
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-number">{orders.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {orders.filter(o => o.estado === 'pendiente').length}
          </span>
          <span className="stat-label">Pendientes</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {orders.filter(o => o.estado === 'preparacion').length}
          </span>
          <span className="stat-label">En Preparación</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {orders.filter(o => o.estado === 'entregado').length}
          </span>
          <span className="stat-label">Entregados</span>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="orders-section">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">
              {searchTerm || filter !== 'todos' ? 'No se encontraron pedidos' : 'No hay pedidos'}
            </div>
            <div className="empty-state-description">
              {searchTerm || filter !== 'todos' 
                ? 'Intenta con otros términos de búsqueda o ajusta los filtros'
                : 'Crea tu primer pedido para comenzar'
              }
            </div>
            {(searchTerm || filter !== 'todos') && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('todos');
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-code">#{order.codigo_pedido}</div>
                  <div className={`order-status ${getStatusClass(order.estado)}`}>
                    <span className="status-icon">{getStatusIcon(order.estado)}</span>
                    {getStatusText(order.estado)}
                  </div>
                </div>

                <div className="order-info">
                  <div className="info-item">
                    <span className="info-label">Creado por:</span>
                    <span className="info-value">{order.recepcionista_nombre}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">{formatDate(order.fecha_creacion)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Items:</span>
                    <span className="info-value">{order.cantidad_items} productos</span>
                  </div>
                </div>

                {order.observaciones && (
                  <div className="order-observations">
                    <strong>Observaciones:</strong> {order.observaciones}
                  </div>
                )}

                <div className="order-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setShowDetails(true);
                    }}
                  >
                    Ver Detalles
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => reenviarPedido(order)}
                    disabled={order.estado !== 'pendiente' && order.estado !== 'entregado'}
                  >
                    Reenviar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {filteredOrders.length > 0 && (
        <div className="pagination">
          <button className="btn btn-secondary" disabled>
            Anterior
          </button>
          <span className="pagination-info">
            Mostrando {filteredOrders.length} de {orders.length} pedidos
          </span>
          <button className="btn btn-secondary" disabled>
            Siguiente
          </button>
        </div>
      )}

      {/* Modal de detalles */}
      {showDetails && (
        <OrderDetails
          orderId={selectedOrderId}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default OrderList;