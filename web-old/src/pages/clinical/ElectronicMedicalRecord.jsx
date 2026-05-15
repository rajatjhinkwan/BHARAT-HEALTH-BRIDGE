import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, User, Calendar, MapPin, Phone, Mail,
  AlertCircle, Activity, Heart, Thermometer, Droplets,
  FlaskConical, Image as ImageIcon, Scissors, Pill,
  Plus, Edit3, Mic, Save, ChevronLeft, ChevronRight,
  Filter, CheckCircle2, Info, Clock, Maximize2, X,
  FileText, TestTube, Share2, Play, Square, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ElectronicMedicalRecord.css';
import ClinicalCanvas from '../../components/clinical/ClinicalCanvas';
import WorkspaceHeader from '../../components/clinical/WorkspaceHeader';
import SidebarPages from '../../components/clinical/SidebarPages';
import PrescriptionPanel from '../../components/clinical/PrescriptionPanel';
import ReferralPanel from '../../components/clinical/ReferralPanel';
import PatientStatusHeader from '../../components/clinical/PatientStatusHeader';
import PatientTimeline from '../../components/clinical/PatientTimeline';
import PatientQR from '../../components/clinical/PatientQR';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const ElectronicMedicalRecord = () => {
  const location = useLocation();
  const emergencyCaseData = location.state?.emergencyCase || null;
  const [emergencyCase, setEmergencyCase] = useState(emergencyCaseData);
  const [activeTab, setActiveTab] = useState('Lab');
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState('');
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Advanced Action Pad State
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState('Medicine');
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const { user } = useAuth();

  // Fullscreen Helper
  const toggleFullscreen = (enable) => {
    if (enable) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    if (isZoomed) {
      toggleFullscreen(true);
    } else {
      toggleFullscreen(false);
    }
  }, [isZoomed]);

  // Grid Controls
  const [gridVisible, setGridVisible] = useState(50);
  const [gridSpacing, setGridSpacing] = useState(25);

  // Multi-page state for different categories
  const [pages, setPages] = useState({
    Medicine: [null],
    Diagnosis: [null],
    'Blood Test': [null],
    Notes: [null]
  });
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  // Hybrid Data State
  const [structuredMeds, setStructuredMeds] = useState([{ name: '', dose: '', freq: 'TID', days: '' }]);

  const selectedPatient = location.state?.selectedPatient || null;
  const [patient, setPatient] = useState({
    _id: selectedPatient?.patientId || emergencyCase?._id || 'P-MOCK-001',
    name: selectedPatient?.patientName || emergencyCase?.patientName || 'Eleanor Whitman',
    mrn: selectedPatient?.mrn || emergencyCase?.caseId || '0042-8891-23',
    age: selectedPatient?.age || emergencyCase?.age || '54',
    gender: selectedPatient?.gender?.charAt(0) || emergencyCase?.gender?.charAt(0) || 'F',
    bloodGroup: selectedPatient?.bloodGroup || 'O+',
    phone: selectedPatient?.phone || emergencyCase?.phone || '+1 (415) 555-0182',
    email: selectedPatient?.email || 'emergency@hospital.com',
    address: selectedPatient?.address || 'Emergency Admission',
    profileImage: selectedPatient?.profileImage || null,
    priority: selectedPatient?.priority || emergencyCase?.priority || 'Normal',
    tokenNumber: selectedPatient?.tokenNumber || null,
    queueId: selectedPatient?.queueId || null,
    vitals: selectedPatient?.vitals?.[selectedPatient.vitals.length-1] || emergencyCase?.vitals || {
      bp: '128/84',
      hr: '76bpm',
      temp: '98.6°F',
      spo2: '97%'
    }
  });

  const timelineData = [
    {
      id: 1,
      date: 'Today · Mar 14, 2025',
      items: [
        { type: 'Lab', title: 'Complete Blood Count (CBC)', time: '09:42 AM', doctor: user?.name || 'Dr. Marcus Reyes', doctorAvatar: user?.avatar || null, status: 'Normal' },
        { type: 'Lab', title: 'Lipid Panel', time: '08:15 AM', doctor: 'Dr. Priya Anand', status: 'Elevated' }
      ]
    }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPatient(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateEmergencyStatus = async (status) => {
    if (!emergencyCase) return;
    try {
      const res = await fetch(`${API_BASE_URL}/emergency/${emergencyCase._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setEmergencyCase(updated);
        alert(`Emergency status updated to: ${status}`);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      const patientState = location.state?.selectedPatient;
      const patientId = location.state?.patientId || patientState?.patientId || patientState?._id;
      
      if (!patientId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/clinical/patients/${patientId}`);
        if (res.ok) {
          const data = await res.json();
          setPatient({
            _id: data._id,
            queueId: patientState?.queueId || null, // Preserve queueId for workflow actions
            name: data.patientName,
            mrn: data.mrn,
            age: data.age,
            gender: data.gender?.charAt(0),
            bloodGroup: data.bloodGroup || 'N/A',
            phone: data.phone,
            email: data.email || 'N/A',
            address: data.address,
            profileImage: data.profileImage,
            vitals: data.vitals?.[data.vitals.length - 1] || { bp: '--', hr: '--', temp: '--', spo2: '--' }
          });
        }
      } catch (err) {
        console.error("Failed to fetch patient data", err);
      }
    };

    fetchPatientData();
  }, [location.state]);

  const handleUpdateQueueStatus = async (status) => {
    const queueId = patient.queueId;
    if (!queueId) return;

    try {
        const endpoint = status === 'COMPLETED' ? 'complete' : 'call-next';
        const res = await fetch(`${API_BASE_URL}/workflow/queue/${endpoint}/${queueId}`, {
            method: 'PATCH'
        });
        if (res.ok) {
            console.log(`Consultation ${status}`);
        }
    } catch (err) {
        console.error('Failed to update queue status', err);
    }
  };

  const [selectedWard, setSelectedWard] = useState('ICU');
  const wardsList = ['ICU', 'Ventilator Ward', 'Neuro Ward', 'Nephro Ward', 'Cardiac Ward', 'Emergency Observation Ward', 'Trauma Ward', 'Surgical Ward', 'Pediatric Ward'];

  const handleAdmitToWard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/critical/patients/admit/${patient._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wardName: selectedWard,
          doctorName: user?.name || 'Dr. Aryan'
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Patient admitted to ${selectedWard}. Assigned Bed: ${data.bed.bedNumber}`);
        if (patient.queueId) await handleUpdateQueueStatus('COMPLETED');
        navigate('/doctor');
      } else {
        const err = await res.json();
        alert(err.error || 'Admission failed');
      }
    } catch (err) {
      console.error('Admission error:', err);
    }
  };

  const handleMovePatient = async (type) => {
    if (type === 'discharge') {
      try {
        const res = await fetch(`${API_BASE_URL}/critical/patients/discharge/${patient._id}`, {
          method: 'PATCH'
        });
        if (res.ok) {
          alert('Patient discharged.');
          navigate('/doctor');
        }
      } catch (err) { console.error(err); }
      return;
    }
    // Handle ICU/Ventilator move using the same admission logic but specific wards
    const targetWard = type === 'icu' ? 'ICU' : 'Ventilator Ward';
    setSelectedWard(targetWard);
    await handleAdmitToWard();
  };

  const handleReferral = async (targetDept) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflow/refer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient._id,
          targetDepartment: targetDept,
          referringDoctor: user?.name || 'Doctor'
        })
      });

      if (response.ok) {
        alert(`Patient referred to ${targetDept}.`);
        // Complete current session
        await handleUpdateQueueStatus('COMPLETED');
        navigate('/queue');
      } else {
        const error = await response.json();
        alert(error.message || 'Referral failed');
      }
    } catch (err) {
      console.error("Referral Error:", err);
    }
  };


  const addPage = () => {
    setPages(prev => {
      const newPages = { ...prev };
      newPages[activeActionTab] = [...newPages[activeActionTab], null];
      return newPages;
    });
    setCurrentPageIdx(pages[activeActionTab].length);
  };

  const updatePageData = (data) => {
    setPages(prev => {
      const newPages = { ...prev };
      newPages[activeActionTab][currentPageIdx] = data;
      return newPages;
    });
  };

  // A4 Zoom State
  const [a4Zoom, setA4Zoom] = useState(1);

  // Voice Recording Logic
  // Zoom Logic with Ctrl + Wheel
  const workspaceContentRef = useRef(null);
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setA4Zoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
      }
    };
    const workspace = workspaceContentRef.current;
    if (workspace) {
      workspace.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (workspace) workspace.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setVoiceNotes(prev => [...prev, { url: URL.createObjectURL(blob), timestamp: new Date().toLocaleTimeString() }]);
        };
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (err) { console.error(err); }
    }
  };  const renderActionScreen = () => {
    return (
      <div className="workspace-main action-screen">
        <WorkspaceHeader 
          patient={patient}
          activeActionTab={activeActionTab}
          setActiveActionTab={setActiveActionTab}
          setCurrentPageIdx={setCurrentPageIdx}
          setIsZoomed={setIsZoomed}
        />

        <div className="workspace-content" ref={workspaceContentRef}>
          <SidebarPages 
            pages={pages}
            activeActionTab={activeActionTab}
            currentPageIdx={currentPageIdx}
            setCurrentPageIdx={setCurrentPageIdx}
            addPage={addPage}
          />

          {activeActionTab === 'Referral' ? (
            <ReferralPanel handleReferral={handleReferral} />
          ) : (
            <>
              <div className="input-panel non-printable">
                <div className="panel-inner p-2">
                  {activeActionTab === 'Medicine' && (
                    <PrescriptionPanel 
                      structuredMeds={structuredMeds}
                      setStructuredMeds={setStructuredMeds}
                    />
                  )}
                  {activeActionTab !== 'Medicine' && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50">
                      <FileText size={48} className="mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Handwriting Mode Only</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="canvas-panel">
                <div className="canvas-header-tools non-printable">
                  <div className="tool-group">
                    <label>Zoom</label>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <button onClick={() => setA4Zoom(Math.max(0.5, a4Zoom - 0.1))} className="p-1 hover:bg-white rounded transition-colors"><Search size={14} /></button>
                      <span className="text-[10px] font-bold w-12 text-center text-slate-600">{Math.round(a4Zoom * 100)}%</span>
                      <button onClick={() => setA4Zoom(Math.min(3, a4Zoom + 0.1))} className="p-1 hover:bg-white rounded transition-colors"><Search size={14} /></button>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div className="tool-group">
                    <label>Grid</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0" max="100" value={gridVisible} onChange={(e) => setGridVisible(e.target.value)} className="w-20 h-1 accent-primary" />
                      <span className="text-[10px] font-bold text-slate-400 w-6">{gridVisible}%</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div className="tool-group">
                    <label>Guide Spacing</label>
                    <div className="flex gap-1">
                      <button onClick={() => setGridSpacing(Math.max(10, gridSpacing - 5))} className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-all">-</button>
                      <button onClick={() => setGridSpacing(Math.min(50, gridSpacing + 5))} className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-all">+</button>
                    </div>
                  </div>
                </div>

                <div className="a4-container-zoomable" style={{ transform: `scale(${a4Zoom})` }}>
                  <ClinicalCanvas
                    key={`${activeActionTab}-${currentPageIdx}`}
                    initialData={pages[activeActionTab][currentPageIdx]}
                    onSave={updatePageData}
                    gridVisible={gridVisible}
                    gridSpacing={gridSpacing}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`emr-container ${isZoomed ? 'zoom-active' : ''}`}>
      <PatientStatusHeader patient={patient} />
      
      <main className="emr-main">
        {/* Left Column */}
        <aside className="emr-col">
          <div className="patient-profile-card">
            <div className="profile-img-wrapper">
              <label htmlFor="profile-upload" className="cursor-pointer">
                {patient.profileImage ? (
                  <img src={patient.profileImage} alt="Profile" className="profile-img" />
                ) : (
                  <div className="profile-img bg-slate-100 flex items-center justify-center">
                    <User size={48} className="text-slate-300" />
                  </div>
                )}
                <input id="profile-upload" type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <h2 className="patient-name">{patient.name}</h2>
            <p className="patient-mrn">MRN · {patient.mrn}</p>
            <div className="patient-tags">
              <span className="patient-tag">{patient.gender} · {patient.age}y</span>
              <span className="patient-tag">{patient.bloodGroup}</span>
            </div>
            <button type="button" className="details-toggle-btn" onClick={() => setShowContactDetails(!showContactDetails)}>
              {showContactDetails ? 'Hide details' : 'Show details'}
            </button>
            {showContactDetails && (
              <div className="patient-contact-info">
                <div className="info-item"><Phone size={14} /> {patient.phone}</div>
                <div className="info-item"><Mail size={14} /> {patient.email}</div>
              </div>
            )}
          </div>

          <PatientQR patient={patient} />

          <div className="card mt-6 p-6">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Discharge Checklist</h3>
             <div className="space-y-2">
                {[
                    { label: 'Prescription Added', done: true },
                    { label: 'Lab Reports Attached', done: false },
                    { label: 'Bill Cleared', done: false },
                    { label: 'Follow-Up Scheduled', done: false }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <div style={{ width: 16, height: 16, borderRadius: '4px', border: '2px solid var(--border)', background: item.done ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.done && <Check size={10} color="white" />}
                        </div>
                        {item.label}
                    </div>
                ))}
             </div>
          </div>

          <div className="vitals-card">
            <div className="flex justify-between items-center mb-4">
              <div className="pad-title">Current Vitals</div>
            </div>
            <div className="vitals-grid">
              <div className="vital-box">
                <span className="vital-label">BP</span>
                <span className="vital-value">{patient.vitals?.bp || '--'}</span>
                <span className="vital-status status-normal">mmHg</span>
              </div>
              <div className="vital-box">
                <span className="vital-label">HR</span>
                <span className="vital-value">{patient.vitals?.hr || patient.vitals?.heartRate || '--'}</span>
                <span className="vital-status status-normal">BPM</span>
              </div>
              <div className="vital-box">
                <span className="vital-label">SPO2</span>
                <span className="vital-value">{patient.vitals?.spo2 || '--'}%</span>
              </div>
              <div className="vital-box">
                <span className="vital-label">TEMP</span>
                <span className="vital-value">{patient.vitals?.temp || '--'}°F</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Middle Column */}
        <section className="emr-col">
          <div className="emr-middle-col">
            <div className="timeline-header">
              <h2 className="timeline-title">Clinical Journey</h2>
              <div className="timeline-filters">
                {['Timeline', 'Lab', 'Prescription'].map(tab => (
                  <div key={tab} className={`timeline-filter ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                    <span>{tab}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="timeline-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              {activeTab === 'Timeline' ? (
                <PatientTimeline timeline={patient.timeline} />
              ) : (
                <div className="p-12 text-center opacity-50">
                   <Activity size={48} className="mx-auto mb-4" />
                   <p className="font-bold uppercase tracking-widest text-[10px]">No records found for {activeTab}</p>
                </div>
              )}
            </div>
          </div>
        </section>

      {/* Right Column */}
      <aside className="emr-col">
        {emergencyCase && (
          <div className="action-pad-card emergency-protocol-card" style={{ border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.02)' }}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="pad-title" style={{ color: 'var(--danger)' }}>Emergency Protocol</h3>
                <Activity size={18} className="text-danger animate-pulse" />
            </div>
            <div className="emergency-status-actions grid grid-cols-2 gap-2">
                <button className="er-action-btn" onClick={() => handleUpdateEmergencyStatus('IN ICU')}>Send to ICU</button>
                <button className="er-action-btn" onClick={() => handleUpdateEmergencyStatus('ON VENTILATOR')}>Ventilator</button>
                <button className="er-action-btn" onClick={() => handleUpdateEmergencyStatus('LAB PENDING')}>Send to Lab</button>
                <button className="er-action-btn" onClick={() => handleUpdateEmergencyStatus('ADMITTED')}>Admit Patient</button>
                <button className="er-action-btn" onClick={() => setActiveActionTab('Referral')}>Refer Dept</button>
                <button className="er-action-btn discharge" onClick={() => handleUpdateEmergencyStatus('DISCHARGED')}>Discharge</button>
            </div>
            <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] uppercase font-black text-slate-400 mb-1">Current Status</div>
                <div className="text-xs font-bold text-slate-700">{emergencyCase.currentStatus}</div>
            </div>
          </div>
        )}

        {!emergencyCase && (
          <div className="action-pad-card critical-movement-card" style={{ border: '1px solid var(--primary)', background: 'rgba(59, 130, 246, 0.02)' }}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="pad-title" style={{ color: 'var(--primary)' }}>Clinical Movement</h3>
                <Activity size={18} className="text-primary" />
            </div>
            
            <div className="mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Select Target Ward</label>
              <select 
                value={selectedWard} 
                onChange={(e) => setSelectedWard(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'white' }}
              >
                {wardsList.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="emergency-status-actions grid grid-cols-2 gap-2">
                <button className="er-action-btn" onClick={handleAdmitToWard} style={{ gridColumn: 'span 2', background: 'var(--primary)', color: 'white' }}>Admit to Ward</button>
                <button className="er-action-btn" onClick={() => handleMovePatient('icu')}>Quick ICU</button>
                <button className="er-action-btn" onClick={() => handleMovePatient('ventilator')}>Quick Vent</button>
                <button className="er-action-btn" onClick={() => setActiveActionTab('Referral')} style={{ gridColumn: 'span 2' }}>Refer to Department</button>
                <button className="er-action-btn" style={{ gridColumn: 'span 2', background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success-light)' }}>Schedule Follow-up</button>
                <button className="er-action-btn discharge" style={{ gridColumn: 'span 2' }} onClick={() => handleMovePatient('discharge')}>Discharge Patient</button>
            </div>
          </div>
        )}



        <div className="action-pad-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="pad-title">Doctor's Action Pad</h3>
            <Maximize2 size={18} className="text-slate-400 cursor-pointer hover:text-primary transition-colors" onClick={() => setIsZoomed(true)} />
          </div>
          <div className="pad-grid">
            {['Medicine', 'Diagnosis', 'Blood Test', 'Notes'].map(tab => (
              <div key={tab} className="pad-btn" onClick={() => { setActiveActionTab(tab); setCurrentPageIdx(0); setIsZoomed(true); }}>
                <div className="pad-btn-icon"><Pill size={18} /></div>
                <span className="pad-btn-label">{tab}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="medicine-writer-card">
          <div className="writer-header">
            <h3 className="pad-title">Voice Records</h3>
            <Mic size={18} className={isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'} onClick={toggleRecording} style={{ cursor: 'pointer' }} />
          </div>
          <div className="voice-records-list">
            {voiceNotes.map((note, i) => (
              <div key={i} className="voice-note-item">
                <Volume2 size={14} className="text-primary" />
                <span className="text-[10px] flex-1">{note.timestamp}</span>
                <Play size={12} className="cursor-pointer" onClick={() => new Audio(note.url).play()} />
              </div>
            ))}
          </div>
          <button className="finalize-btn" style={{ marginTop: '1.5rem' }} onClick={() => setIsZoomed(true)}>
            <CheckCircle2 size={18} /> Open Workspace
          </button>
        </div>
      </aside>
    </main>

    <AnimatePresence>
      {isZoomed && (
        <motion.div 
          className="action-pad-modal" 
          initial={{ opacity: 0, scale: 1.02 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {renderActionScreen()}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
};

export default ElectronicMedicalRecord;