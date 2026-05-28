import { create } from 'zustand';
import type { LabOrder, LabSection } from '../types/lab';

interface LabAnalytics {
  totalPending: number;
  processing: number;
  completedToday: number;
  criticalCount: number;
  avgTurnaroundMinutes: number;
  commonTests: { name: string; count: number }[];
  volumeByDay: { day: string; count: number }[];
}

interface LabStore {
  section: LabSection;
  orders: LabOrder[];
  selectedOrderKey: string | null;
  analytics: LabAnalytics | null;
  alerts: unknown[];
  search: string;
  filterPriority: string;
  filterStatus: string;
  filterDepartment: string;
  sortBy: 'time' | 'priority';
  loading: boolean;
  activityFeed: { id: string; message: string; time: string; type: string }[];
  draftMetrics: Record<string, Record<string, Record<string, string | number>>>;
  setSection: (s: LabSection) => void;
  setOrders: (o: LabOrder[]) => void;
  setAnalytics: (a: LabAnalytics) => void;
  setAlerts: (a: unknown[]) => void;
  setSearch: (s: string) => void;
  setFilterPriority: (p: string) => void;
  setFilterStatus: (s: string) => void;
  setFilterDepartment: (d: string) => void;
  setSortBy: (s: 'time' | 'priority') => void;
  setLoading: (l: boolean) => void;
  selectOrder: (patientId: string, orderIndex: number) => void;
  clearSelection: () => void;
  pushActivity: (message: string, type?: string) => void;
  setDraftMetric: (key: string, testId: string, fieldKey: string, value: string | number) => void;
  getDraftMetrics: (key: string) => Record<string, Record<string, string | number>>;
}

export const orderKey = (patientId: string, orderIndex: number) => `${patientId}:${orderIndex}`;

export const useLabStore = create<LabStore>((set, get) => ({
  section: 'dashboard',
  orders: [],
  selectedOrderKey: null,
  analytics: null,
  alerts: [],
  search: '',
  filterPriority: 'all',
  filterStatus: 'all',
  filterDepartment: 'all',
  sortBy: 'priority',
  loading: false,
  activityFeed: [],
  draftMetrics: {},

  setSection: (section) => set({ section }),
  setOrders: (orders) => set({ orders }),
  setAnalytics: (analytics) => set({ analytics }),
  setAlerts: (alerts) => set({ alerts }),
  setSearch: (search) => set({ search }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterDepartment: (filterDepartment) => set({ filterDepartment }),
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

  setDraftMetric: (key, testId, fieldKey, value) =>
    set((s) => ({
      draftMetrics: {
        ...s.draftMetrics,
        [key]: {
          ...(s.draftMetrics[key] || {}),
          [testId]: { ...(s.draftMetrics[key]?.[testId] || {}), [fieldKey]: value },
        },
      },
    })),

  getDraftMetrics: (key) => get().draftMetrics[key] || {},
}));
