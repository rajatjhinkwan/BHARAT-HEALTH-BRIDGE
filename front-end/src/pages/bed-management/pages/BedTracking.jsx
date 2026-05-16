import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import BedCard from '../components/BedCard';
import { Filter, Plus } from 'lucide-react';

const BedTracking = () => {
  const { beds, patients, addBed, updateBedStatus } = useHospital();
  const [filterWard, setFilterWard] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedBed, setSelectedBed] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBedData, setNewBedData] = useState({
    id: '', ward: 'General', type: 'General', floor: 1, equipment: ''
  });

  const handleAddBed = (e) => {
    e.preventDefault();
    if (!newBedData.id) return;
    const equipmentList = newBedData.equipment.split(',').map(s => s.trim()).filter(Boolean);
    addBed({
      ...newBedData,
      floor: parseInt(newBedData.floor, 10),
      equipment: equipmentList
    });
    setShowAddModal(false);
    setNewBedData({ id: '', ward: 'General', type: 'General', floor: 1, equipment: '' });
  };

  const filteredBeds = beds.filter(bed => {
    if (filterWard !== 'All' && bed.ward !== filterWard) return false;
    if (filterStatus !== 'All' && bed.status !== filterStatus) return false;
    if (searchTerm) {
      const patient = patients.find(p => p.bedId === bed.id);
      const matchesBed = bed.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPatient = patient && patient.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesBed && !matchesPatient) return false;
    }
    return true;
  });

  const uniqueWards = ['All', ...new Set(beds.map(b => b.ward))];
  const uniqueStatuses = ['All', ...new Set(beds.map(b => b.status))];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex justify-between items-center mb-6" style={{ flexShrink: 0 }}>
        <div>
          <h1>Bed Tracking</h1>
          <p>Live view of all hospital beds and their current status.</p>
        </div>
        
        <div className="flex gap-4 items-center surface" style={{ padding: '0.75rem 1rem' }}>
          <button 
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => setShowAddModal(true)}
            style={{ marginRight: '1rem' }}
          >
            <Plus size={16} /> New Bed
          </button>

          <div className="search-wrap" style={{ marginRight: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search ID or Patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px', padding: '0.5rem 0.75rem' }}
            />
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <Filter size={16} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <select 
            className="form-control" 
            style={{ width: '140px', padding: '0.5rem' }}
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
          >
            {uniqueWards.map(w => <option key={w} value={w}>{w} Ward</option>)}
          </select>
          <select 
            className="form-control" 
            style={{ width: '140px', padding: '0.5rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {uniqueStatuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {filteredBeds.length === 0 ? (
          <div className="surface flex justify-center items-center" style={{ height: '200px' }}>
            <p style={{ color: 'var(--text-tertiary)' }}>No beds match the selected filters.</p>
          </div>
        ) : (
          <div className="bed-grid" style={{ marginTop: 0 }}>
            {filteredBeds.map(bed => {
              const patient = patients.find(p => p.bedId === bed.id);
              return <BedCard key={bed.id} bed={bed} patient={patient} onClick={() => setSelectedBed({bed, patient})} />;
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Bed</h3>
            </div>
            <form onSubmit={handleAddBed}>
              <div className="form-group">
                <label className="form-label">Bed ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. 601A"
                  value={newBedData.id} 
                  onChange={e => setNewBedData({...newBedData, id: e.target.value})} 
                />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Department / Ward</label>
                  <select 
                    className="form-control"
                    value={newBedData.ward}
                    onChange={e => setNewBedData({...newBedData, ward: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Floor</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1" max="10" 
                    required 
                    value={newBedData.floor}
                    onChange={e => setNewBedData({...newBedData, floor: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Bed Type</label>
                <select 
                  className="form-control"
                  value={newBedData.type}
                  onChange={e => setNewBedData({...newBedData, type: e.target.value})}
                >
                  <option value="General">General</option>
                  <option value="ICU">ICU</option>
                  <option value="Private">Private</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipment (comma separated)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Oxygen, Ventilator, Defibrillator"
                  value={newBedData.equipment}
                  onChange={e => setNewBedData({...newBedData, equipment: e.target.value})}
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Bed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBed && (
        <div className="modal-overlay" onClick={() => setSelectedBed(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Bed {selectedBed.bed.id} Details</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div className="text-sm text-muted">Ward & Floor</div>
                  <div className="font-medium">{selectedBed.bed.ward} - Floor {selectedBed.bed.floor || 1}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted">Status</div>
                  <span className={`badge badge-${selectedBed.bed.status.toLowerCase()}`}>{selectedBed.bed.status}</span>
                </div>
              </div>

              {selectedBed.patient ? (
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--r)' }}>
                  <h4 className="mb-2">Admitted Patient</h4>
                  <p><strong>Name:</strong> {selectedBed.patient.name} ({selectedBed.patient.age}{selectedBed.patient.gender[0]})</p>
                  <p><strong>Diagnosis:</strong> {selectedBed.patient.diagnosis}</p>
                  <p><strong>Severity:</strong> <span className={`badge badge-${selectedBed.patient.severity.toLowerCase()}`}>{selectedBed.patient.severity}</span></p>
                  <p className="text-sm text-muted mt-2">Admitted on: {new Date(selectedBed.patient.admissionDate).toLocaleString()}</p>
                </div>
              ) : (
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '1.5rem', borderRadius: 'var(--r)', textAlign: 'center', color: 'var(--text-3)' }}>
                  No patient currently assigned to this bed.
                </div>
              )}

              {((selectedBed.bed.equipment || []).length > 0 || (selectedBed.bed.equipped || []).length > 0) && (
                <div>
                  <h4 className="mb-2 text-sm text-muted">Available Equipment</h4>
                  <div className="flex gap-2 flex-wrap">
                    {(selectedBed.bed.equipment || selectedBed.bed.equipped || []).map(eq => (
                      <span key={eq} className="badge" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>{eq}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div className="flex gap-2">
                {(selectedBed.bed.status === 'Available' || selectedBed.bed.status === 'Reserved' || selectedBed.bed.status === 'Maintenance' || selectedBed.bed.status === 'Cleaning') && (
                  <>
                    {(selectedBed.bed.status !== 'Available' && selectedBed.bed.status !== 'Cleaning') && (
                      <button className="btn btn-success btn-sm" onClick={() => { updateBedStatus(selectedBed.bed.id, 'Available'); setSelectedBed({...selectedBed, bed: {...selectedBed.bed, status: 'Available'}}); }}>Set Available</button>
                    )}
                    {selectedBed.bed.status === 'Cleaning' && (
                      <button className="btn btn-success btn-sm" onClick={() => { updateBedStatus(selectedBed.bed.id, 'Available'); setSelectedBed({...selectedBed, bed: {...selectedBed.bed, status: 'Available'}}); }}>Mark as Cleaned</button>
                    )}
                    {selectedBed.bed.status !== 'Maintenance' && selectedBed.bed.status !== 'Cleaning' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { updateBedStatus(selectedBed.bed.id, 'Maintenance'); setSelectedBed({...selectedBed, bed: {...selectedBed.bed, status: 'Maintenance'}}); }}>Set Maintenance</button>
                    )}
                    {selectedBed.bed.status !== 'Reserved' && selectedBed.bed.status !== 'Cleaning' && (
                      <button className="btn btn-primary btn-sm" onClick={() => { updateBedStatus(selectedBed.bed.id, 'Reserved'); setSelectedBed({...selectedBed, bed: {...selectedBed.bed, status: 'Reserved'}}); }}>Reserve Bed</button>
                    )}
                  </>
                )}
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedBed(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedTracking;
