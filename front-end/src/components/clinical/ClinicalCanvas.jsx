import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ClinicalCanvas = ({ onSave, initialData, gridVisible, gridSpacing }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetWidth * 1.414; // A4 Aspect Ratio
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setContext(ctx);

      if (initialData) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = initialData;
      }
    }
  }, [initialData]);

  const saveState = () => {
    setHistory(prev => [...prev, canvasRef.current.toDataURL()]);
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history.pop();
    setRedoStack(prevRedo => [canvasRef.current.toDataURL(), ...prevRedo]);
    setHistory([...history]);

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (history.length > 0) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = history[history.length - 1];
    }
    onSave(history.length > 0 ? history[history.length - 1] : null);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack.shift();
    setHistory(prev => [...prev, next]);
    setRedoStack([...redoStack]);

    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = next;
    onSave(next);
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    context.closePath();
    setIsDrawing(false);
    saveState();
    onSave(canvasRef.current.toDataURL());
  };

  const clearCanvas = () => {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
    setRedoStack([]);
    onSave(null);
  };

  return (
    <div className="a4-sheet shadow-2xl relative bg-white printable-canvas">
      <div
        className="grid-overlay pointer-events-none non-printable"
        style={{
          opacity: gridVisible / 100,
          backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
          backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
          zIndex: 5
        }}
      ></div>
      <div className="canvas-toolbar flex gap-2 p-2 absolute top-0 right-0 z-10 non-printable">
        <button onClick={undo} className="tool-btn"><ChevronLeft size={16} /></button>
        <button onClick={redo} className="tool-btn"><ChevronRight size={16} /></button>
        <button onClick={clearCanvas} className="tool-btn text-red-500"><X size={16} /></button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="clinical-canvas"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default ClinicalCanvas;
