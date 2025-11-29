import React, { useState } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';

// Admin Components
import AdminDashboard from '../components/admin/Dashboard';
import UserManagement from '../components/admin/UserManagement';
import ProductManagement from '../components/admin/ProductManagement';

// Recepcionista Components
import RecepcionistaDashboard from '../components/recepcionista/Dashboard';
import OrderCreation from '../components/recepcionista/OrderCreation';
import OrderList from '../components/recepcionista/OrderList';
import Reports from '../components/recepcionista/Reports';

// Bodeguero Components
import BodegueroDashboard from '../components/bodeguero/Dashboard';
import OrderProcessing from '../components/bodeguero/OrderProcessing';
import StockAlerts from '../components/bodeguero/StockAlerts';

const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const getDefaultRoute = () => {
    switch (user?.rol) {
      case 'admin': return '/admin/dashboard';
      case 'recepcionista': return '/recepcionista/dashboard';
      case 'bodeguero': return '/bodeguero/dashboard';
      default: return '/login';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={`main-content ${sidebarOpen ? 'full-width' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="content-area">
          <Switch>
            {/* Admin Routes */}
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/usuarios" component={UserManagement} />
            <Route path="/admin/productos" component={ProductManagement} />

            {/* Recepcionista Routes */}
            <Route path="/recepcionista/dashboard" component={RecepcionistaDashboard} />
            <Route path="/recepcionista/crear-pedido" component={OrderCreation} />
            <Route path="/recepcionista/pedidos" component={OrderList} />
            <Route path="/recepcionista/reportes" component={Reports} />

            {/* Bodeguero Routes */}
            <Route path="/bodeguero/dashboard" component={BodegueroDashboard} />
            <Route path="/bodeguero/pedidos" component={OrderProcessing} />
            <Route path="/bodeguero/alertas" component={StockAlerts} />

            {/* Default Route */}
            <Route path="/dashboard">
              <Redirect to={getDefaultRoute()} />
            </Route>
            <Route exact path="/">
              <Redirect to={getDefaultRoute()} />
            </Route>
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;