import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config';

const socket = io(API_BASE_URL.replace('/api', ''), { autoConnect: true });

export interface LabNotification {
  id: string;
  patientId: string;
  message: string;
  isCritical: boolean;
  time: string;
  read?: boolean;
}

/** Subscribe on doctor dashboards for instant lab report delivery */
export function useDoctorLabNotifications() {
  const [notifications, setNotifications] = useState<LabNotification[]>([]);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onReady = (payload: { patientId?: string; isCritical?: boolean }) => {
      setNotifications((prev) => [
        {
          id: `lab-${Date.now()}`,
          patientId: payload.patientId || '',
          message: payload.isCritical ? 'Critical lab report ready' : 'Lab report ready for review',
          isCritical: !!payload.isCritical,
          time: new Date().toLocaleTimeString(),
          read: false,
        },
        ...prev,
      ].slice(0, 20));
    };
    socket.on('labReportReady', onReady);
    socket.on('labCriticalAlert', (p) => onReady({ ...p, isCritical: true }));
    return () => {
      socket.off('labReportReady', onReady);
      socket.off('labCriticalAlert', onReady);
    };
  }, []);

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return { notifications, unread, markRead };
}
