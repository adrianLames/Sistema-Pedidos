import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'recepcionista',
    activo: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/users/get_all.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Error al cargar usuarios');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por rol
    if (roleFilter !== 'todos') {
      filtered = filtered.filter(user => user.rol === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const url = editingUser 
        ? `${apiBase}/users/update.php`
        : `${apiBase}/users/create.php`;

      const method = editingUser ? 'POST' : 'POST';
      
      const body = editingUser 
        ? { ...formData, id: editingUser.id }
        : formData;

      // Si estamos editando y no se cambió la contraseña, no la enviemos
      if (editingUser && !formData.password) {
        delete body.password;
      }

      const response = await fetch(url, {
        method: method,
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
          title: editingUser ? 'Usuario actualizado' : 'Usuario creado',
          message: result.message
        });
        
        setShowModal(false);
        resetForm();
        loadUsers();
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

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      email: user.email,
      password: '', // No mostrar contraseña actual
      rol: user.rol,
      activo: user.activo
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${apiBase}/users/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: user.id,
          activo: !user.activo
        })
      });

      const result = await response.json();

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Estado actualizado',
          message: `Usuario ${!user.activo ? 'activado' : 'desactivado'} correctamente`
        });
        loadUsers();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el estado del usuario'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'recepcionista',
      activo: true
    });
    setEditingUser(null);
  };

  const getRoleName = (rol) => {
    const roles = {
      'admin': 'Administrador',
      'recepcionista': 'Recepcionista',
      'bodeguero': 'Bodeguero'
    };
    return roles[rol] || rol;
  };

  const getRoleBadgeClass = (rol) => {
    const classes = {
      'admin': 'badge-admin',
      'recepcionista': 'badge-recepcionista',
      'bodeguero': 'badge-bodeguero'
    };
    return classes[rol] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administra los usuarios y permisos del sistema</p>
      </div>

      {/* Controles */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-controls">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-select"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="recepcionista">Recepcionistas</option>
            <option value="bodeguero">Bodegueros</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            ➕ Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Usuarios</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {users.filter(u => u.rol === 'admin').length}
          </div>
          <div className="stat-label">Administradores</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {users.filter(u => u.rol === 'recepcionista').length}
          </div>
          <div className="stat-label">Recepcionistas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {users.filter(u => u.rol === 'bodeguero').length}
          </div>
          <div className="stat-label">Bodegueros</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {users.filter(u => u.activo).length}
          </div>
          <div className="stat-label">Usuarios Activos</div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="users-section">
        <div className="section-header">
          <h2>Lista de Usuarios</h2>
          <div className="section-info">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">
              {searchTerm || roleFilter !== 'todos' ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </div>
            <div className="empty-state-description">
              {searchTerm || roleFilter !== 'todos' 
                ? 'Intenta con otros términos de búsqueda o ajusta los filtros'
                : 'Comienza creando el primer usuario del sistema'
              }
            </div>
            {(searchTerm || roleFilter !== 'todos') && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('todos');
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha Registro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.nombre}</div>
                          <div className="user-id">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.rol)}`}>
                        {getRoleName(user.rol)}
                      </span>
                    </td>
                    <td>
                      {new Date(user.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <span className={`status-badge ${user.activo ? 'active' : 'inactive'}`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(user)}
                          title="Editar usuario"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className={`btn btn-sm ${user.activo ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(user)}
                          title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.activo ? '🚫 Desactivar' : '✅ Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
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
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  {editingUser ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={!editingUser}
                  className="form-input"
                  placeholder={editingUser ? '••••••••' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol *</label>
                <select
                  id="rol"
                  value={formData.rol}
                  onChange={(e) => setFormData(prev => ({ ...prev, rol: e.target.value }))}
                  required
                  className="form-select"
                >
                  <option value="recepcionista">Recepcionista</option>
                  <option value="bodeguero">Bodeguero</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {editingUser && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    Usuario activo
                  </label>
                </div>
              )}

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
                  {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;