import { create } from 'zustand';

export const orderKey = (patientId, orderIndex) => `${patientId}:${orderIndex}`;

export const useRadiologyStore = create((set, get) => ({
  section: 'dashboard',
  orders: [],
  queueNodes: [],
  machines: [],
  selectedOrderKey: null,
  analytics: null,
  alerts: [],
  search: '',
  filterPriority: 'all',
  filterStatus: 'all',
  filterModality: 'all',
  sortBy: 'priority',
  loading: false,
  activityFeed: [],
  draftFindings: {},

  setSection: (section) => set({ section }),
  setOrders: (orders) => set({ orders }),
  setQueueNodes: (queueNodes) => set({ queueNodes }),
  setMachines: (machines) => set({ machines }),
  setAnalytics: (analytics) => set({ analytics }),
  setAlerts: (alerts) => set({ alerts }),
  setSearch: (search) => set({ search }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterModality: (filterModality) => set({ filterModality }),
  setSortBy: (sortBy) => set({ sortBy }),
  setLoading: (loading) => set({ loading }),

  selectOrder: (patientId, orderIndex) =>
    set({ selectedOrderKey: orderKey(patientId, orderIndex), section: 'reports' }),

  clearSelection: () => set({ selectedOrderKey: null }),

  pushActivity: (message, type = 'info') =>
    set((s) => ({
      activityFeed: [
        { id: `${Date.now()}`, message, time: new Date().toLocaleTimeString(), type },
        ...s.activityFeed.slice(0, 24),
      ],
    })),

  setDraftFinding: (key, fieldKey, value) =>
    set((s) => ({
      draftFindings: {
        ...s.draftFindings,
        [key]: { ...(s.draftFindings[key] || {}), [fieldKey]: value },
      },
    })),

  getDraftFindings: (key) => get().draftFindings[key] || {},
}));
