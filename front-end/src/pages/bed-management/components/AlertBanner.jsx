import React, { useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const iconMap = {
  success: { Icon: CheckCircle,  color: 'var(--success)', cls: 'toast-success' },
  danger:  { Icon: AlertCircle,  color: 'var(--danger)',  cls: 'toast-danger'  },
  warning: { Icon: AlertTriangle,color: 'var(--warning)', cls: 'toast-warning' },
  info:    { Icon: Info,         color: 'var(--info)',    cls: 'toast-info'    },
};

const Toast = ({ alert, removeAlert }) => {
  const { Icon, color, cls } = iconMap[alert.type] || iconMap.info;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      removeAlert(alert.id);
    }, 3000); // Increased to 3 seconds
    return () => clearTimeout(timer);
  }, [alert.id, removeAlert]);

  return (
    <div className={`toast ${cls}`}>
      <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p className="toast-msg">{alert.message}</p>
        <p className="toast-time">{new Date(alert.time).toLocaleTimeString()}</p>
      </div>
      <button className="toast-close" onClick={() => removeAlert(alert.id)} title="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
};

const AlertBanner = () => {
  const { alerts, removeAlert } = useHospital();
  if (alerts.length === 0) return null;

  return (
    <div className="toast-container">
      {alerts.map(alert => (
        <Toast key={alert.id} alert={alert} removeAlert={removeAlert} />
      ))}
    </div>
  );
};

export default AlertBanner;
