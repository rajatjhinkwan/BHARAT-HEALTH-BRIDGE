import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Sparkles, Check } from 'lucide-react';

const Admissions = () => {
  const { admitPatient, suggestBed } = useHospital();
  const [formData, setFormData] = useState({
    name: '',
    severity: 'Moderate',
    department: 'General'
  });
  const [suggestedBed, setSuggestedBed] = useState(null);
  const [isAdmitted, setIsAdmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuggestedBed(null); // Reset suggestion if parameters change
  };

  const handleSuggest = () => {
    const bed = suggestBed(formData.severity, formData.department);
    setSuggestedBed(bed);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!suggestedBed) return;
    
    admitPatient(formData, suggestedBed.id);
    setIsAdmitted(true);
    
    setTimeout(() => {
      setIsAdmitted(false);
      setFormData({ name: '', severity: 'Moderate', department: 'General' });
      setSuggestedBed(null);
    }, 3000);
  };

  return (
    <div className="animate-fade-in fade-up" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="page-header mb-6" style={{ padding: '0', textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem' }}>Patient Admission</h1>
        <p className="page-sub" style={{ fontSize: '1.1rem' }}>Register a new patient and automatically allocate the best available bed.</p>
      </div>

      <div className="card" style={{ padding: '3rem', marginTop: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        {isAdmitted ? (
          <div className="flex flex-col items-center justify-center py-10 success-state">
            <div className="success-icon" style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
              <Check size={48} />
            </div>
            <h2 style={{ color: 'var(--color-success)', fontSize: '2rem', fontWeight: 800 }}>Admission Successful</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-2)' }}>Patient has been assigned to bed <strong style={{ color: 'var(--text-main)' }}>{suggestedBed?.id}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-6">
              <label className="form-label" style={{ fontSize: '1rem' }}>Patient Name</label>
              <input 
                type="text" 
                className="form-control" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
                style={{ padding: '1rem 1.25rem', fontSize: '1.1rem' }}
              />
            </div>

            <div className="flex gap-6 mb-8">
              <div className="form-group w-full mb-0">
                <label className="form-label">Severity Level</label>
                <select 
                  className="form-control" 
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                >
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="form-group w-full mb-0">
                <label className="form-label">Required Department</label>
                <select 
                  className="form-control" 
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  <option value="General">General Ward</option>
                  <option value="ICU">ICU</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.1)', padding: '2rem', borderRadius: 'var(--r-xl)', marginBottom: '2.5rem' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary-dark)' }}>Smart Bed Allocation</h3>
                <button type="button" className="btn btn-primary" onClick={handleSuggest} style={{ padding: '0.6rem 1.2rem' }}>
                  <Sparkles size={18} /> Suggest Bed
                </button>
              </div>

              {suggestedBed ? (
                <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface2)', padding: '1.5rem', borderRadius: 'var(--r-lg)', borderLeft: '5px solid var(--color-success)', boxShadow: 'var(--shadow)' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--color-success)', fontSize: '1.2rem', fontWeight: 800 }}>Bed {suggestedBed.id} Available</h4>
                      <p className="text-sm font-medium" style={{ margin: 0, marginTop: '0.4rem', color: 'var(--text-2)' }}>{suggestedBed.ward} • Floor {suggestedBed.floor} • {suggestedBed.type}</p>
                    </div>
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--r)', color: 'var(--color-success)', fontWeight: 'bold' }}>
                      Optimal Match
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--border)' }}>
                  <p className="text-sm font-medium" style={{ margin: 0, color: 'var(--text-3)' }}>
                    Click "Suggest Bed" to find the optimal placement based on severity and department.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                className="btn btn-success" 
                disabled={!suggestedBed || !formData.name}
                style={{ 
                  opacity: (!suggestedBed || !formData.name) ? 0.5 : 1, 
                  padding: '1rem 2rem', 
                  fontSize: '1.1rem',
                  boxShadow: (!suggestedBed || !formData.name) ? 'none' : '0 10px 20px rgba(16, 185, 129, 0.3)'
                }}
              >
                Confirm Admission
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Admissions;
