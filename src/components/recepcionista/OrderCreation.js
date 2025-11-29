import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './OrderCreation.css';

const OrderCreation = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [orderObservations, setOrderObservations] = useState('');
  const [orderPreparationTime, setOrderPreparationTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product => 
        product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/products/get_all.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Manejar tanto formato de array directo como objeto con propiedad data
        const productsArray = Array.isArray(data) ? data : (data.data || []);
        setProducts(productsArray);
        setFilteredProducts(productsArray);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los productos'
      });
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.producto_id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.producto_id === product.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        producto_id: product.id,
        codigo: product.codigo,
        nombre: product.nombre,
        precio_unitario: product.precio,
        cantidad: 1
      }]);
    }
    
    addNotification({
      type: 'success',
      title: 'Producto agregado',
      message: `${product.nombre} agregado al pedido`
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.producto_id === productId 
          ? { ...item, cantidad: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.producto_id !== productId));
    addNotification({
      type: 'info',
      title: 'Producto removido',
      message: 'Producto eliminado del pedido'
    });
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Pedido vacío',
        message: 'Agrega productos al pedido antes de enviar'
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/orders/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          detalles: cart,
          observaciones: orderObservations,
          tiempo_preparacion: selectedTime === 'custom' ? (customTime ? parseInt(customTime) : null) : selectedTime,
          fecha_entrega: orderDeliveryDate || null
        })
      });

      const result = await response.json();

      if (result.success) {
        setCart([]);
        setOrderObservations('');
        setOrderPreparationTime('');
        addNotification({
          type: 'success',
          title: 'Pedido creado',
          message: `Pedido #${result.codigo_pedido} enviado a bodega`
        });
        loadProducts(); // Solo recarga local
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear el pedido: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);

  return (
    <div className="order-creation">
      <div className="order-header">
        <h2>Crear Nuevo Pedido</h2>
        <p>Selecciona los productos y envíalos a bodega</p>
      </div>

      <div className="order-content">
        <div className="products-section">
          <div className="product-search">
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-info">
                  <div className="product-code">{product.codigo}</div>
                  <div className="product-name">{product.nombre}</div>
                  <div className="product-price">${product.precio}</div>
                  <div className={`product-stock ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                    Stock: {product.stock}
                  </div>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="add-to-cart-btn"
                >
                  {product.stock === 0 ? 'Sin Stock' : 'Agregar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="order-cart">
          <h3>Pedido Actual</h3>
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>No hay productos en el pedido</p>
              <span>Agrega productos desde la lista</span>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.producto_id} className="cart-item">
                    <div className="item-info">
                      <div>
                        <span className="item-name">{item.nombre}</span>
                        <span className="item-code">({item.codigo})</span>
                      </div>
                      <div className="item-total">
                        ${(item.precio_unitario * item.cantidad).toFixed(2)}
                      </div>
                    </div>
                    <div className="item-controls">
                      <div>
                        <button 
                          onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                          aria-label="Reducir cantidad"
                        >
                          -
                        </button>
                        <span className="item-quantity">{item.cantidad}</span>
                        <button 
                          onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.producto_id)}
                        className="remove-btn"
                        aria-label="Eliminar producto"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-total">
                <strong>Total: ${total.toFixed(2)}</strong>
              </div>

              <div className="order-observations">
                <label htmlFor="observations">Observaciones:</label>
                <textarea
                  id="observations"
                  placeholder="Agregar observaciones del pedido..."
                  value={orderObservations}
                  onChange={(e) => setOrderObservations(e.target.value)}
                />
              </div>

              <div className="order-preparation-time">
                <label>Tiempo de preparación:</label>
                <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
                  {[10, 20, 30, 45, 60].map(min => (
                    <button
                      key={min}
                      type="button"
                      className={`quick-time-btn${selectedTime === min ? ' selected' : ''}`}
                      onClick={() => { setSelectedTime(min); setCustomTime(''); }}
                      aria-label={`Asignar ${min} minutos`}
                      style={{ minWidth: 60, fontSize: '0.97rem', padding: '6px 10px' }}
                    >
                      {min} min
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`quick-time-btn${selectedTime === 'custom' ? ' selected' : ''}`}
                    onClick={() => setSelectedTime('custom')}
                    aria-label="Asignar tiempo personalizado"
                    style={{ minWidth: 60, fontSize: '0.97rem', padding: '6px 10px' }}
                  >
                    Personalizado
                  </button>
                </div>
                {selectedTime === 'custom' && (
                  <>
                    <input
                      type="number"
                      min="1"
                      placeholder="Minutos"
                      value={customTime}
                      onChange={e => setCustomTime(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ width: '100%', padding: '8px', marginTop: '4px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ccc' }}
                      aria-label="Tiempo personalizado en minutos"
                    />
                    <div className="order-delivery-date">
                      <label htmlFor="delivery-date">Fecha y hora de entrega:</label>
                      <input
                        id="delivery-date"
                        type="datetime-local"
                        value={orderDeliveryDate}
                        onChange={e => setOrderDeliveryDate(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '4px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ccc' }}
                        aria-label="Fecha y hora de entrega"
                      />
                      <small>Déjalo vacío si el pedido es para hoy.</small>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={submitOrder} 
                className="submit-order-btn"
                disabled={loading || cart.length === 0}
              >
                {loading ? 'Enviando...' : 'Enviar Pedido a Bodega'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCreation;

// CSS rápido para los botones de tiempo
/*
.quick-time-btn {
  background: #f1f5f9;
  color: #1e40af;
  border: 1.5px solid #1e40af;
  border-radius: 6px;
  padding: 6px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.quick-time-btn.selected, .quick-time-btn:focus {
  background: #1e40af;
  color: #fff;
  outline: 2px solid #1e40af;
}
*/