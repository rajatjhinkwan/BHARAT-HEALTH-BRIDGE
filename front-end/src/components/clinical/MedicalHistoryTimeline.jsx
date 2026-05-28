import React, { useMemo, useState } from 'react';
import { Filter, FlaskConical, Image as ImageIcon, Scissors, Pill, Clock, Search } from 'lucide-react';

const CATEGORY_MAP = {
  Lab: ['lab_report', 'blood_test', 'ecg', 'urinalysis', 'metabolic'],
  Imaging: ['mri', 'ct_scan', 'x_ray', 'ultrasound', 'imaging'],
  Surgery: ['surgery', 'procedure', 'operative'],
  Prescription: ['prescription', 'medication'],
};

function inferCategory(type = '', title = '') {
  const t = `${type} ${title}`.toLowerCase();
  if (CATEGORY_MAP.Imaging.some((k) => t.includes(k))) return 'Imaging';
  if (CATEGORY_MAP.Surgery.some((k) => t.includes(k))) return 'Surgery';
  if (CATEGORY_MAP.Prescription.some((k) => t.includes(k))) return 'Prescription';
  if (CATEGORY_MAP.Lab.some((k) => t.includes(k))) return 'Lab';
  if (t.includes('lipid') || t.includes('cbc') || t.includes('hba1c') || t.includes('panel') || t.includes('lab')) {
    return 'Lab';
  }
  return 'Lab';
}

function statusBadge(record) {
  const title = (record.title || '').toLowerCase();
  if (title.includes('elevated') || title.includes('high') || record.status === 'elevated') {
    return { label: 'Elevated', className: 'badge-elevated' };
  }
  if (title.includes('critical') || record.status === 'critical') {
    return { label: 'Critical', className: 'badge-critical' };
  }
  return { label: 'Normal', className: 'badge-normal' };
}

function formatDateGroup(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return isToday ? `Today — ${label}` : label;
}

function buildDetailLines(record) {
  const pd = record.prescriptionDetails || record.labDetails || record.details || {};
  if (typeof pd === 'string') return [pd];
  const lines = [];

  // Extract and format prescribed medicines for doctor/patient view
  if (Array.isArray(pd.medicines) && pd.medicines.length > 0) {
    pd.medicines.forEach((med) => {
      if (med.name) {
        lines.push(`💊 ${med.name} — ${med.dosage || med.dose || 'As advised'} (${med.duration || med.days || 'As directed'})`);
      }
    });
  }

  if (pd.hemoglobin) lines.push(`Hemoglobin: ${pd.hemoglobin}`);
  if (pd.wbc) lines.push(`WBC: ${pd.wbc}`);
  if (pd.platelets) lines.push(`Platelets: ${pd.platelets}`);
  if (pd.ldl) lines.push(`LDL: ${pd.ldl}`);
  if (pd.hdl) lines.push(`HDL: ${pd.hdl}`);
  if (pd.triglycerides) lines.push(`Triglycerides: ${pd.triglycerides}`);
  if (pd.glucose) lines.push(`Glucose: ${pd.glucose}`);
  if (pd.creatinine) lines.push(`Creatinine: ${pd.creatinine}`);
  if (pd.egfr) lines.push(`eGFR: ${pd.egfr}`);
  if (pd.ph) lines.push(`pH: ${pd.ph}`);
  if (pd.specificGravity) lines.push(`Specific gravity: ${pd.specificGravity}`);
  if (pd.value) lines.push(String(pd.value));
  if (pd.diagnosis) lines.push(`Diagnosis: ${pd.diagnosis}`);
  if (pd.notes) lines.push(`Notes: ${pd.notes}`);
  if (record.notes) lines.push(record.notes);
  
  if (!lines.length && record.type) {
    lines.push(record.type.replace(/_/g, ' '));
  }
  return lines.slice(0, 10);
}

