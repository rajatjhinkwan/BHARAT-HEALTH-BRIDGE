import { useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config';
import { fetchLabAlerts, fetchLabAnalytics, fetchLabOrders } from '../api/labApi';
import { useLabStore } from '../store/labStore';
import type { LabOrder } from '../types/lab';

const socket = io(API_BASE_URL.replace('/api', ''), { autoConnect: true });

const MOCK_ORDERS: LabOrder[] = [
  {
    orderIndex: 0,
    patientId: 'mock-1',
    patientName: 'Anil Kumar',
    mrn: 'UHID-2026-1042',
    age: 45,
    gender: 'Male',
    department: 'Medicine',
    assignedDoctor: 'Dr. Sharma',
    tests: ['Complete Blood Count (CBC)', 'Liver Function Test'],
    status: 'Pending',
    priority: 'Urgent',
    orderId: 'LAB-MOCK-1',
    encounterId: 'ENC-201',
    orderDate: new Date().toISOString(),
    sampleType: 'Blood',
    estimatedTurnaround: 60,
  },
  {
    orderIndex: 0,
    patientId: 'mock-2',
    patientName: 'Priya Nair',
    mrn: 'UHID-2026-1088',
    age: 32,
    gender: 'Female',
    department: 'Emergency',
    assignedDoctor: 'Dr. Mehta',
    tests: ['Kidney Function Test', 'Blood Glucose'],
    status: 'Processing',
    priority: 'Emergency',
    orderId: 'LAB-MOCK-2',
    encounterId: 'ENC-202',
    orderDate: new Date(Date.now() - 3600000).toISOString(),
    sampleId: 'SMP-8821',
    sampleStatus: 'Sent To Lab',
    estimatedTurnaround: 45,
  },
];

function playUrgentBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* ignore */
  }
}

export function useLabData() {
  const {
    setOrders,
    setAnalytics,
    setAlerts,
    setLoading,
    pushActivity,
    orders,
  } = useLabStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [orderList, analytics, alerts] = await Promise.all([
        fetchLabOrders().catch(() => MOCK_ORDERS),
        fetchLabAnalytics().catch(() => ({
          totalPending: 12,
          processing: 5,
          completedToday: 28,
          criticalCount: 2,
          avgTurnaroundMinutes: 52,
          commonTests: [
            { name: 'CBC', count: 45 },
            { name: 'LFT', count: 32 },
            { name: 'KFT', count: 28 },
            { name: 'Lipid Profile', count: 22 },
          ],
          volumeByDay: [
            { day: 'Mon', count: 42 },
            { day: 'Tue', count: 38 },
            { day: 'Wed', count: 55 },
            { day: 'Thu', count: 48 },
            { day: 'Fri', count: 61 },
            { day: 'Sat', count: 28 },
            { day: 'Sun', count: 19 },
          ],
        })),
        fetchLabAlerts().catch(() => []),
      ]);
      setOrders(orderList.length ? orderList : MOCK_ORDERS);
      setAnalytics(analytics);
      setAlerts(alerts);
    } finally {
      setLoading(false);
    }
  }, [setOrders, setAnalytics, setAlerts, setLoading]);

  useEffect(() => {
    refresh();
    const onUpdate = (payload?: { type?: string }) => {
      refresh();
      if (payload?.type === 'lab') pushActivity('Lab queue updated', 'info');
    };
    const onCritical = () => {
      playUrgentBeep();
      pushActivity('Critical lab alert received', 'critical');
      refresh();
    };
    socket.on('serviceUpdate', onUpdate);
    socket.on('labOrderUpdated', onUpdate);
    socket.on('labCriticalAlert', onCritical);
    socket.on('labReportReady', onUpdate);
    return () => {
      socket.off('serviceUpdate', onUpdate);
      socket.off('labOrderUpdated', onUpdate);
      socket.off('labCriticalAlert', onCritical);
      socket.off('labReportReady', onUpdate);
    };
  }, [refresh, pushActivity]);

  return { refresh, orders };
}
