import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [statusFilter, setStatusFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  useEffect(() => {
    filterReports();
  }, [reports, statusFilter]);

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(
        `${apiBase}/orders/reports.php?fecha_inicio=${dateRange.start}&fecha_fin=${dateRange.end}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        throw new Error('Error al cargar reportes');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los reportes'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(report => report.estado === statusFilter);
    }

    setFilteredReports(filtered);
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

  const calculateStats = () => {
    const total = reports.length;
    const entregados = reports.filter(r => r.estado === 'entregado').length;
    const pendientes = reports.filter(r => r.estado === 'pendiente').length;
    const totalValor = reports.reduce((sum, report) => sum + parseFloat(report.total_valor || 0), 0);

    return {
      total,
      entregados,
      pendientes,
      totalValor,
      tasaEntrega: total > 0 ? ((entregados / total) * 100).toFixed(1) : 0
    };
  };

  const exportToCSV = () => {
    const headers = ['Código', 'Fecha', 'Estado', 'Recepción', 'Items', 'Valor Total'];
    const csvData = filteredReports.map(report => [
      report.codigo_pedido,
      new Date(report.fecha_creacion).toLocaleDateString(),
      getStatusText(report.estado),
      report.recepcionista_nombre,
      report.total_items,
      `$${parseFloat(report.total_valor || 0).toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-pedidos-${dateRange.start}-a-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: 'Reporte exportado',
      message: 'El reporte se ha descargado correctamente'
    });
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="page-header">
        <h1>Reportes de Pedidos</h1>
        <p>Genera y visualiza reportes detallados de los pedidos</p>
      </div>

      {/* Filtros y Controles */}
      <div className="controls-section">
        <div className="date-controls">
          <div className="form-group">
            <label htmlFor="startDate">Fecha Inicio:</label>
            <input
              id="startDate"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Fecha Fin:</label>
            <input
              id="endDate"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="form-input"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={loadReports}
          >
            🔄 Actualizar
          </button>
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="preparacion">En Preparación</option>
            <option value="camino">En Camino</option>
            <option value="entregado">Entregados</option>
          </select>

          <button
            className="btn btn-success"
            onClick={exportToCSV}
            disabled={filteredReports.length === 0}
          >
            📊 Exportar CSV
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Pedidos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{stats.entregados}</div>
            <div className="stat-label">Entregados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{stats.pendientes}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <div className="stat-number">{stats.tasaEntrega}%</div>
            <div className="stat-label">Tasa de Entrega</div>
          </div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-number">${stats.totalValor.toFixed(2)}</div>
            <div className="stat-label">Valor Total</div>
          </div>
        </div>
      </div>

      {/* Tabla de Reportes */}
      <div className="reports-table-section">
        <div className="section-header">
          <h2>Detalle de Pedidos</h2>
          <div className="table-info">
            Mostrando {filteredReports.length} de {reports.length} pedidos
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No hay datos para mostrar</div>
            <div className="empty-state-description">
              No se encontraron pedidos en el rango de fechas seleccionado
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Código Pedido</th>
                  <th>Fecha Creación</th>
                  <th>Estado</th>
                  <th>Recepción</th>
                  <th>Items</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <tr key={index}>
                    <td className="code-cell">#{report.codigo_pedido}</td>
                    <td>{new Date(report.fecha_creacion).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(report.estado)}`}>
                        {getStatusText(report.estado)}
                      </span>
                    </td>
                    <td>{report.recepcionista_nombre}</td>
                    <td>{report.total_items}</td>
                    <td className="amount-cell">
                      ${parseFloat(report.total_valor || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4"><strong>Total General</strong></td>
                  <td><strong>{filteredReports.reduce((sum, r) => sum + parseInt(r.total_items), 0)}</strong></td>
                  <td className="amount-cell">
                    <strong>${filteredReports.reduce((sum, r) => sum + parseFloat(r.total_valor || 0), 0).toFixed(2)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Resumen por Estado */}
      <div className="summary-section">
        <h2>Resumen por Estado</h2>
        <div className="status-summary">
          {['entregado', 'pendiente', 'preparacion', 'camino', 'cancelado'].map(estado => {
            const count = reports.filter(r => r.estado === estado).length;
            const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;
            
            return (
              <div key={estado} className="status-item">
                <div className="status-header">
                  <span className={`status-indicator ${getStatusClass(estado)}`}></span>
                  <span className="status-name">{getStatusText(estado)}</span>
                  <span className="status-count">{count}</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-progress ${getStatusClass(estado)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="status-percentage">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reports;