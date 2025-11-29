import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationClass = (type) => {
    switch (type) {
      case 'success': return 'notification-success';
      case 'warning': return 'notification-warning';
      case 'error': return 'notification-error';
      case 'info': 
      default: return 'notification-info';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      case 'info': 
      default: return 'ℹ';
    }
  };

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`notification ${getNotificationClass(notification.type)}`}
        >
          <div className="notification-icon">
            {getIcon(notification.type)}
          </div>
          <div className="notification-content">
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
          </div>
          <button 
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;