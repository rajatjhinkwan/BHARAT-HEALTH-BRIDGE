// @refresh reset
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../../config';

const HospitalContext = createContext();

export const useHospital = () => useContext(HospitalContext);

const initialBeds = [
  { id: '101A', ward: 'General', type: 'General', status: 'Occupied', floor: 1, equipment: ['Oxygen'] },
  { id: '102A', ward: 'General', type: 'General', status: 'Available', floor: 1, equipment: [] },
  { id: '103B', ward: 'General', type: 'General', status: 'Cleaning', floor: 1, equipment: [] },
  { id: '201A', ward: 'ICU', type: 'ICU', status: 'Occupied', floor: 2, equipment: ['Ventilator', 'Monitor'] },
  { id: '202B', ward: 'ICU', type: 'ICU', status: 'Available', floor: 2, equipment: ['Ventilator', 'Monitor'] },
  { id: '203C', ward: 'ICU', type: 'ICU', status: 'Available', floor: 2, equipment: ['Ventilator'] },
  { id: '301A', ward: 'Maternity', type: 'Private', status: 'Occupied', floor: 3, equipment: ['Monitor'] },
  { id: '302A', ward: 'Maternity', type: 'General', status: 'Available', floor: 3, equipment: [] },
  { id: '401A', ward: 'Emergency', type: 'Emergency', status: 'Reserved', floor: 1, equipment: ['Defibrillator'] },
  { id: '402B', ward: 'Emergency', type: 'Emergency', status: 'Maintenance', floor: 1, equipment: [] },
  { id: '501A', ward: 'Pediatrics', type: 'General', status: 'Available', floor: 4, equipment: ['Oxygen'] },
  { id: '502B', ward: 'Pediatrics', type: 'General', status: 'Available', floor: 4, equipment: [] },
  { id: '601A', ward: 'Neuro', type: 'Private', status: 'Occupied', floor: 5, equipment: ['Monitor'] },
  { id: '602B', ward: 'Neuro', type: 'General', status: 'Available', floor: 5, equipment: [] },
  { id: '603C', ward: 'Neuro', type: 'ICU', status: 'Available', floor: 5, equipment: ['Ventilator'] },
  { id: '701A', ward: 'Nephro', type: 'General', status: 'Occupied', floor: 6, equipment: ['Dialysis'] },
  { id: '702B', ward: 'Nephro', type: 'General', status: 'Available', floor: 6, equipment: [] },
  { id: '801A', ward: 'Ortho', type: 'General', status: 'Occupied', floor: 7, equipment: [] },
  { id: '802B', ward: 'Ortho', type: 'General', status: 'Available', floor: 7, equipment: [] },
  { id: '901A', ward: 'Cardio', type: 'ICU', status: 'Available', floor: 8, equipment: ['Monitor', 'Defibrillator'] },
];

const initialPatients = [
  { id: 'PT-001', name: 'John Doe', age: 45, gender: 'Male', diagnosis: 'Pneumonia', severity: 'Moderate', bedId: '101A', admissionDate: new Date(Date.now() - 86400000).toISOString() },
  { id: 'PT-002', name: 'Jane Smith', age: 30, gender: 'Female', diagnosis: 'Post-op Recovery', severity: 'Critical', bedId: '201A', admissionDate: new Date(Date.now() - 172800000).toISOString() },
  { id: 'PT-003', name: 'Emily Davis', age: 28, gender: 'Female', diagnosis: 'Labor', severity: 'Moderate', bedId: '301A', admissionDate: new Date().toISOString() },
  { id: 'PT-004', name: 'Robert Fox', age: 52, gender: 'Male', diagnosis: 'Stroke', severity: 'Critical', bedId: '601A', admissionDate: new Date(Date.now() - 43200000).toISOString() },
  { id: 'PT-005', name: 'Alice Wong', age: 60, gender: 'Female', diagnosis: 'Kidney Failure', severity: 'Moderate', bedId: '701A', admissionDate: new Date(Date.now() - 259200000).toISOString() },
  { id: 'PT-006', name: 'David Lee', age: 35, gender: 'Male', diagnosis: 'Fracture', severity: 'Low', bedId: '801A', admissionDate: new Date(Date.now() - 86400000).toISOString() },
];

const initialTransfers = [
  { patientName: 'John Doe', fromBed: '401A', toBed: '101A', reason: 'Stabilized', date: new Date(Date.now() - 3600000).toISOString() },
  { patientName: 'Jane Smith', fromBed: '102A', toBed: '201A', reason: 'Condition Worsened', date: new Date(Date.now() - 86400000).toISOString() },
  { patientName: 'Robert Fox', fromBed: '402B', toBed: '601A', reason: 'Requires Neuro ICU', date: new Date(Date.now() - 2000000).toISOString() }
];

