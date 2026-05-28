import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ClinicalCanvas = forwardRef(function ClinicalCanvas(
  {
    onSave,
    initialData,
    gridVisible = 50,
    gridSpacing = 25,
    variant = 'a4',
    drawingTool = 'pen',
    strokeColor = '#2563eb',
    strokeWidth = 2,
    eraserWidth = 14,
    gridStyle = 'grid',
    showToolbar = true,
  },
  ref
) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Stroke-based vector canvas tracking
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [strokesHistory, setStrokesHistory] = useState([]);
  const [strokesRedoStack, setStrokesRedoStack] = useState([]);

  const heightRatio = variant === 'pad' ? 0.42 : 1.414;

  const drawStrokes = (strokesList, ctx, canvasWidth, canvasHeight) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    strokesList.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      
      const first = stroke.points[0];
      ctx.moveTo(first.x, first.y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.closePath();
    });
  };

  // Initialize and resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth || 320;
      canvas.width = w;
      canvas.height = Math.max(120, w * heightRatio);
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (initialData && initialData.startsWith('[')) {
        try {
          const parsed = JSON.parse(initialData);
          setStrokes(parsed);
          drawStrokes(parsed, ctx, canvas.width, canvas.height);
        } catch (e) {
          console.error("Failed to parse initial strokes", e);
        }
      } else if (initialData) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = initialData;
      } else if (strokes.length > 0) {
        // Redraw existing strokes on resize to maintain responsive crisp lines
        drawStrokes(strokes, ctx, canvas.width, canvas.height);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [initialData, heightRatio, strokes]);

  // Image scanning space optimization: Crops handwriting bounding box and translates to top-left to save print space
  const cropAndShiftInk = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    let imgData;
    try {
      imgData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      console.warn('Canvas pixel scanning read error', e);
      return null;
    }
    
    const data = imgData.data;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let hasContent = false;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 8) { // threshold for visual ink
          hasContent = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (!hasContent) return null;
    
    // Add brief margin padding
    const padding = 16;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w, maxX + padding);
    maxY = Math.min(h, maxY + padding);
    
    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = croppedWidth;
    tempCanvas.height = croppedHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(
      canvas,
      minX, minY, croppedWidth, croppedHeight,
      0, 0, croppedWidth, croppedHeight
    );
    
    return tempCanvas.toDataURL('image/png');
  };

  const saveState = (currentStrokes = strokes) => {
    if (!canvasRef.current) return;
    setHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
    setStrokesHistory((prev) => [...prev, currentStrokes]);
    setRedoStack([]);
    setStrokesRedoStack([]);
  };

  const restoreImage = (dataUrl, activeStrokes = null) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!dataUrl) {
      onSave?.(null, null, null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const cropped = cropAndShiftInk();
      
      const currentStrokes = activeStrokes !== null ? activeStrokes : strokes;
      const strokesStr = JSON.stringify({
        width: canvas.width,
        height: canvas.height,
        strokes: currentStrokes
      });
      onSave?.(dataUrl, cropped, strokesStr);
    };
    img.src = dataUrl;
  };

  const undo = () => {
    if (history.length === 0) {
      setStrokes([]);
      restoreImage(null);
      return;
    }
    const current = canvasRef.current?.toDataURL();
    
    setStrokesRedoStack((r) => [strokes, ...r]);
    setRedoStack((r) => (current ? [current, ...r] : r));
    
    const priorStrokes = strokesHistory.length > 0 ? strokesHistory[strokesHistory.length - 1] : [];
    setStrokes(priorStrokes);
    setStrokesHistory((h) => h.slice(0, -1));
    setHistory((h) => h.slice(0, -1));
    
    const prior = history.length > 1 ? history[history.length - 2] : null;
    restoreImage(prior, priorStrokes);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    const nextStrokes = strokesRedoStack.length > 0 ? strokesRedoStack[0] : strokes;
    
    setHistory((h) => [...h, canvasRef.current?.toDataURL()].filter(Boolean));
    setStrokesHistory((h) => [...h, strokes]);
    
    setRedoStack((r) => r.slice(1));
    setStrokesRedoStack((r) => r.slice(1));
    
    setStrokes(nextStrokes);
    restoreImage(next, nextStrokes);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setStrokesHistory([]);
    setRedoStack([]);
    setStrokesRedoStack([]);
    setStrokes([]);
    onSave?.(null, null, null);
  };

  useImperativeHandle(ref, () => ({ undo, redo, clear: clearCanvas, crop: cropAndShiftInk }));

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Apply styles to context directly inside event
    if (drawingTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = eraserWidth;
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalCompositeOperation = 'source-over';
    }
    
    const newStroke = {
      points: [{ x: Math.round(x), y: Math.round(y) }],
      color: drawingTool === 'eraser' ? '#ffffff' : strokeColor,
      width: drawingTool === 'eraser' ? eraserWidth : strokeWidth,
      tool: drawingTool,
    };
    setCurrentStroke(newStroke);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    // Maintain correct styles on context during draw loop
    if (drawingTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = eraserWidth;
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalCompositeOperation = 'source-over';
    }

    if (currentStroke) {
      currentStroke.points.push({ x: Math.round(x), y: Math.round(y) });
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    ctx.closePath();
    setIsDrawing(false);
    
    let updatedStrokes = strokes;
    if (currentStroke) {
      updatedStrokes = [...strokes, currentStroke];
      setStrokes(updatedStrokes);
      setCurrentStroke(null);
    }

    saveState(updatedStrokes);
    
    const rawData = canvas.toDataURL();
    const croppedData = cropAndShiftInk();
    
    const strokesStr = JSON.stringify({
      width: canvas.width,
      height: canvas.height,
      strokes: updatedStrokes
    });
    onSave?.(rawData, croppedData, strokesStr);
  };

  const sheetClass =
    variant === 'pad' ? 'clinical-canvas-pad-sheet' : 'a4-sheet shadow-2xl relative bg-white printable-canvas';

  // Construct standard grid background images based on selection
  let gridBgImage = 'none';
  if (gridStyle === 'grid') {
    gridBgImage = `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`;
  } else if (gridStyle === 'ruled') {
    gridBgImage = `linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`;
  } else if (gridStyle === 'dots') {
    gridBgImage = `radial-gradient(#cbd5e1 1.5px, transparent 1.5px)`;
  }

  return (
    <div className={sheetClass}>
      <div
        className="grid-overlay pointer-events-none non-printable"
        style={{
          opacity: gridVisible / 100,
          backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
          backgroundImage: gridBgImage,
          zIndex: 5,
        }}
      />
      
      {/* Red ruled copy margin line when ruled style is active */}
      {gridStyle === 'ruled' && (
        <div
          className="ruled-margin-line pointer-events-none non-printable absolute top-0 bottom-0"
          style={{
            left: '40px',
            width: '2px',
            background: 'rgba(239, 68, 68, 0.4)',
            zIndex: 6,
          }}
        />
      )}

      {showToolbar && (
        <div className="canvas-toolbar flex gap-2 p-2 absolute top-0 right-0 z-10 non-printable">
          <button type="button" onClick={undo} className="tool-btn" title="Undo">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={redo} className="tool-btn" title="Redo">
            <ChevronRight size={16} />
          </button>
          <button type="button" onClick={clearCanvas} className="tool-btn text-red-500" title="Clear Canvas">
            <X size={16} />
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="clinical-canvas"
        style={{ touchAction: 'none', width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
});

export default ClinicalCanvas;

