import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

function parseInitialStrokes(initialData) {
  if (!initialData || typeof initialData !== 'string') return null;
  const trimmed = initialData.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (parsed?.strokes && Array.isArray(parsed.strokes)) return parsed.strokes;
  } catch {
    /* fall through to image load */
  }
  return null;
}

function drawStrokePath(ctx, stroke) {
  const points = stroke?.points;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i += 1) {
      const cx = (points[i].x + points[i + 1].x) / 2;
      const cy = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, cx, cy);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
  ctx.restore();
}

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
  const logicalSizeRef = useRef({ width: 320, height: 452 });
  const dprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  const strokesRef = useRef([]);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const lastPointRef = useRef(null);

  const drawingToolRef = useRef(drawingTool);
  const strokeColorRef = useRef(strokeColor);
  const strokeWidthRef = useRef(strokeWidth);
  const eraserWidthRef = useRef(eraserWidth);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [strokesHistory, setStrokesHistory] = useState([]);
  const [strokesRedoStack, setStrokesRedoStack] = useState([]);

  const heightRatio = variant === 'pad' ? 0.42 : 1.414;

  useEffect(() => {
    drawingToolRef.current = drawingTool;
  }, [drawingTool]);

  useEffect(() => {
    strokeColorRef.current = strokeColor;
  }, [strokeColor]);

  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  useEffect(() => {
    eraserWidthRef.current = eraserWidth;
  }, [eraserWidth]);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return ctx;
  }, []);

  const redrawStrokes = useCallback((strokeList = strokesRef.current) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const { width, height } = logicalSizeRef.current;
    ctx.save();
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.clearRect(0, 0, width, height);
    strokeList.forEach((stroke) => drawStrokePath(ctx, stroke));
    if (currentStrokeRef.current) {
      drawStrokePath(ctx, currentStrokeRef.current);
    }
    ctx.restore();
  }, [getContext]);

  const loadImageData = useCallback(
    (dataUrl) => {
      const canvas = canvasRef.current;
      const ctx = getContext();
      if (!canvas || !ctx || !dataUrl) return;

      const { width, height } = logicalSizeRef.current;
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();
      };
      img.src = dataUrl;
    },
    [getContext]
  );

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const width = parent.clientWidth || 320;
    const height = Math.max(120, width * heightRatio);
    const dpr = window.devicePixelRatio || 1;

    logicalSizeRef.current = { width, height };
    dprRef.current = dpr;

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = getContext();
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    redrawStrokes();
  }, [getContext, heightRatio, redrawStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return undefined;

    setupCanvas();

    const parsedStrokes = parseInitialStrokes(initialData);
    if (parsedStrokes) {
      strokesRef.current = parsedStrokes;
      redrawStrokes(parsedStrokes);
    } else if (initialData && initialData.startsWith('data:image')) {
      strokesRef.current = [];
      loadImageData(initialData);
    } else {
      strokesRef.current = [];
      redrawStrokes([]);
    }

    const ro = new ResizeObserver(() => {
      setupCanvas();
      redrawStrokes();
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [initialData, setupCanvas, redrawStrokes, loadImageData]);

  const cropAndShiftInk = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    let imgData;
    try {
      imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.warn('Canvas pixel scanning read error', e);
      return null;
    }

    const { width: w, height: h } = canvas;
    const data = imgData.data;
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let hasContent = false;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 8) {
          hasContent = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasContent) return null;

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
    tempCtx.drawImage(canvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
    return tempCanvas.toDataURL('image/png');
  }, []);

  const emitSave = useCallback(
    (activeStrokes = strokesRef.current) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rawData = canvas.toDataURL('image/png');
      const croppedData = cropAndShiftInk();
      const strokesStr = JSON.stringify({
        width: logicalSizeRef.current.width,
        height: logicalSizeRef.current.height,
        strokes: activeStrokes,
      });
      onSave?.(rawData, croppedData, strokesStr);
    },
    [cropAndShiftInk, onSave]
  );

  const saveState = useCallback((currentStrokes = strokesRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory((prev) => [...prev, canvas.toDataURL('image/png')]);
    setStrokesHistory((prev) => [...prev, currentStrokes]);
    setRedoStack([]);
    setStrokesRedoStack([]);
  }, []);

  const restoreImage = useCallback(
    (dataUrl, activeStrokes = strokesRef.current) => {
      strokesRef.current = activeStrokes || [];
      currentStrokeRef.current = null;
      isDrawingRef.current = false;
      lastPointRef.current = null;

      if (!dataUrl) {
        redrawStrokes([]);
        onSave?.(null, null, null);
        return;
      }

      loadImageData(dataUrl);
      emitSave(activeStrokes);
    },
    [emitSave, loadImageData, onSave, redrawStrokes]
  );

  const undo = useCallback(() => {
    if (history.length === 0) {
      strokesRef.current = [];
      restoreImage(null, []);
      return;
    }

    const current = canvasRef.current?.toDataURL('image/png');
    setStrokesRedoStack((r) => [strokesRef.current, ...r]);
    setRedoStack((r) => (current ? [current, ...r] : r));

    const priorStrokes = strokesHistory.length > 0 ? strokesHistory[strokesHistory.length - 1] : [];
    setStrokesHistory((h) => h.slice(0, -1));
    setHistory((h) => h.slice(0, -1));

    const prior = history.length > 1 ? history[history.length - 2] : null;
    restoreImage(prior, priorStrokes);
  }, [history, restoreImage, strokesHistory]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const next = redoStack[0];
    const nextStrokes = strokesRedoStack.length > 0 ? strokesRedoStack[0] : strokesRef.current;

    setHistory((h) => [...h, canvasRef.current?.toDataURL('image/png')].filter(Boolean));
    setStrokesHistory((h) => [...h, strokesRef.current]);
    setRedoStack((r) => r.slice(1));
    setStrokesRedoStack((r) => r.slice(1));

    restoreImage(next, nextStrokes);
  }, [redoStack, restoreImage, strokesRedoStack]);

  const clearCanvas = useCallback(() => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setHistory([]);
    setStrokesHistory([]);
    setRedoStack([]);
    setStrokesRedoStack([]);
    redrawStrokes([]);
    onSave?.(null, null, null);
  }, [onSave, redrawStrokes]);

  useImperativeHandle(ref, () => ({ undo, redo, clear: clearCanvas, crop: cropAndShiftInk }), [
    undo,
    redo,
    clearCanvas,
    cropAndShiftInk,
  ]);

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startStroke = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const point = getCanvasPoint(event);
    if (!point) return;

    event.preventDefault();
    canvasRef.current?.setPointerCapture(event.pointerId);

    const tool = drawingToolRef.current;
    const width = tool === 'eraser' ? eraserWidthRef.current : strokeWidthRef.current;
    const color = tool === 'eraser' ? '#000000' : strokeColorRef.current;

    const stroke = {
      points: [point],
      color,
      width,
      tool,
    };

    currentStrokeRef.current = stroke;
    isDrawingRef.current = true;
    lastPointRef.current = point;
    redrawStrokes();
  };

  const extendStroke = (event) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const point = getCanvasPoint(event);
    if (!point) return;

    event.preventDefault();

    const last = lastPointRef.current;
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx * dx + dy * dy < 0.8) return;
    }

    currentStrokeRef.current.points.push(point);
    lastPointRef.current = point;
    redrawStrokes();
  };

  const endStroke = (event) => {
    if (!isDrawingRef.current) return;

    event.preventDefault();

    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* pointer may already be released */
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;

    const finished = currentStrokeRef.current;
    currentStrokeRef.current = null;

    if (finished && finished.points.length > 0) {
      const updatedStrokes = [...strokesRef.current, finished];
      strokesRef.current = updatedStrokes;
      saveState(updatedStrokes);
      redrawStrokes(updatedStrokes);
      emitSave(updatedStrokes);
    } else {
      redrawStrokes();
    }
  };

  const sheetClass =
    variant === 'pad' ? 'clinical-canvas-pad-sheet' : 'a4-sheet shadow-2xl relative bg-white printable-canvas';

  let gridBgImage = 'none';
  if (gridStyle === 'grid') {
    gridBgImage =
      'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)';
  } else if (gridStyle === 'ruled') {
    gridBgImage = 'linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)';
  } else if (gridStyle === 'dots') {
    gridBgImage = 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)';
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
        onPointerDown={startStroke}
        onPointerMove={extendStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={extendStroke}
        className="clinical-canvas"
        style={{ touchAction: 'none', width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
});

export default ClinicalCanvas;
