import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  Undo,
  Trash2,
  Maximize2,
  Minimize2,
  Mic,
  Check,
} from 'lucide-react';
import ClinicalCanvas from './ClinicalCanvas';

export default function MedicineWriterPad({
  canvasData,
  onCanvasSave,
  notes,
  onNotesChange,
  onVoiceToggle,
  isRecording = false,
  onFinalize,
  finalizeLoading = false,
  sessionDoctor = 'Dr. Lena Park',
}) {
  const padRef = useRef(null);
  const canvasApiRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawingTool, setDrawingTool] = useState('pen');
  const [lastSaved, setLastSaved] = useState(() => Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const touchSave = useCallback(() => {
    setLastSaved(Date.now());
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - lastSaved) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [lastSaved]);

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(document.fullscreenElement === padRef.current);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    const el = padRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      /* fullscreen may be blocked */
    }
  };

  const handleCanvasSave = (data, cropped, strokesJson) => {
    onCanvasSave?.(data, cropped, strokesJson);
    touchSave();
  };

  const handleNotes = (e) => {
    onNotesChange?.(e.target.value);
    touchSave();
  };

  return (
    <div
      ref={padRef}
      className={`medicine-writer-card medicine-writer-pad${isFullscreen ? ' is-fullscreen' : ''}`}
    >
      <div className="writer-header">
        <div>
          <h3 className="pad-title">Medicine Writer</h3>
          <p className="pad-subtitle">Session — {sessionDoctor}</p>
        </div>
      </div>

      <div className="writer-toolbar" role="toolbar" aria-label="Prescription pad tools">
        <button
          type="button"
          className={`writer-tool-btn${drawingTool === 'pen' ? ' active' : ''}`}
          onClick={() => setDrawingTool('pen')}
          aria-label="Pen"
          title="Pen"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className={`writer-tool-btn${drawingTool === 'eraser' ? ' active' : ''}`}
          onClick={() => setDrawingTool('eraser')}
          aria-label="Eraser"
          title="Eraser"
        >
          <Eraser size={16} />
        </button>
        <button
          type="button"
          className="writer-tool-btn"
          onClick={() => canvasApiRef.current?.undo()}
          aria-label="Undo"
          title="Undo"
        >
          <Undo size={16} className="text-slate-700" />
        </button>
        <button
          type="button"
          className="writer-tool-btn writer-tool-danger"
          onClick={() => canvasApiRef.current?.clear()}
          aria-label="Clear canvas"
          title="Clear"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          className="writer-tool-btn writer-tool-fullscreen"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div className="writer-canvas-wrap">
        <ClinicalCanvas
          ref={canvasApiRef}
          initialData={canvasData}
          onSave={handleCanvasSave}
          gridVisible={40}
          gridSpacing={20}
          variant="pad"
          drawingTool={drawingTool}
          showToolbar={false}
        />
        <span className="writer-stylus-hint">Stylus ready</span>
      </div>

      <textarea
        className="writer-textarea"
        placeholder="Type clinical notes here… e.g., 'Patient reports mild chest tightness…'"
        value={notes}
        onChange={handleNotes}
        rows={3}
      />

      <div className="writer-footer">
        <button
          type="button"
          className={`voice-status${isRecording ? ' recording' : ''}`}
          onClick={onVoiceToggle}
        >
          <Mic size={14} />
          {isRecording ? 'Recording…' : 'Voice dictation available'}
        </button>
        <span className="autosave-status">Auto-saved · {secondsAgo}s ago</span>
      </div>

      <button
        type="button"
        className="finalize-btn"
        onClick={onFinalize}
        disabled={finalizeLoading}
      >
        <Check size={18} />
        {finalizeLoading ? 'Saving…' : 'Finalize Session'}
      </button>
    </div>
  );
}
