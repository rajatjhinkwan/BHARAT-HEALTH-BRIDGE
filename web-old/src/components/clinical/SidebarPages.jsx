import React from 'react';
import { Plus, FileText } from 'lucide-react';

const SidebarPages = ({ pages, activeActionTab, currentPageIdx, setCurrentPageIdx, addPage }) => {
  return (
    <div className="workspace-sidebar non-printable">
      <div className="sidebar-header flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encounter Pages</h4>
        <button 
          className="p-1 hover:bg-slate-100 rounded text-primary transition-colors" 
          onClick={addPage} 
          title="Add Page"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="pages-stack space-y-3 overflow-y-auto pr-1 max-h-[calc(100vh-250px)]">
        {pages[activeActionTab].map((_, idx) => (
          <div 
            key={idx} 
            className={`page-thumbnail-card ${currentPageIdx === idx ? 'active' : ''}`}
            onClick={() => setCurrentPageIdx(idx)}
          >
            <div className="thumbnail-preview relative group">
              {pages[activeActionTab][idx] ? (
                <img src={pages[activeActionTab][idx]} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <FileText size={20} />
                </div>
              )}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary bg-white px-2 py-1 rounded shadow-sm">VIEW PAGE</span>
              </div>
            </div>
            <div className="page-info">
              <span className="page-number text-[10px] font-bold text-slate-700">PAGE {idx + 1}</span>
              <span className="page-status text-[8px] font-bold text-slate-400 uppercase">
                {pages[activeActionTab][idx] ? 'Drafted' : 'Empty'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarPages;
