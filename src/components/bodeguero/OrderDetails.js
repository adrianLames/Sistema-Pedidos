import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import './OrderDetails.css';

const REPORT_TYPES = [
  { value: 'sin_stock', label: 'Sin stock de producto' },
  { value: 'producto_danado', label: 'Producto dañado' },
  { value: 'otro', label: 'Otro (especificar)' }
];

const OrderDetails = ({ order, onReportIssue, onStatusUpdate }) => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('sin_stock');
  const [reportMsg, setReportMsg] = useState('');
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (order) {
      loadOrderDetails();
    }
  }, [order]);

  const loadOrderDetails = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/orders/get_details.php?order_id=${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(Array.isArray(data) ? data : (data.detalles || []));
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los detalles del pedido'
      });
    } finally {
      setLoading(false);
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

  const total = orderDetails.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

  if (loading) {
    return <div className="loading">Cargando detalles...</div>;
  }

  return (
    <div className="order-details">
      <div className="order-details-header">
        <h3>Pedido #{order.codigo_pedido}</h3>
        <div className="order-meta">
          <div className="meta-item">
            <span className="meta-label">Estado</span>
            <span className={`meta-value status-${order.estado}`}>
              {getStatusText(order.estado)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Fecha</span>
            <span className="meta-value">
              {new Date(order.fecha_creacion).toLocaleDateString()}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Recepción</span>
            <span className="meta-value">{order.recepcionista_nombre}</span>
          </div>
        </div>

        {order.observaciones && (
          <div className="observations">
            <h4>Observaciones</h4>
            <p>{order.observaciones}</p>
          </div>
        )}
      </div>

      <div className="order-items-section">
        <h4>Productos del Pedido</h4>
        <div className="table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderDetails.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="item-name">{item.nombre}</div>
                    {item.descripcion && (
                      <div className="item-description">{item.descripcion}</div>
                    )}
                  </td>
                  <td>
                    <span className="item-code">{item.codigo}</span>
                  </td>
                  <td>{item.cantidad}</td>
                  <td>${item.precio_unitario}</td>
                  <td className="item-total">
                    ${(item.cantidad * item.precio_unitario).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="order-summary">
          <div className="summary-row total">
            <span>Total del Pedido:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="order-actions-panel">
        <h4>Acciones</h4>
        <div className="action-buttons">
          <button 
            onClick={() => onStatusUpdate(order.id, 'preparacion')}
            disabled={order.estado !== 'pendiente'}
            className="action-btn primary"
          >
            Iniciar Preparación
          </button>
          <button 
            onClick={() => onStatusUpdate(order.id, 'camino')}
            disabled={order.estado !== 'preparacion'}
            className="action-btn primary"
          >
            Marcar en Camino
          </button>
          <button 
            onClick={() => onStatusUpdate(order.id, 'entregado')}
            disabled={order.estado !== 'camino'}
            className="action-btn primary"
          >
            Marcar Entregado
          </button>
          <button 
            onClick={() => setShowReport(true)}
            className="action-btn danger"
          >
            Reportar Problema
          </button>
        </div>
        {showReport && (
          <div className="report-modal">
            <h5>Reportar problema del pedido</h5>
            <select value={reportType} onChange={e => setReportType(e.target.value)}>
              {REPORT_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {reportType === 'otro' && (
              <textarea
                placeholder="Describe el problema"
                value={reportMsg}
                onChange={e => setReportMsg(e.target.value)}
              />
            )}
            <div className="report-actions">
              <button onClick={() => setShowReport(false)}>Cancelar</button>
              <button
                onClick={async () => {
                  await onReportIssue(order.id, reportType, reportMsg);
                  setShowReport(false);
                  setReportMsg('');
                  setReportType('sin_stock');
                }}
                className="action-btn primary"
              >Enviar Reporte</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;