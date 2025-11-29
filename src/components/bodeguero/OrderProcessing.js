import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import OrderDetails from './OrderDetails';
import './OrderProcessing.css';

const OrderProcessing = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Timer state para cada pedido en preparación
  const [timers, setTimers] = useState({});
  const intervalRef = useRef();

  useEffect(() => {
    loadOrders();
  }, []);

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

  const filteredOrders = orders.filter(order => {
    if (filter === 'todos') return true;
    return order.estado === filter;
  });

  const updateOrderStatus = async (orderId, newStatus) => {
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
          pedido_id: orderId, // corregido para coincidir con el backend
          estado: newStatus
        })
      });

      const result = await response.json();

      if (result.success) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, estado: newStatus } : order
        ));
        
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, estado: newStatus });
        }
        // Notificación especial si hay productos en stock bajo
        if (result.stock_alerta && Array.isArray(result.stock_alerta) && result.stock_alerta.length > 0) {
          const productos = result.stock_alerta.map(p => `${p.nombre} (Stock: ${p.stock}, Mínimo: ${p.stock_minimo})`).join(', ');
          addNotification({
            type: 'warning',
            title: '¡Alerta de Stock Bajo!',
            message: `Los siguientes productos están en stock mínimo o por debajo: ${productos}`
          });
        }
        addNotification({
          type: 'success',
          title: 'Estado actualizado',
          message: `Pedido actualizado a: ${getStatusText(newStatus)}`
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el estado del pedido: ' + error.message
      });
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'preparacion': 'En preparación',
      'camino': 'En camino',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const reportIssue = async (orderId, tipo, mensaje) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const user = JSON.parse(localStorage.getItem('user'));
      // Obtener recepcionista_id del pedido seleccionado
      let recepcionista_id = null;
      if (selectedOrder && selectedOrder.recepcionista_id) {
        recepcionista_id = selectedOrder.recepcionista_id;
      }
      const response = await fetch(`${apiBase}/orders/reportes.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pedido_id: orderId,
          usuario_id: user?.id,
          tipo,
          mensaje,
          recepcionista_id
        })
      });
      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Reporte enviado',
          message: 'El reporte fue enviado al administrador y la recepcionista.'
        });
      } else {
        throw new Error('No se pudo enviar el reporte');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo enviar el reporte: ' + error.message
      });
    }
  };

  const sendToWarehouse = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/orders/send_to_warehouse.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pedido_id: orderId })
      });
      const result = await response.json();
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Enviado a bodega',
          message: result.message
        });
        loadOrders();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo enviar a bodega: ' + error.message
      });
    }
  };

  useEffect(() => {
    // Limpiar intervalos al desmontar
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    // Iniciar timers para pedidos en preparación
    const prepOrders = orders.filter(o => o.estado === 'preparacion' && o.tiempo_preparacion);
    if (prepOrders.length === 0) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        prepOrders.forEach(order => {
          if (!updated[order.id]) {
            // Calcular tiempo restante desde fecha_actualizacion
            const start = new Date(order.fecha_actualizacion).getTime();
            const now = Date.now();
            const totalMs = order.tiempo_preparacion * 60 * 1000;
            const elapsed = now - start;
            const remaining = Math.max(0, Math.floor((totalMs - elapsed) / 1000));
            updated[order.id] = remaining;
          } else {
            updated[order.id] = Math.max(0, updated[order.id] - 1);
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [orders]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Cargando pedidos...</div>
      </div>
    );
  }

  // Helper para formatear segundos a mm:ss
  function formatTimer(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <div className="order-processing">
      <div className="processing-header">
        <h2>Gestión de Pedidos - Bodega</h2>
        <div className="filter-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filtrar pedidos por estado"
          >
            <option value="todos">Todos los pedidos</option>
            <option value="pendiente">Pendientes</option>
            <option value="preparacion">En preparación</option>
            <option value="camino">En camino</option>
            <option value="entregado">Entregados</option>
          </select>
        </div>
      </div>

      <div className="orders-container">
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">No hay pedidos</div>
              <div className="empty-state-description">
                {filter === 'todos' 
                  ? 'No se han creado pedidos aún' 
                  : `No hay pedidos en estado "${getStatusText(filter)}"`}
              </div>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order.id} 
                className={`order-card ${order.estado} ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                onClick={() => setSelectedOrder(order)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedOrder(order);
                  }
                }}
              >
                <div className="order-header">
                  <span className="order-code">#{order.codigo_pedido}</span>
                  <span className={`order-status ${order.estado}`}>
                    {getStatusText(order.estado)}
                  </span>
                </div>
                <div className="order-info">
                  <div className="order-date">
                    {new Date(order.fecha_creacion).toLocaleDateString()}
                  </div>
                  <div className="order-items">
                    {order.cantidad_items} items
                  </div>
                  {order.fecha_entrega && (
                    <div className="order-delivery-date" style={{ color: '#be185d', fontWeight: 600 }}>
                      📅 Entrega: {new Date(order.fecha_entrega).toLocaleString()}
                    </div>
                  )}
                  {order.estado === 'preparacion' && order.tiempo_preparacion ? (
                    <div className="order-timer" style={{ color: '#1e40af', fontWeight: 700 }}>
                      ⏳ Tiempo restante: {formatTimer(timers[order.id] ?? order.tiempo_preparacion * 60)}
                    </div>
                  ) : null}
                </div>
                <div className="order-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'preparacion');
                    }}
                    disabled={order.estado !== 'pendiente'}
                  >
                    Iniciar Preparación
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'camino');
                    }}
                    disabled={order.estado !== 'preparacion'}
                  >
                    Marcar en Camino
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'entregado');
                    }}
                    disabled={order.estado !== 'camino'}
                  >
                    Marcar Entregado
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendToWarehouse(order.id);
                    }}
                    disabled={order.estado !== 'preparacion'}
                  >
                    Enviar a Bodega
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="order-details-panel">
          {selectedOrder ? (
            <OrderDetails 
              order={selectedOrder} 
              onReportIssue={reportIssue}
              onStatusUpdate={updateOrderStatus}
            />
          ) : (
            <div className="no-selection">
              <p>Selecciona un pedido para ver los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderProcessing;