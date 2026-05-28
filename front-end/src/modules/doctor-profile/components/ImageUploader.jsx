import React, { useRef, useState } from 'react';
import { Upload, Camera } from 'lucide-react';

export default function ImageUploader({ preview, onUpload, progress = 0, label = 'Upload photo' }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (file?.type?.startsWith('image/')) onUpload(file);
  };

  return (
    <div
      className={`dhp-dropzone ${dragActive ? 'active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      {preview ? (
        <img src={preview} alt="Preview" style={{ maxWidth: 120, borderRadius: '50%', marginBottom: 8 }} />
      ) : (
        <Camera size={32} style={{ color: 'var(--dhp-muted)', margin: '0 auto 8px' }} />
      )}
      <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--dhp-muted)' }}>Drag & drop or click · JPG, PNG, WEBP</p>
      {progress > 0 && progress < 100 && (
        <div className="dhp-upload-progress" style={{ position: 'static', width: '80%', margin: '12px auto 0' }}>
          <div className="dhp-upload-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
      <Upload size={16} style={{ marginTop: 8, color: 'var(--dhp-primary)' }} />
    </div>
  );
}
