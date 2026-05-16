import React from 'react';
import { useHospital } from '../context/HospitalContext';
import StatCard from '../components/StatCard';
import { BarChart3, PieChart, Activity, ClipboardList } from 'lucide-react';

const Reports = () => {
  const { stats, wardStats, transfers } = useHospital();

  return (
    <div className="animate-fade-in fade-up" style={{ paddingBottom: '3rem' }}>
      <div className="page-header mb-6" style={{ padding: '0 1rem' }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem' }}>Hospital Analytics & Reports</h1>
        <p className="page-sub" style={{ fontSize: '1.1rem' }}>Comprehensive overview of hospital resources and patient flow.</p>
      </div>

      <div className="page-body" style={{ padding: '0 1rem' }}>
        <div className="stat-grid mb-8">
          <StatCard 
            title="Total Admissions" 
            value={stats.patients} 
            subtitle="Currently admitted"
            icon={<ClipboardList size={24} />}
            color="var(--color-primary)"
          />
          <StatCard 
            title="Total Transfers" 
            value={stats.transfers} 
            subtitle="Recent patient movements"
            icon={<Activity size={24} />}
            color="var(--color-warning)"
          />
          <StatCard 
            title="Avg Occupancy" 
            value={`${stats.total === 0 ? 0 : Math.round((stats.occupied / stats.total) * 100)}%`} 
            subtitle="Across all wards"
            icon={<PieChart size={24} />}
            color="var(--color-success)"
          />
          <StatCard 
            title="Beds in Maintenance" 
            value={stats.maintenance} 
            subtitle="Requires attention"
            icon={<BarChart3 size={24} />}
            color="var(--color-danger)"
          />
        </div>

        <div className="flex gap-6 mt-6 flex-wrap">
          <div className="card flex-1 min-w-[300px]" style={{ padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 className="mb-6" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>Ward Occupancy Breakdown</h3>
            <div className="flex flex-col gap-5">
              {wardStats.map(ward => (
                <div key={ward.ward} className="ward-row" style={{ padding: '0.5rem 0', border: 'none' }}>
                  <div className="ward-name" style={{ fontSize: '1.05rem', color: 'var(--text-main)', width: '120px' }}>{ward.ward}</div>
                  <div className="ward-progress progress-wrap" style={{ height: '10px', backgroundColor: 'var(--bg-main)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${ward.rate}%`, 
                        backgroundColor: ward.rate > 80 ? 'var(--color-danger)' : ward.rate > 50 ? 'var(--color-warning)' : 'var(--color-success)',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                  <div className="ward-nums" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-2)' }}>
                    {ward.occupied} / {ward.total}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card flex-1 min-w-[300px]" style={{ padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <h3 className="mb-0" style={{ fontSize: '1.4rem', padding: '2rem 2rem 1.5rem', backgroundColor: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>Transfer History Log</h3>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              {transfers.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem' }}>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-3)' }}>No transfer history available.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid rgba(0,0,0,0.05)', textAlign: 'left' }}>
                      <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted">Patient Name</th>
                      <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted">From</th>
                      <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted">To</th>
                      <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.slice(0, 10).map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }}>
                        <td className="p-4 text-md font-semibold" style={{ color: 'var(--text-main)' }}>{t.patientName}</td>
                        <td className="p-4 text-sm">
                          <span className="badge" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: 'var(--color-cleaning)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>{t.fromBed}</span>
                        </td>
                        <td className="p-4 text-sm">
                          <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>{t.toBed}</span>
                        </td>
                        <td className="p-4 text-sm font-medium text-right" style={{ color: 'var(--text-2)' }}>
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
