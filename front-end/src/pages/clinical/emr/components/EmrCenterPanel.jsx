import React, { useRef } from 'react';
import MedicalHistoryTimeline from '../../../../components/clinical/MedicalHistoryTimeline';

export default function EmrCenterPanel({
  patient,
  medicalHistory,
  historyLoading,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onReportUpload,
}) {
  const reportInputRef = useRef(null);

  return (
    <section className="emr-col emr-col-center">
      <input ref={reportInputRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={onReportUpload} />
      <MedicalHistoryTimeline
        records={medicalHistory}
        timeline={patient.timeline}
        activeCategory={activeTab}
        onCategoryChange={onTabChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        loading={historyLoading}
        onUploadReport={() => reportInputRef.current?.click()}
      />
    </section>
  );
}
