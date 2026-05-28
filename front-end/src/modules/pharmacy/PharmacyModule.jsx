import './pharmacy.css';
import { usePharmacyStore } from './store/pharmacyStore';
import { usePharmacyData } from './hooks/usePharmacyData';
import PharmacySidebar from './components/layout/PharmacySidebar';
import PharmacyHeader from './components/layout/PharmacyHeader';
import DashboardSection from './sections/DashboardSection';
import InventorySection from './sections/InventorySection';
import DispenseSection from './sections/DispenseSection';
import AlertsSection from './sections/AlertsSection';
import ExpirySection from './sections/ExpirySection';
import SuppliersSection from './sections/SuppliersSection';
import PurchaseOrdersSection from './sections/PurchaseOrdersSection';
import HistorySection from './sections/HistorySection';
import ReturnsSection from './sections/ReturnsSection';
import AnalyticsSection from './sections/AnalyticsSection';

const SECTIONS = {
  dashboard: DashboardSection,
  inventory: InventorySection,
  dispense: DispenseSection,
  alerts: AlertsSection,
  expiry: ExpirySection,
  suppliers: SuppliersSection,
  orders: PurchaseOrdersSection,
  history: HistorySection,
  returns: ReturnsSection,
  analytics: AnalyticsSection,
};

export default function PharmacyModule() {
  const { section, darkMode } = usePharmacyStore();
  usePharmacyData();

  const Section = SECTIONS[section] || DashboardSection;

  return (
    <div className={`pharmacy-module ${darkMode ? 'ph-dark' : ''}`}>
      <div className="ph-layout">
        <PharmacySidebar />
        <div className="ph-main">
          <PharmacyHeader />
          <main className="ph-content">
            <Section />
          </main>
        </div>
      </div>
    </div>
  );
}