export const HospitalProvider = ({ children }) => {
  const [beds, setBeds] = useState(initialBeds);
  const [patients, setPatients] = useState(initialPatients);
  const [transfers, setTransfers] = useState(initialTransfers);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [activeWardView, setActiveWardView] = useState('All');

  // Compute visible subsets based on active role/ward
  const visibleBeds = activeWardView === 'All' ? beds : beds.filter(b => b.ward === activeWardView);
  
  // Only show patients that are currently in a visible bed
  const visiblePatients = activeWardView === 'All' ? patients : patients.filter(p => visibleBeds.some(b => b.id === p.bedId));
  
  // Show transfers related to the visible beds
  const visibleTransfers = activeWardView === 'All' ? transfers : transfers.filter(t => visibleBeds.some(b => b.id === t.fromBed || b.id === t.toBed));

  const stats = {
    total:       visibleBeds.length,
    occupied:    visibleBeds.filter(b => b.status === 'Occupied').length,
    available:   visibleBeds.filter(b => b.status === 'Available').length,
    cleaning:    visibleBeds.filter(b => b.status === 'Cleaning').length,
    reserved:    visibleBeds.filter(b => b.status === 'Reserved').length,
    maintenance: visibleBeds.filter(b => b.status === 'Maintenance').length,
    patients:    visiblePatients.length,
    transfers:   visibleTransfers.length,
  };

  const wardNames = activeWardView === 'All' 
    ? ['General','ICU','Maternity','Emergency','Pediatrics','Neuro','Nephro','Ortho','Cardio']
    : [activeWardView];

  const wardStats = wardNames.map(ward => {
    const wb = visibleBeds.filter(b => b.ward === ward);
    const occ = wb.filter(b => b.status === 'Occupied').length;
    return {
      ward, total: wb.length, occupied: occ,
      available: wb.filter(b => b.status === 'Available').length,
      rate: wb.length ? Math.round((occ / wb.length) * 100) : 0,
    };
  });

  const tryApiCall = async (endpoint, method = 'GET', body = null) => {
    try {
      const options = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
      return res.ok;
    } catch (err) {
      return false; 
    }
  };

  const addAlert = useCallback((message, type = 'info') => {
    setAlerts(prev => [
      { id: Date.now() + Math.random(), message, type, time: new Date().toISOString() },
      ...prev
    ].slice(0, 6));
  }, []);

  const removeAlert = useCallback((id) => setAlerts(prev => prev.filter(a => a.id !== id)), []);

  const admitPatient = useCallback(async (patientData, selectedBedId) => {
    await tryApiCall(`/beds/${selectedBedId}`, 'PUT', { status: 'Occupied', patientName: patientData.name });
    
    setBeds(prev => prev.map(b => b.id === selectedBedId ? { ...b, status: 'Occupied' } : b));
    setPatients(prev => [...prev, {
      id: `PT-${Math.floor(Math.random() * 1000)}`,
      name: patientData.name,
      age: patientData.age || 35,
      gender: patientData.gender || 'Unknown',
      diagnosis: patientData.diagnosis || 'Undiagnosed',
      severity: patientData.severity || 'Moderate',
      bedId: selectedBedId,
      admissionDate: new Date().toISOString()
    }]);
    addAlert(`Patient ${patientData.name} admitted to bed ${selectedBedId}`, 'success');
  }, [addAlert]);

  const dischargePatient = useCallback(async (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    await tryApiCall(`/beds/${patient.bedId}`, 'PUT', { status: 'Cleaning' });
    
    setBeds(prev => prev.map(b => b.id === patient.bedId ? { ...b, status: 'Cleaning' } : b));
    setPatients(prev => prev.filter(p => p.id !== patientId));
    addAlert(`Patient ${patient.name} discharged. Bed ${patient.bedId} requires cleaning.`, 'info');
  }, [patients, addAlert]);

  const transferPatient = useCallback(async (patientId, newBedId, reason) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    const oldBedId = patient.bedId;

    await tryApiCall(`/beds/${oldBedId}`, 'PUT', { status: 'Cleaning' });
    await tryApiCall(`/beds/${newBedId}`, 'PUT', { status: 'Occupied' });

    setBeds(prev => prev.map(b => {
      if (b.id === oldBedId) return { ...b, status: 'Cleaning' };
      if (b.id === newBedId) return { ...b, status: 'Occupied' };
      return b;
    }));

    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, bedId: newBedId } : p));
    
    setTransfers(prev => [{
      patientName: patient.name,
      fromBed: oldBedId,
      toBed: newBedId,
      reason: reason || 'Standard transfer',
      date: new Date().toISOString()
    }, ...prev].slice(0, 50));
    
    addAlert(`Transferred ${patient.name} to bed ${newBedId}`, 'success');
  }, [patients, addAlert]);

  const updateBedStatus = useCallback(async (bedId, newStatus) => {
    await tryApiCall(`/beds/${bedId}`, 'PUT', { status: newStatus });
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, status: newStatus } : b));
  }, []);

  const addBed = useCallback((newBedData) => {
    setBeds(prev => [...prev, {
      ...newBedData,
      status: 'Available',
      equipment: Array.isArray(newBedData.equipment) ? newBedData.equipment : newBedData.equipment.split(',').map(s=>s.trim()).filter(Boolean)
    }]);
    addAlert(`New bed ${newBedData.id} added to ${newBedData.ward}`, 'success');
  }, [addAlert]);

  const suggestBed = useCallback((severity, department) => {
    let available = visibleBeds.filter(b => b.status === 'Available');
    if (severity === 'Critical') {
      available = [...available, ...visibleBeds.filter(b => b.status === 'Reserved')];
    }
    const suitable = available.filter(b => b.ward.toLowerCase() === department.toLowerCase());
    return suitable.length > 0 ? suitable[0] : (available[0] || null);
  }, [visibleBeds]);

  return (
    <HospitalContext.Provider value={{
      beds: visibleBeds, 
      patients: visiblePatients, 
      transfers: visibleTransfers, 
      stats, 
      wardStats,
      allBeds: beds, // Global list for cross-ward transfers
      activeWardView, 
      setActiveWardView,
      alerts,
      admitPatient, dischargePatient, transferPatient,
      updateBedStatus, suggestBed, addBed, addAlert, removeAlert, isConnected
    }}>
      {children}
    </HospitalContext.Provider>
  );
};

