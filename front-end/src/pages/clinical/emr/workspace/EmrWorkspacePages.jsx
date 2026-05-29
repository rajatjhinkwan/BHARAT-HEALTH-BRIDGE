import React from 'react';
import { Plus, FileText } from 'lucide-react';

export default function EmrWorkspacePages({
  pages,
  activeTab,
  currentPageIdx,
  onSelectPage,
  onAddPage,
}) {
  const tabPages = pages[activeTab] || [];

  return (
    <aside className="emr-ws-pages non-printable">
      <div className="emr-ws-pages-head">
        <h4>Pages</h4>
        <button type="button" className="emr-ws-btn" onClick={onAddPage} aria-label="Add page">
          <Plus size={14} />
        </button>
      </div>
      <div className="emr-ws-pages-list">
        {tabPages.map((page, idx) => {
          const thumb = page?.content;
          return (
            <button
              key={idx}
              type="button"
              className={`emr-ws-page-chip${currentPageIdx === idx ? ' active' : ''}`}
              onClick={() => onSelectPage(idx)}
            >
              <div className="emr-ws-page-thumb">
                {thumb ? (
                  <img src={thumb} alt="" />
                ) : (
                  <FileText size={18} color="#94a3b8" />
                )}
              </div>
              <div className="emr-ws-page-meta">Page {idx + 1}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-2 text-[8px] text-slate-400 font-black leading-normal border-t border-slate-100 flex items-center gap-1 uppercase tracking-wider select-none">
        <span>✨ Margin Optimizer Active</span>
      </div>
    </aside>
  );
}
