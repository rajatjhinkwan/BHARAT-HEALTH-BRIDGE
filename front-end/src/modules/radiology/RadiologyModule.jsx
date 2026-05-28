import { AnimatePresence, motion } from 'framer-motion';
import './radiology.css';
import { RadiologyHeader } from './components/layout/RadiologyHeader';
import { RadiologySidebar } from './components/layout/RadiologySidebar';
import { useRadiologyStore } from './store/radiologyStore';
import { useRadiologyData } from './hooks/useRadiologyData';
import { RadiologyDashboardSection } from './sections/RadiologyDashboardSection';
import { IncomingQueueSection } from './sections/IncomingQueueSection';
import { ScanningSection } from './sections/ScanningSection';
import { ReportEntrySection } from './sections/ReportEntrySection';
import { CompletedSection } from './sections/CompletedSection';
import { RadiologyAnalyticsSection } from './sections/RadiologyAnalyticsSection';

const SECTIONS = {
  dashboard: <RadiologyDashboardSection />,
  incoming: <IncomingQueueSection />,
  scanning: <ScanningSection />,
  reports: <ReportEntrySection />,
  completed: <CompletedSection />,
  analytics: <RadiologyAnalyticsSection />,
};

export default function RadiologyModule() {
  const { section } = useRadiologyStore();
  useRadiologyData();

  return (
    <div className="radiology-module flex min-h-[calc(100vh-64px)] bg-[var(--background)]">
      <RadiologySidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <RadiologyHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {SECTIONS[section] || SECTIONS.dashboard}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
