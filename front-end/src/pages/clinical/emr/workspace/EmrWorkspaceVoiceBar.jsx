import React from 'react';
import { Mic, Volume2, Play } from 'lucide-react';

export default function EmrWorkspaceVoiceBar({ isRecording, onToggle, voiceNotes = [] }) {
  return (
    <div className="emr-workspace-voice-bar">
      <button
        type="button"
        className={`emr-workspace-voice-btn${isRecording ? ' recording' : ''}`}
        onClick={onToggle}
      >
        <Mic size={18} />
        {isRecording ? 'Stop & save voice note' : 'Record voice note for patient'}
      </button>
      {voiceNotes.length > 0 && (
        <div className="emr-workspace-voice-list">
          {voiceNotes.slice(0, 2).map((note) => (
            <div key={note.id || note.url} className="voice-note-item">
              <Volume2 size={12} />
              <span className="voice-note-time">{note.timestamp}</span>
              <button type="button" className="emr-play-voice" onClick={() => new Audio(note.url).play()}>
                <Play size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
