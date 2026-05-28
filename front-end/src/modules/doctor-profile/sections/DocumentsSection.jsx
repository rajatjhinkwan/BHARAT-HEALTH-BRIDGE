import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDoctorProfile } from '../context/DoctorProfileContext';
import { doctorApi } from '../services/doctorApi';

const DOC_TYPES = [
  { type: 'medical_license', label: 'Medical License' },
  { type: 'degree_certificate', label: 'Degree Certificate' },
  { type: 'aadhaar', label: 'Aadhaar' },
  { type: 'pan', label: 'PAN Card' },
  { type: 'signature', label: 'Signature' },
  { type: 'prescription_stamp', label: 'Prescription Stamp' },
];

export default function DocumentsSection() {
  const { doctor, setDoctor } = useDoctorProfile();
  const documents = doctor?.documents || [];
  const [uploading, setUploading] = useState(null);
  const [progress, setProgress] = useState(0);
  const refs = useRef({});

  const getDoc = (type) => documents.find((d) => d.type === type);

  const handleUpload = async (type, file) => {
    if (!file) return;
    setUploading(type);
    try {
      const { data } = await doctorApi.uploadDocument(file, type, setProgress);
      setDoctor((d) => ({ ...d, documents: data.documents }));
      toast.success(`${type.replace(/_/g, ' ')} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(null);
      setProgress(0);
    }
  };

  const handleDelete = async (doc) => {
    if (!doc._id) return;
    try {
      const { data } = await doctorApi.deleteDocument(doc._id);
      setDoctor((d) => ({ ...d, documents: data.documents }));
      toast.success('Document removed');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dhp-section-header">
        <h2><FileText size={20} /> Documents</h2>
      </div>
      <div className="dhp-doc-grid">
        {DOC_TYPES.map(({ type, label }) => {
          const doc = getDoc(type);
          const isUploading = uploading === type;
          return (
            <div
              key={type}
              className={`dhp-doc-card ${doc ? 'uploaded' : ''}`}
              onClick={() => !doc && refs.current[type]?.click()}
              onKeyDown={(e) => e.key === 'Enter' && refs.current[type]?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={(el) => { refs.current[type] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hidden
                onChange={(e) => handleUpload(type, e.target.files?.[0])}
              />
              {doc?.url && doc.mimeType?.includes('image') ? (
                <img src={doc.url} alt={label} className="dhp-doc-preview" />
              ) : doc ? (
                <FileText size={40} style={{ margin: '1rem auto', color: 'var(--dhp-primary)' }} />
              ) : (
                <Upload size={32} style={{ margin: '1rem auto', color: 'var(--dhp-muted)' }} />
              )}
              <strong>{label}</strong>
              {isUploading && (
                <div className="dhp-upload-progress" style={{ position: 'static', transform: 'none', width: '100%', marginTop: 8 }}>
                  <div className="dhp-upload-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              )}
              {doc && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: 8 }}>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="dhp-btn dhp-btn-ghost" onClick={(e) => e.stopPropagation()}>
                    <Eye size={14} /> View
                  </a>
                  <button type="button" className="dhp-btn dhp-btn-ghost" onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
