import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config';

const socket = io(API_BASE_URL.replace('/api', ''), { autoConnect: true });

/** Subscribe on doctor dashboards for radiology report delivery */
export function useDoctorRadiologyNotifications() {
  const [notifications, setNotifications] = useState([]);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onReady = (payload) => {
      setNotifications((prev) =>
        [
          {
            id: `rad-${Date.now()}`,
            patientId: payload.patientId || '',
            message: payload.isCritical
              ? 'Critical radiology report ready'
              : 'Radiology report ready for review',
            isCritical: !!payload.isCritical,
            time: new Date().toLocaleTimeString(),
            read: false,
          },
          ...prev,
        ].slice(0, 20)
      );
    };
    socket.on('radiologyReportReady', onReady);
    socket.on('radiologyCriticalAlert', (p) => onReady({ ...p, isCritical: true }));
    return () => {
      socket.off('radiologyReportReady', onReady);
      socket.off('radiologyCriticalAlert', onReady);
    };
  }, []);

  const markRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return { notifications, unread, markRead };
}
