import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { LogOut } from 'lucide-react';

const Discharge = () => {
  const { patients, dischargePatient } = useHospital();
  const [searchTerm, setSearchTerm] = useState('');
  const [patientToDischarge, setPatientToDischarge] = useState(null);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDischarge = () => {
    if (patientToDischarge) {
      dischargePatient(patientToDischarge.id);
      setPatientToDischarge(null);
    }
  };

  return (
    <div className="animate-fade-in fade-up" style={{ paddingBottom: '3rem' }}>
      <div className="page-header mb-6" style={{ padding: '0 1rem' }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem' }}>Patient Discharge</h1>
        <p className="page-sub" style={{ fontSize: '1.1rem' }}>Process discharges and automatically schedule bed cleaning.</p>
      </div>

      <div className="card mb-6" style={{ padding: '1.5rem 2rem' }}>
        <div className="search-wrap">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search patient by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid rgba(0,0,0,0.05)', textAlign: 'left' }}>
                <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted">Patient ID</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted">Name</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted">Bed</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted">Admitted On</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-sm" style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem' }}>
                    No patients currently admitted or matching search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => (
                  <tr key={patient.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }}>
                    <td className="p-4 text-sm font-bold" style={{ color: 'var(--primary)' }}>{patient.id}</td>
                    <td className="p-4 text-md font-semibold" style={{ color: 'var(--text-main)' }}>{patient.name}</td>
                    <td className="p-4 text-sm">
                      <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-dark)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>{patient.bedId}</span>
                    </td>
                    <td className="p-4 text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                      {new Date(patient.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => setPatientToDischarge(patient)}
                        style={{ padding: '0.5rem 1rem', boxShadow: '0 4px 10px rgba(244, 63, 94, 0.2)' }}
                      >
                        <LogOut size={16} /> Discharge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {patientToDischarge && (
        <div className="modal-overlay" onClick={() => setPatientToDischarge(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: '2.5rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>Confirm Discharge</h3>
            </div>
            <div>
              <p style={{ fontSize: '1.1rem' }}>Are you sure you want to discharge <strong style={{ color: 'var(--text-main)' }}>{patientToDischarge.name}</strong> from Bed <strong style={{ color: 'var(--primary-dark)' }}>{patientToDischarge.bedId}</strong>?</p>
              <p className="text-sm mt-4 text-muted" style={{ backgroundColor: 'rgba(244, 63, 94, 0.05)', padding: '1rem', borderRadius: 'var(--r-sm)', borderLeft: '4px solid var(--danger)' }}>This action will immediately mark the bed as <strong>'Cleaning'</strong> and remove the patient from active lists.</p>
            </div>
            <div className="modal-footer" style={{ marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setPatientToDischarge(null)} style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDischarge} style={{ padding: '0.75rem 1.5rem', boxShadow: '0 6px 15px rgba(244, 63, 94, 0.3)' }}>Confirm Discharge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discharge;
