import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './OrderDetails.css';

const OrderDetails = ({ orderId, onClose }) => {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (orderId) {
      fetchDetails();
    }
  }, [orderId]);

  const fetchDetails = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/orders/get_details.php?order_id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDetails(Array.isArray(data) ? data : (data.detalles || []));
      } else {
        throw new Error('No se pudieron cargar los detalles del pedido');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-details-modal">
      <div className="order-details-header">
        <h2>Detalles del Pedido</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      {loading ? (
        <div className="loading">Cargando detalles...</div>
      ) : (
        <div className="order-details-list">
          {details.length === 0 ? (
            <div>No hay detalles para este pedido.</div>
          ) : (
            <ul>
              {details.map(item => (
                <li key={item.id}>
                  <strong>{item.nombre}</strong> (x{item.cantidad}) - ${item.precio_unitario}
                  <br />
                  <span>{item.descripcion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
