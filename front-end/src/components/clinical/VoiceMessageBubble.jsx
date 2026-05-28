import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, CheckCheck, Mic } from 'lucide-react';

export default function VoiceMessageBubble({ noteUrl, timestamp, senderName = 'Dr. Attending' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioRef = useRef(null);

  // Deterministic sound waveform peaks mimicking actual voice heights (28 bars)
  const wavePeaks = [
    30, 15, 45, 60, 75, 40, 25, 50, 85, 90,
    65, 30, 40, 70, 80, 95, 55, 35, 60, 70,
    45, 30, 15, 40, 55, 30, 20, 10
  ];

  // Get initials for Doctor's avatar
  const getInitials = (name) => {
    if (!name) return 'DR';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const audio = new Audio(noteUrl);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    // Initial check for duration if cached
    if (audio.duration) {
      setDuration(audio.duration);
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [noteUrl]);

  // Handle play/pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch((err) => console.log('Audio playback blocked/failed', err));
      setIsPlaying(true);
    }
  };

  // Speed toggle: 1.0x -> 1.5x -> 2.0x
  const handleSpeedToggle = (e) => {
    e.stopPropagation();
    let nextRate = 1.0;
    if (playbackRate === 1.0) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2.0;

    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // Waveform click seeking
  const handleWaveClick = (index) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const pct = index / wavePeaks.length;
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  // Time formatter
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="wa-voice-bubble-wrapper flex items-start gap-2.5 p-3 rounded-2xl bg-[#E8F8F0] border border-[#d1f2e1] max-w-[340px] my-2 shadow-sm animate-liftoff transition-all hover:shadow-md">
      {/* Avatar Container */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-xs font-bold shadow-inner">
          {getInitials(senderName)}
        </div>
        {/* Overlapping green status badge with Microphone inside */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25D366] border-2 border-white flex items-center justify-center text-white">
          <Mic size={9} fill="white" />
        </div>
      </div>

      {/* Main Player Info */}
      <div className="flex-1 min-w-0">
        {/* Sender details */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] font-extrabold text-[#128C7E] truncate">{senderName}</span>
          <span className="text-[9px] text-slate-500 whitespace-nowrap">{timestamp || 'Just now'}</span>
        </div>

        {/* Player controls & waveform */}
        <div className="flex items-center gap-3">
          {/* Circular play pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-[#128C7E] text-white flex items-center justify-center hover:scale-105 hover:bg-[#0e6e63] transition-all flex-shrink-0"
            aria-label={isPlaying ? 'Pause voice' : 'Play voice'}
          >
            {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
          </button>

          {/* Graphical Waveform */}
          <div className="flex items-end gap-[2px] h-7 flex-1 cursor-pointer select-none">
            {wavePeaks.map((peak, idx) => {
              const barPct = (idx / wavePeaks.length) * 100;
              const isActive = progressPercent >= barPct;
              return (
                <div
                  key={idx}
                  onClick={() => handleWaveClick(idx)}
                  className="w-[3px] rounded-full transition-all duration-200"
                  style={{
                    height: `${peak}%`,
                    backgroundColor: isActive ? '#128C7E' : '#A5D6A7',
                    opacity: isActive ? 1.0 : 0.65,
                  }}
                  title={`Seek to ${Math.round(barPct)}%`}
                />
              );
            })}
          </div>

          {/* Speed badge */}
          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-1.5 py-0.5 rounded-full bg-white text-[9px] font-black text-[#128C7E] border border-[#128C7E]/20 whitespace-nowrap hover:bg-[#128C7E]/5 transition-colors flex-shrink-0"
          >
            {playbackRate.toFixed(1)}x
          </button>
        </div>

        {/* Footer info: Timer and WhatsApp Ticks */}
        <div className="flex items-center justify-between mt-1 text-[9px] text-[#128C7E]/80 font-semibold">
          <span>
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
          <div className="flex items-center gap-0.5">
            <CheckCheck size={12} className="text-[#34B7F1]" />
          </div>
        </div>
      </div>
    </div>
  );
}
