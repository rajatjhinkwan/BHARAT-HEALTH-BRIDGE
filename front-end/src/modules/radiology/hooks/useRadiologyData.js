import { useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config';
import {
  fetchRadiologyAlerts,
  fetchRadiologyAnalytics,
  fetchRadiologyOrders,
  fetchRadiologyQueue,
  fetchImagingMachines,
} from '../api/radiologyApi';
import { useRadiologyStore } from '../store/radiologyStore';

const socket = io(API_BASE_URL.replace('/api', ''), { autoConnect: true });

function playUrgentBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    /* ignore */
  }
}

export function useRadiologyData() {
  const {
    setOrders,
    setAnalytics,
    setAlerts,
    setQueueNodes,
    setMachines,
    setLoading,
    pushActivity,
    orders,
  } = useRadiologyStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [orderList, analytics, alerts, queue, machines] = await Promise.all([
        fetchRadiologyOrders(),
        fetchRadiologyAnalytics().catch(() => ({
          totalPending: 0,
          inProgress: 0,
          awaitingReport: 0,
          completedToday: 0,
          criticalCount: 0,
          avgTurnaroundMinutes: 75,
          commonModalities: [],
          volumeByDay: [],
        })),
        fetchRadiologyAlerts().catch(() => []),
        fetchRadiologyQueue().catch(() => []),
        fetchImagingMachines().catch(() => []),
      ]);
      setOrders(orderList);
      setAnalytics(analytics);
      setAlerts(alerts);
      setQueueNodes(queue);
      setMachines(machines);
    } catch (err) {
      console.error('Radiology refresh failed:', err);
      pushActivity('Failed to load imaging queue — check login', 'critical');
    } finally {
      setLoading(false);
    }
  }, [setOrders, setAnalytics, setAlerts, setQueueNodes, setMachines, setLoading, pushActivity]);

  useEffect(() => {
    refresh();
    const onUpdate = (payload) => {
      refresh();
      if (payload?.type === 'radiology') pushActivity('Imaging queue updated', 'info');
    };
    const onCritical = () => {
      playUrgentBeep();
      pushActivity('Critical imaging finding received', 'critical');
      refresh();
    };
    socket.on('serviceUpdate', onUpdate);
    socket.on('radiologyOrderUpdated', onUpdate);
    socket.on('radiologyOrderCreated', onUpdate);
    socket.on('radiologyReportReady', onUpdate);
    socket.on('radiologyCriticalAlert', onCritical);
    socket.on('queueUpdated', (p) => {
      if (p?.department === 'Radiology') refresh();
    });
    return () => {
      socket.off('serviceUpdate', onUpdate);
      socket.off('radiologyOrderUpdated', onUpdate);
      socket.off('radiologyOrderCreated', onUpdate);
      socket.off('radiologyReportReady', onUpdate);
      socket.off('radiologyCriticalAlert', onCritical);
      socket.off('queueUpdated');
    };
  }, [refresh, pushActivity]);

  return { refresh, orders };
}
