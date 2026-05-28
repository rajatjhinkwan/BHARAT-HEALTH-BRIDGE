import React, { useState, useEffect, createContext, useContext } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification-toast no-print notification-toast--${n.type}`} style={{ 
            borderLeftColor: n.type === 'error' ? 'var(--danger)' : n.type === 'warning' ? 'var(--warning)' : n.type === 'success' ? 'var(--success)' : 'var(--primary)'
          }}>
            {n.type === 'success' && <CheckCircle className="text-success" size={20} />}
            {n.type === 'warning' && <AlertTriangle className="text-warning" size={20} />}
            {n.type === 'error' && <X className="text-danger" size={20} />}
            {n.type === 'info' && <Info className="text-primary" size={20} />}
            
            <div className="flex-1">
              <p className="m-0 text-sm font-semibold notification-toast__message">{n.message}</p>
            </div>
            
            <button onClick={() => removeNotification(n.id)} className="notification-toast__close-btn" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