export default function MedicalHistoryTimeline({
  records = [],
  timeline = [],
  activeCategory = 'Lab',
  onCategoryChange,
  searchQuery = '',
  onSearchChange,
  loading = false,
  onUploadReport,
}) {
  const [showFilter, setShowFilter] = useState(false);

  const merged = useMemo(() => {
    const fromTimeline = (timeline || []).map((e) => ({
      _id: `tl-${e.timestamp}-${e.action}`,
      title: e.details || e.action,
      type: (e.action || '').toLowerCase(),
      doctor: e.performedBy,
      createdAt: e.timestamp,
      category: inferCategory((e.action || '').toLowerCase(), e.details),
    }));
    const fromHistory = (records || []).map((r) => ({
      ...r,
      category: inferCategory(r.type, r.title),
    }));
    return [...fromHistory, ...fromTimeline].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [records, timeline]);

  const counts = useMemo(() => {
    const c = { Lab: 0, Imaging: 0, Surgery: 0, Prescription: 0 };
    merged.forEach((r) => {
      const cat = r.category || inferCategory(r.type, r.title);
      if (c[cat] !== undefined) c[cat] += 1;
    });
    return c;
  }, [merged]);

  const filtered = useMemo(() => {
    let list = merged.filter((r) => (r.category || inferCategory(r.type, r.title)) === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.doctor || '').toLowerCase().includes(q) ||
          (r.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [merged, activeCategory, searchQuery]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((r) => {
      const key = r.createdAt ? formatDateGroup(r.createdAt) : 'Undated';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups);
  }, [filtered]);

  const totalRecords = merged.length;
  const pills = [
    { id: 'Lab', icon: FlaskConical },
    { id: 'Imaging', icon: ImageIcon },
    { id: 'Surgery', icon: Scissors },
    { id: 'Prescription', icon: Pill },
  ];

  return (
    <div className="emr-middle-col medical-history-panel">
      <div className="timeline-header">
        <div className="timeline-title-block">
          <h2 className="timeline-title">Medical History Timeline</h2>
          <p className="timeline-subtitle">
            {totalRecords} record{totalRecords !== 1 ? 's' : ''} across all categories
          </p>
        </div>
        <div className="timeline-header-actions">
          <div className="timeline-search-wrap">
            <Search size={14} className="timeline-search-icon" />
            <input
              type="search"
              className="timeline-search-input"
              placeholder="Search records, doctors…"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              aria-label="Search medical history"
            />
          </div>
          <button
            type="button"
            className="timeline-filter-btn"
            onClick={() => setShowFilter((v) => !v)}
          >
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      {showFilter && onUploadReport && (
        <div className="timeline-toolbar">
          <button type="button" className="timeline-upload-btn" onClick={onUploadReport}>
            Upload report
          </button>
        </div>
      )}

      <div className="timeline-category-pills">
        {pills.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`timeline-pill${activeCategory === id ? ' active' : ''}`}
            onClick={() => onCategoryChange(id)}
          >
            <Icon size={14} />
            {id} <span className="pill-count">{counts[id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="timeline-content emr-timeline-scroll">
        {loading && <p className="timeline-loading">Loading records…</p>}
        {!loading && grouped.length === 0 && (
          <div className="timeline-empty">
            <Clock size={40} />
            <p>No {activeCategory.toLowerCase()} records yet</p>
          </div>
        )}
        {grouped.map(([dateLabel, items]) => (
          <div key={dateLabel} className="timeline-date-group">
            <div className="timeline-date-label">{dateLabel}</div>
            <div className="timeline-date-entries">
              {items.map((record) => {
                const badge = statusBadge(record);
                const details = buildDetailLines(record);
                const time = record.createdAt
                  ? new Date(record.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';
                return (
                  <article key={record._id} className="timeline-entry-card">
                    <div className="timeline-entry-main">
                      <h4 className="timeline-entry-title">{record.title || 'Clinical record'}</h4>
                      {details.length > 0 && (
                        <ul className="timeline-entry-values">
                          {details.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      )}
                      {record.fileUrl && (record.fileUrl.startsWith('data:image/') || record.fileUrl.startsWith('http')) && (
                        <div className="timeline-canvas-preview" style={{ marginTop: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', background: '#fff', display: 'inline-block' }}>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Handwritten Canvas Pad</span>
                          <img src={record.fileUrl} alt="Visual Prescription" style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: '4px', display: 'block' }} />
                        </div>
                      )}
                      <div className="timeline-entry-meta" style={{ marginTop: '8px' }}>
                        <span>{time}</span>
                        <span>·</span>
                        <span>{record.doctor || 'Attending physician'}</span>
                      </div>
                    </div>
                    <span className={`timeline-status-badge ${badge.className}`}>{badge.label}</span>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
