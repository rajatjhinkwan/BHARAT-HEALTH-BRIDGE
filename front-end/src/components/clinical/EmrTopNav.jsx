import React from 'react';
import { Heart, Search, Bell, FlaskConical, Image as ImageIcon, Scissors, Pill } from 'lucide-react';

const NAV_TABS = [
  { id: 'Lab', label: 'Lab', icon: FlaskConical },
  { id: 'Imaging', label: 'Imaging', icon: ImageIcon },
  { id: 'Surgery', label: 'Surgery', icon: Scissors },
  { id: 'Prescription', label: 'Prescription', icon: Pill },
];

export default function EmrTopNav({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  doctorInitials = 'DR',
  notificationCount = 1,
}) {
  return (
    <header className="emr-top-nav">
      <div className="emr-top-nav-brand">
        <div className="emr-brand-icon" aria-hidden>
          <Heart size={20} fill="currentColor" />
        </div>
        <div className="emr-brand-text-block">
          <span className="emr-brand-text">Bharat Health Bridge</span>
          <span className="emr-brand-sub">Electronic Medical Record</span>
        </div>
      </div>

      <nav className="emr-top-nav-tabs" aria-label="Record categories">
        {NAV_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`emr-nav-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => onTabChange(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="emr-top-nav-actions">
        <div className="emr-search-wrap">
          <Search size={16} className="emr-search-icon" />
          <input
            type="search"
            className="emr-search-input"
            placeholder="Search patients, records…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search patients and records"
          />
        </div>
        <button type="button" className="emr-nav-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          {notificationCount > 0 && <span className="emr-notif-dot" />}
        </button>
        <div className="emr-user-avatar" title="Signed-in clinician">
          {doctorInitials}
        </div>
      </div>
    </header>
  );
}
