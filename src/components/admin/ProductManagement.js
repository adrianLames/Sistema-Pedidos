import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    stock_minimo: '5'
  });

  // Estado para el modal de actualización de stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockModalValue, setStockModalValue] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, stockFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      // Cambiar endpoint de read.php a get_all.php
      const response = await fetch(`${apiBase}/products/get_all.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      // Manejar tanto formato de array directo como objeto con propiedad data/success
      if (result.success) {
        setProducts(result.data);
      } else if (Array.isArray(result)) {
        setProducts(result);
      } else {
        throw new Error(result.message || 'Error al cargar productos');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los productos'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por stock
    if (stockFilter !== 'todos') {
      switch (stockFilter) {
        case 'sin-stock':
          filtered = filtered.filter(product => product.stock === 0);
          break;
        case 'bajo-stock':
          filtered = filtered.filter(product => 
            product.stock > 0 && product.stock <= product.stock_minimo
          );
          break;
        case 'stock-ok':
          filtered = filtered.filter(product => product.stock > product.stock_minimo);
          break;
      }
    }

    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const url = editingProduct 
        ? `${apiBase}/products/update.php`
        : `${apiBase}/products/create.php`;

      const body = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        stock_minimo: parseInt(formData.stock_minimo)
      };

      if (editingProduct) {
        body.id = editingProduct.id;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        addNotification({
          type: 'success',
          title: editingProduct ? 'Producto actualizado' : 'Producto creado',
          message: result.message
        });
        
        setShowModal(false);
        resetForm();
        loadProducts();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      codigo: product.codigo,
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio.toString(),
      stock: product.stock.toString(),
      stock_minimo: product.stock_minimo.toString()
    });
    setShowModal(true);
  };

  const openStockModal = (product) => {
    setStockModalProduct(product);
    setStockModalValue(product.stock.toString());
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setStockModalProduct(null);
    setStockModalValue('');
  };

  const handleStockModalSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(stockModalValue) || stockModalValue === '') return;
    await handleUpdateStock(stockModalProduct, parseInt(stockModalValue));
    closeStockModal();
  };

  const handleUpdateStock = async (product, newStock) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/products/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: product.id,
          stock: parseInt(newStock)
        })
      });

      const result = await response.json();

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Stock actualizado',
          message: `Stock de ${product.nombre} actualizado a ${newStock}`
        });
        loadProducts();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo actualizar el stock'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      stock_minimo: '5'
    });
    setEditingProduct(null);
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) {
      return { status: 'sin-stock', label: 'Sin Stock', class: 'stock-out', icon: '❌' };
    } else if (product.stock <= product.stock_minimo) {
      return { status: 'low-stock', label: 'Stock Bajo', class: 'stock-low', icon: '⚠️' };
    } else {
      return { status: 'in-stock', label: 'En Stock', class: 'stock-ok', icon: '✅' };
    }
  };

  const generateProductCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `PROD-${timestamp}-${random}`.toUpperCase();
  };

  const calculateStats = () => {
    const total = products.length;
    const sinStock = products.filter(p => p.stock === 0).length;
    const bajoStock = products.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length;
    const valorTotal = products.reduce((sum, p) => sum + (p.precio * p.stock), 0);

    return {
      total,
      sinStock,
      bajoStock,
      valorTotal,
      enStock: total - sinStock - bajoStock
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="product-management-container">
        <div className="loading">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="product-management-container">
      <div className="page-header">
        <h1>Gestión de Productos</h1>
        <p>Administra el catálogo de productos y control de stock</p>
      </div>

      {/* Controles */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por código, nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-controls">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="form-select"
          >
            <option value="todos">Todos los productos</option>
            <option value="sin-stock">Sin Stock</option>
            <option value="bajo-stock">Stock Bajo</option>
            <option value="stock-ok">Stock Normal</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                codigo: generateProductCode()
              }));
              setShowModal(true);
            }}
          >
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Productos</div>
        </div>
        <div className="stat-card stock-ok">
          <div className="stat-number">{stats.enStock}</div>
          <div className="stat-label">En Stock</div>
        </div>
        <div className="stat-card stock-low">
          <div className="stat-number">{stats.bajoStock}</div>
          <div className="stat-label">Stock Bajo</div>
        </div>
        <div className="stat-card stock-out">
          <div className="stat-number">{stats.sinStock}</div>
          <div className="stat-label">Sin Stock</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-number">${stats.valorTotal.toLocaleString()}</div>
          <div className="stat-label">Valor Total Inventario</div>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="products-section">
        <div className="section-header">
          <h2>Catálogo de Productos</h2>
          <div className="section-info">
            Mostrando {filteredProducts.length} de {products.length} productos
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">
              {searchTerm || stockFilter !== 'todos' ? 'No se encontraron productos' : 'No hay productos registrados'}
            </div>
            <div className="empty-state-description">
              {searchTerm || stockFilter !== 'todos' 
                ? 'Intenta con otros términos de búsqueda o ajusta los filtros'
                : 'Comienza creando el primer producto del catálogo'
              }
            </div>
            {(searchTerm || stockFilter !== 'todos') && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStockFilter('todos');
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product);
              
              return (
                <div key={product.id} className="product-card">
                  <div className="product-header">
                    <div className="product-code">{product.codigo}</div>
                    <div className={`stock-status ${stockStatus.class}`}>
                      <span className="status-icon">{stockStatus.icon}</span>
                      {stockStatus.label}
                    </div>
                  </div>

                  <div className="product-info">
                    <h3 className="product-name">{product.nombre}</h3>
                    {product.descripcion && (
                      <p className="product-description">{product.descripcion}</p>
                    )}
                  </div>

                  <div className="product-details">
                    <div className="detail-item">
                      <span className="detail-label">Precio:</span>
                      <span className="detail-value">${parseFloat(product.precio).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Stock Actual:</span>
                      <span className="detail-value">{product.stock} unidades</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mínimo:</span>
                      <span className="detail-value">{product.stock_minimo} unidades</span>
                    </div>
                  </div>

                  <div className="stock-progress">
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${stockStatus.class}`}
                        style={{ 
                          width: `${product.stock_minimo > 0 ? Math.min((product.stock / product.stock_minimo) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {product.stock === 0 ? 'AGOTADO' : `${product.stock}/${product.stock_minimo}`}
                    </div>
                  </div>

                  <div className="product-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(product)}
                      title="Editar producto"
                    >
                      ✏️ Editar
                    </button>
                    <div className="stock-controls">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openStockModal(product)}
                        title="Actualizar stock"
                      >
                        📦 Stock
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleUpdateStock(product, product.stock + 1)}
                        title="Aumentar stock en 1"
                      >
                        +
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleUpdateStock(product, Math.max(0, product.stock - 1))}
                        title="Reducir stock en 1"
                        disabled={product.stock === 0}
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para crear/editar producto */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="codigo">Código del Producto *</label>
                <input
                  id="codigo"
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  required
                  className="form-input"
                  placeholder="Ej: PROD-001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombre">Nombre del Producto *</label>
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  className="form-input"
                  placeholder="Ej: Laptop Dell XPS 13"
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows="3"
                  className="form-textarea"
                  placeholder="Descripción detallada del producto..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="precio">Precio ($) *</label>
                  <input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                    required
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Stock Inicial *</label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="stock_minimo">Stock Mínimo *</label>
                <input
                  id="stock_minimo"
                  type="number"
                  min="1"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: e.target.value }))}
                  required
                  className="form-input"
                  placeholder="5"
                />
                <div className="form-help">
                  Se generará una alerta cuando el stock llegue a este nivel
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para actualizar stock */}
      {showStockModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Actualizar Stock</h2>
              <button className="modal-close" onClick={closeStockModal}>×</button>
            </div>
            <form onSubmit={handleStockModalSubmit} className="modal-form">
              <div className="form-group">
                <label>Nuevo stock para <b>{stockModalProduct?.nombre}</b>:</label>
                <input
                  type="number"
                  min="0"
                  value={stockModalValue}
                  onChange={e => setStockModalValue(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeStockModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;