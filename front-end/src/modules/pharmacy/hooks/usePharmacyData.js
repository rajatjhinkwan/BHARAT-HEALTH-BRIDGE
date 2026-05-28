import { useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config';
import { usePharmacyStore } from '../store/pharmacyStore';
import {
  fetchDashboard,
  fetchMedicines,
  fetchPendingPrescriptions,
  fetchAlerts,
  fetchExpiry,
  fetchSuppliers,
  fetchPurchaseOrders,
  fetchHistory,
  fetchReports,
} from '../api/pharmacyApi';

const socket = io(API_BASE_URL.replace('/api', ''), { autoConnect: true });

function playAlertBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* ignore */
  }
}

export function usePharmacyData() {
  const {
    section,
    inventoryFilter,
    inventoryPage,
    _hydrated,
    setLoading,
    setHydrated,
    setStats,
    setMedicines,
    setPrescriptions,
    setAlerts,
    setExpiry,
    setSuppliers,
    setPurchaseOrders,
    setHistory,
    setReports,
    setReorderSuggestions,
    pushActivity,
    soundAlerts,
  } = usePharmacyStore();

  // ---------- full refresh (all endpoints) ----------
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, medRes, rx, alerts, expiry, suppliers, orders, history, reports] = await Promise.all([
        fetchDashboard().catch(() => ({ stats: {}, reorderSuggestions: [] })),
        fetchMedicines({
          page: 1,
          limit: 10000,
        }).catch(() => ({ items: [], total: 0 })),
        fetchPendingPrescriptions().catch(() => []),
        fetchAlerts().catch(() => []),
        fetchExpiry().catch(() => null),
        fetchSuppliers().catch(() => []),
        fetchPurchaseOrders().catch(() => []),
        fetchHistory({ limit: 80 }).catch(() => []),
        fetchReports().catch(() => null),
      ]);

      setStats(dash.stats || dash);
      setReorderSuggestions(dash.reorderSuggestions || []);
      setMedicines(medRes.items || [], medRes.total);
      setPrescriptions(rx);
      setAlerts(alerts);
      setExpiry(expiry);
      setSuppliers(suppliers);
      setPurchaseOrders(orders);
      setHistory(history);
      setReports(reports);
      setHydrated(true);
    } finally {
      setLoading(false);
    }
  }, [
    inventoryFilter,
    inventoryPage,
    setLoading,
    setHydrated,
    setStats,
    setMedicines,
    setPrescriptions,
    setAlerts,
    setExpiry,
    setSuppliers,
    setPurchaseOrders,
    setHistory,
    setReports,
    setReorderSuggestions,
  ]);

  // ---------- lightweight medicines-only refresh ----------
  const refreshMedicinesOnly = useCallback(async () => {
    try {
      const medRes = await fetchMedicines({
        page: 1,
        limit: 10000,
      }).catch(() => ({ items: [], total: 0 }));
      setMedicines(medRes.items || [], medRes.total);
    } catch {
      /* swallow – medicines stay cached */
    }
  }, [setMedicines]);

  // ======================================================
  // 1) Initial hydration — fetch everything ONCE on mount
  //    if the store has never been populated in this session.
  //    After that, 30-second background polling keeps it fresh.
  // ======================================================
  const didMountRef = useRef(false);

  useEffect(() => {
    // Always fetch on first mount of the hook (entering Pharmacy module).
    // If already hydrated, data is shown instantly from the store and then
    // a silent background refresh keeps it up-to-date.
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (!_hydrated) {
        // First-ever load — show loading spinner and fetch everything
        refresh();
      } else {
        // Already hydrated — do a silent background refresh (no spinner)
        refresh();
      }
    }

    // Background polling every 30 s
    const poll = setInterval(refresh, 30000);
    socket.emit('joinPharmacy');

    const onUpdate = (payload) => {
      if (!payload?.type || payload.type === 'pharmacy') {
        refresh();
        pushActivity('Inventory synced live');
      }
    };

    const onStockLow = (payload) => {
      refresh();
      pushActivity(`Low stock: ${payload?.name || 'medicine'}`);
      if (soundAlerts) playAlertBeep();
    };

    const onDispensed = () => {
      refresh();
      pushActivity('Prescription dispensed — stock updated');
    };

    socket.on('serviceUpdate', onUpdate);
    socket.on('pharmacyInventoryUpdated', refresh);
    socket.on('pharmacyStockLow', onStockLow);
    socket.on('pharmacyDispensed', onDispensed);
    socket.on('pharmacyUpdate', refresh);
    socket.on('pharmacyOrderUpdated', refresh);
    socket.on('prescriptionUpdate', refresh);

    return () => {
      clearInterval(poll);
      socket.emit('leavePharmacy');
      socket.off('serviceUpdate', onUpdate);
      socket.off('pharmacyInventoryUpdated', refresh);
      socket.off('pharmacyStockLow', onStockLow);
      socket.off('pharmacyDispensed', onDispensed);
      socket.off('pharmacyUpdate', refresh);
      socket.off('pharmacyOrderUpdated', refresh);
      socket.off('prescriptionUpdate', refresh);
    };
  }, [refresh, pushActivity, soundAlerts, _hydrated]);

  // Caching and client-side filtering are handled in the UI views.

  return { refresh, socket };
}
