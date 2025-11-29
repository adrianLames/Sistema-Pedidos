import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './StockAlerts.css';

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, severityFilter]);

  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/products/stock_alert.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      } else {
        throw new Error('Error al cargar alertas');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las alertas de stock'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    if (severityFilter !== 'todos') {
      filtered = filtered.filter(alert => {
        const severity = getSeverity(alert.stock, alert.stock_minimo);
        return severity === severityFilter;
      });
    }

    setFilteredAlerts(filtered);
  };

  const getSeverity = (stock, stockMinimo) => {
    const percentage = (stock / stockMinimo) * 100;
    
    if (stock === 0) return 'critico';
    if (percentage <= 25) return 'alto';
    if (percentage <= 50) return 'medio';
    if (percentage <= 75) return 'bajo';
    return 'normal';
  };

  const getSeverityConfig = (severity) => {
    const config = {
      critico: {
        class: 'severity-critical',
        label: 'Crítico',
        icon: '🔴',
        description: 'Stock agotado'
      },
      alto: {
        class: 'severity-high',
        label: 'Alto',
        icon: '🟠',
        description: 'Stock muy bajo'
      },
      medio: {
        class: 'severity-medium',
        label: 'Medio',
        icon: '🟡',
        description: 'Stock bajo'
      },
      bajo: {
        class: 'severity-low',
        label: 'Bajo',
        icon: '🔵',
        description: 'Stock cercano al mínimo'
      },
      normal: {
        class: 'severity-normal',
        label: 'Normal',
        icon: '🟢',
        description: 'Stock normal'
      }
    };
    return config[severity] || config.normal;
  };

  const calculateStats = () => {
    const total = alerts.length;
    const critico = alerts.filter(alert => getSeverity(alert.stock, alert.stock_minimo) === 'critico').length;
    const alto = alerts.filter(alert => getSeverity(alert.stock, alert.stock_minimo) === 'alto').length;
    const medio = alerts.filter(alert => getSeverity(alert.stock, alert.stock_minimo) === 'medio').length;

    return {
      total,
      critico,
      alto,
      medio,
      porcentajeCritico: total > 0 ? ((critico / total) * 100).toFixed(1) : 0
    };
  };

  const requestRestock = (product) => {
    addNotification({
      type: 'warning',
      title: 'Solicitud de reabastecimiento',
      message: `Solicitud enviada para ${product.nombre}`
    });

    // Aquí se podría integrar con un sistema de notificaciones al administrador
    console.log('Solicitar reabastecimiento:', product);
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="stock-alerts-container">
        <div className="loading">Cargando alertas de stock...</div>
      </div>
    );
  }

  return (
    <div className="stock-alerts-container">
      <div className="page-header">
        <h1>Alertas de Stock</h1>
        <p>Monitorea los productos con stock bajo y gestiona reabastecimientos</p>
      </div>

      {/* Resumen de Alertas */}
      <div className="alerts-summary">
        <div className="summary-card critical">
          <div className="summary-icon">🔴</div>
          <div className="summary-info">
            <div className="summary-number">{stats.critico}</div>
            <div className="summary-label">Críticos</div>
          </div>
        </div>

        <div className="summary-card high">
          <div className="summary-icon">🟠</div>
          <div className="summary-info">
            <div className="summary-number">{stats.alto}</div>
            <div className="summary-label">Alto Riesgo</div>
          </div>
        </div>

        <div className="summary-card medium">
          <div className="summary-icon">🟡</div>
          <div className="summary-info">
            <div className="summary-number">{stats.medio}</div>
            <div className="summary-label">Medio Riesgo</div>
          </div>
        </div>

        <div className="summary-card total">
          <div className="summary-icon">📦</div>
          <div className="summary-info">
            <div className="summary-number">{stats.total}</div>
            <div className="summary-label">Total Alertas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="severityFilter">Filtrar por severidad:</label>
          <select
            id="severityFilter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="form-select"
          >
            <option value="todos">Todas las alertas</option>
            <option value="critico">Crítico</option>
            <option value="alto">Alto Riesgo</option>
            <option value="medio">Medio Riesgo</option>
            <option value="bajo">Bajo Riesgo</option>
          </select>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadAlerts}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Lista de Alertas */}
      <div className="alerts-section">
        <div className="section-header">
          <h2>Productos con Stock Bajo</h2>
          <div className="section-info">
            Mostrando {filteredAlerts.length} de {alerts.length} alertas
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">
              {alerts.length === 0 ? 'No hay alertas de stock' : 'No hay alertas con el filtro seleccionado'}
            </div>
            <div className="empty-state-description">
              {alerts.length === 0 
                ? 'Todos los productos tienen stock suficiente'
                : 'Intenta con otro filtro de severidad'
              }
            </div>
          </div>
        ) : (
          <div className="alerts-grid">
            {filteredAlerts.map(product => {
              const severity = getSeverity(product.stock, product.stock_minimo);
              const config = getSeverityConfig(severity);
              
              return (
                <div key={product.id} className={`alert-card ${config.class}`}>
                  <div className="alert-header">
                    <div className="alert-severity">
                      <span className="severity-icon">{config.icon}</span>
                      <span className="severity-label">{config.label}</span>
                    </div>
                    <div className="alert-actions">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => requestRestock(product)}
                      >
                        Solicitar Reabastecimiento
                      </button>
                    </div>
                  </div>

                  <div className="product-info">
                    <div className="product-name">{product.nombre}</div>
                    <div className="product-code">{product.codigo}</div>
                  </div>

                  <div className="stock-info">
                    <div className="stock-levels">
                      <div className="stock-current">
                        <span className="label">Stock Actual:</span>
                        <span className="value">{product.stock} unidades</span>
                      </div>
                      <div className="stock-minimum">
                        <span className="label">Mínimo Requerido:</span>
                        <span className="value">{product.stock_minimo} unidades</span>
                      </div>
                    </div>

                    <div className="stock-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${config.class}`}
                          style={{ 
                            width: `${Math.min((product.stock / product.stock_minimo) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {product.stock === 0 ? 'AGOTADO' : `${Math.round((product.stock / product.stock_minimo) * 100)}% del mínimo`}
                      </div>
                    </div>
                  </div>

                  <div className="alert-description">
                    {config.description}
                    {product.stock === 0 && ' - Producto no disponible'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Acciones Masivas */}
      {alerts.length > 0 && (
        <div className="bulk-actions">
          <h3>Acciones Masivas</h3>
          <div className="bulk-buttons">
            <button
              className="btn btn-warning"
              onClick={() => {
                const criticalProducts = alerts.filter(p => 
                  getSeverity(p.stock, p.stock_minimo) === 'critico'
                );
                criticalProducts.forEach(requestRestock);
                addNotification({
                  type: 'warning',
                  title: 'Solicitudes enviadas',
                  message: `Solicitudes de reabastecimiento enviadas para ${criticalProducts.length} productos críticos`
                });
              }}
              disabled={stats.critico === 0}
            >
              Solicitar Reabastecimiento para Productos Críticos
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                // Generar reporte de alertas
                addNotification({
                  type: 'info',
                  title: 'Reporte generado',
                  message: 'Reporte de alertas de stock generado'
                });
              }}
            >
              📊 Generar Reporte de Alertas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;