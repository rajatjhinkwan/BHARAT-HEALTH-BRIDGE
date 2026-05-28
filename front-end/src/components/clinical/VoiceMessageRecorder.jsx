import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Check } from 'lucide-react';

export default function VoiceMessageRecorder({ isRecording, onToggle }) {
  const [elapsed, setElapsed] = useState(0);
  const canvasRef = useRef(null);

  // Timer effect for recording duration
  useEffect(() => {
    if (!isRecording) {
      setElapsed(0);
      return;
    }

    const t = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(t);
  }, [isRecording]);

  // Real-time audio waveform visualization effect
  useEffect(() => {
    if (!isRecording) return undefined;

    let audioContext;
    let analyser;
    let dataArray;
    let source;
    let animationId;
    let micStream;

    async function initAudio() {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64; // Small fft for clean wide bars
        source = audioContext.createMediaStreamSource(micStream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const draw = () => {
          if (!analyser || !canvas) return;
          animationId = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          // Clear with background color matching bubble
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const totalWidth = canvas.width;
          const spacing = 3;
          // Render 16 responsive bars
          const barCount = Math.min(16, bufferLength);
          const barWidth = (totalWidth - (barCount - 1) * spacing) / barCount;

          for (let i = 0; i < barCount; i++) {
            // Apply slight boost for voice range frequencies
            const amplitude = dataArray[i];
            let barHeight = (amplitude / 255) * canvas.height * 0.95;
            barHeight = Math.max(5, barHeight); // Min bar height

            const x = i * (barWidth + spacing);
            const y = (canvas.height - barHeight) / 2;

            // WhatsApp green visual theme
            ctx.fillStyle = '#25D366';
            ctx.beginPath();
            
            // Draw a rounded rectangle for visual fidelity
            if (ctx.roundRect) {
              ctx.roundRect(x, y, barWidth, barHeight, 2);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
        };

        draw();
      } catch (err) {
        console.error('Real-time voice stream visualizer blocked or failed:', err);
      }
    }

    initAudio();

    return () => {
      cancelAnimationFrame(animationId);
      if (source) source.disconnect();
      if (audioContext) audioContext.close();
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  // Formatter for MM:SS
  const formatSeconds = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="wa-voice-bubble-wrapper flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#E8F8F0] border border-[#d1f2e1] max-w-[340px] my-2 shadow-md animate-liftoff">
      
      {/* Left section: Recording status and visualizer */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        
        {/* Pulsating red recording circle */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping absolute" />
          <div className="w-3 h-3 rounded-full bg-red-600 relative" />
        </div>

        {/* Live animated canvas or fallback display */}
        <div className="flex-1 h-8 bg-white/40 rounded-lg px-2 flex items-center min-w-0 border border-[#128C7E]/10">
          {isRecording ? (
            <canvas 
              ref={canvasRef} 
              width={160} 
              height={32} 
              className="w-full h-full block"
            />
          ) : (
            <span className="text-[10px] text-[#128C7E] font-extrabold truncate">Tap mic to speak</span>
          )}
        </div>

        {/* Duration Timer */}
        <span className="text-xs font-black text-[#128C7E] whitespace-nowrap tabular-nums">
          {formatSeconds(elapsed)}
        </span>
      </div>

      {/* Right controls: Stop & Save button */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-9 h-9 rounded-full bg-[#128C7E] text-white flex items-center justify-center hover:scale-105 hover:bg-[#0e6e63] transition-all shadow-sm"
          title={isRecording ? 'Stop & Save Voice Note' : 'Record'}
        >
          {isRecording ? <Square size={14} fill="white" /> : <Mic size={14} fill="white" />}
        </button>
      </div>

    </div>
  );
}
