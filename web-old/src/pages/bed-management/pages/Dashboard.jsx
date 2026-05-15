import React from 'react';
import { useHospital } from '../context/HospitalContext';
import StatCard from '../components/StatCard';
import { Users, BedDouble, Activity, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { beds, patients, transfers } = useHospital();

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
  const availableBeds = beds.filter(b => b.status === 'Available').length;
  const cleaningBeds = beds.filter(b => b.status === 'Cleaning').length;
  const occupancyRate = totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100);

  const icuBeds = beds.filter(b => b.ward === 'ICU');
  const icuOccupied = icuBeds.filter(b => b.status === 'Occupied').length;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time hospital bed availability and patient metrics.</p>
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="bed-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard 
          title="Occupancy Rate" 
          value={`${occupancyRate}%`} 
          subtitle={`${occupiedBeds} out of ${totalBeds} beds`}
          icon={<Activity size={24} />}
          color="var(--color-primary)"
        />
        <StatCard 
          title="Available Beds" 
          value={availableBeds} 
          subtitle={`${cleaningBeds} currently cleaning`}
          icon={<BedDouble size={24} />}
          color="var(--color-success)"
        />
        <StatCard 
          title="Total Patients" 
          value={patients.length} 
          subtitle="Currently admitted"
          icon={<Users size={24} />}
          color="var(--color-purple)"
        />
        <StatCard 
          title="ICU Status" 
          value={`${icuOccupied}/${icuBeds.length}`} 
          subtitle="Beds Occupied"
          icon={<AlertTriangle size={24} />}
          color={icuOccupied === icuBeds.length ? "var(--color-danger)" : "var(--color-warning)"}
        />
      </div>

      <div className="flex gap-6 mt-6" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <div className="surface" style={{ flex: '2 1 400px' }}>
          <h3>Recent Transfers</h3>
          <div style={{ marginTop: '1rem' }}>
            {transfers.length === 0 ? (
              <p className="text-sm">No recent transfers.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bg-main)', textAlign: 'left', color: 'var(--text-tertiary)' }}>
                    <th className="text-sm pb-2 font-medium">Patient</th>
                    <th className="text-sm pb-2 font-medium">From -&gt; To</th>
                    <th className="text-sm pb-2 font-medium">Reason</th>
                    <th className="text-sm pb-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.slice(0, 5).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--bg-main)' }}>
                      <td className="py-2 text-sm font-medium">{t.patientName}</td>
                      <td className="py-2 text-sm">
                        <span className="badge" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }}>{t.fromBed}</span>
                        <span style={{ margin: '0 8px', color: 'var(--text-tertiary)' }}>→</span>
                        <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'white' }}>{t.toBed}</span>
                      </td>
                      <td className="py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.reason}</td>
                      <td className="py-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="surface" style={{ flex: '1 1 300px' }}>
          <h3 style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Bed Status Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {['Available', 'Occupied', 'Cleaning', 'Reserved', 'Maintenance'].map(status => {
              const count = beds.filter(b => b.status === status).length;
              const percentage = totalBeds === 0 ? 0 : (count / totalBeds) * 100;
              let color = 'var(--text-tertiary)';
              if (status === 'Available') color = 'var(--color-success)';
              if (status === 'Occupied') color = 'var(--color-danger)';
              if (status === 'Cleaning') color = 'var(--color-cleaning)';
              if (status === 'Reserved') color = 'var(--color-warning)';
              
              return (
                <div key={status} style={{ padding: '0.25rem 0' }}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-primary">{status}</span>
                    <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{count} <span style={{ color: 'var(--text-3)', fontSize: '0.8em' }}>({percentage.toFixed(0)}%)</span></span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--r-full)', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: '100%', backgroundColor: color, width: `${percentage}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: 'var(--r-full)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
