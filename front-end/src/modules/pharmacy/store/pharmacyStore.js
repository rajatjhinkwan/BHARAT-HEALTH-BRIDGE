import { create } from 'zustand';

export const usePharmacyStore = create((set, get) => ({
  section: 'dashboard',
  loading: false,
  stats: null,
  medicines: [],
  medicinesTotal: 0,
  prescriptions: [],
  selectedRx: null,
  alerts: [],
  expiry: null,
  suppliers: [],
  purchaseOrders: [],
  history: [],
  reports: null,
  reorderSuggestions: [],
  searchQuery: '',
  inventoryFilter: { status: '', category: '', search: '' },
  inventoryPage: 1,
  recentSearches: [],
  activityFeed: [],
  darkMode: false,
  soundAlerts: true,
  selectedMedicine: null,
  _hydrated: false,

  setSection: (section) => set({ section }),
  setHydrated: (v) => set({ _hydrated: v }),
  setLoading: (loading) => set({ loading }),
  setStats: (stats) => set({ stats }),
  setMedicines: (items, total) => set({ medicines: items, medicinesTotal: total ?? items.length }),
  setPrescriptions: (prescriptions) => set({ prescriptions }),
  setSelectedRx: (selectedRx) => set({ selectedRx }),
  setAlerts: (alerts) => set({ alerts }),
  setExpiry: (expiry) => set({ expiry }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setPurchaseOrders: (purchaseOrders) => set({ purchaseOrders }),
  setHistory: (history) => set({ history }),
  setReports: (reports) => set({ reports }),
  setReorderSuggestions: (reorderSuggestions) => set({ reorderSuggestions }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setInventoryFilter: (patch) => set({ inventoryFilter: { ...get().inventoryFilter, ...patch } }),
  setInventoryPage: (inventoryPage) => set({ inventoryPage }),
  addRecentSearch: (q) => {
    const trimmed = q?.trim();
    if (!trimmed) return;
    const prev = get().recentSearches.filter((s) => s !== trimmed);
    set({ recentSearches: [trimmed, ...prev].slice(0, 8) });
  },
  pushActivity: (msg) =>
    set({
      activityFeed: [{ id: Date.now(), msg, ts: new Date().toISOString() }, ...get().activityFeed].slice(0, 20),
    }),
  setDarkMode: (darkMode) => set({ darkMode }),
  setSoundAlerts: (soundAlerts) => set({ soundAlerts }),
  setSelectedMedicine: (selectedMedicine) => set({ selectedMedicine }),
  addMedicine: (medicine) => set((state) => {
    const exists = state.medicines.some((m) => (m.id || m._id) === (medicine.id || medicine._id));
    if (exists) return {};
    const updated = [...state.medicines, medicine].sort((a, b) => a.name.localeCompare(b.name));
    return { medicines: updated, medicinesTotal: updated.length };
  }),
  updateMedicineInList: (medicine) => set((state) => {
    const updated = state.medicines.map((m) =>
      (m.id || m._id) === (medicine.id || medicine._id) ? medicine : m
    ).sort((a, b) => a.name.localeCompare(b.name));
    const selected = state.selectedMedicine && (state.selectedMedicine.id || state.selectedMedicine._id) === (medicine.id || medicine._id)
      ? medicine
      : state.selectedMedicine;
    return { medicines: updated, selectedMedicine: selected };
  }),
}));
