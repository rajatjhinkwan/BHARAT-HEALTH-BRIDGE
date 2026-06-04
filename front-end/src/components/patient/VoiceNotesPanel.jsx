import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Mic, Pause, Play } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import './VoiceNotesPanel.css';

function resolveAudioUrl(audioUrl) {
  if (!audioUrl) return null;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  if (audioUrl.startsWith('http')) {
    return audioUrl
      .replace('http://localhost:4000', baseUrl)
      .replace('http://127.0.0.1:4000', baseUrl);
  }
  return `${baseUrl}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
}

export default function VoiceNotesPanel({ records, onClose }) {
  const notes = useMemo(
    () =>
      (records || [])
        .filter((r) => r.type === 'voice_note')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [records]
  );

  const audioRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);

  const togglePlay = (note) => {
    const url = resolveAudioUrl(note.voiceNoteDetails?.audioUrl);
    if (!url) return;
    if (playingId === note._id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play().catch(() => setPlayingId(null));
      setPlayingId(note._id);
    }
  };

  if (!notes.length) {
    return (
      <section className="pp-card">
        <h2><Mic size={18} /> Doctor voice notes</h2>
        <p className="muted">Voice consultation notes from your doctor will appear here after your visit.</p>
      </section>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        style={{ display: 'none' }}
      />
      <section className="pp-card">
        <div className="pp-voice-header">
          <h2><Mic size={18} /> Doctor voice notes</h2>
          {onClose && (
            <button type="button" className="pp-btn ghost pp-voice-back" onClick={onClose}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
        <ul className="pp-voice-list">
          {notes.map((note) => {
            const isPlaying = playingId === note._id;
            const hasAudio = Boolean(note.voiceNoteDetails?.audioUrl);
            return (
              <li key={note._id} className="pp-voice-item">
                <div className="pp-voice-meta">
                  <strong>{note.title}</strong>
                  <span>{note.doctor} · {note.hospital}</span>
                  <span className="pp-voice-date">
                    {new Date(note.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pp-voice-player">
                  <button
                    type="button"
                    className="pp-voice-play"
                    disabled={!hasAudio}
                    onClick={() => togglePlay(note)}
                    title={hasAudio ? 'Play voice note' : 'Audio not available'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <p className="pp-voice-transcript">
                    {note.voiceNoteDetails?.transcript || 'No transcript available.'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
