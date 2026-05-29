import React, { useState, useRef } from 'react';
import {
  Pencil,
  Eraser,
  Undo,
  Redo,
  Trash2,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import ClinicalCanvas from '../../../../components/clinical/ClinicalCanvas';

export default function EmrWorkspaceCanvas({
  activeTab,
  currentPageIdx,
  pageContent,
  onSave,
  gridVisible,
  setGridVisible,
  gridSpacing,
  setGridSpacing,
  a4Zoom,
  setA4Zoom,
}) {
  const canvasApiRef = useRef(null);
  
  // Local control states
  const [drawingTool, setDrawingTool] = useState('pen');
  const [strokeColor] = useState('#0f172a'); // Defaulting to clean clinical dark slate/charcoal black
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(24);
  const [gridStyle, setGridStyle] = useState('grid'); // 'grid' | 'ruled' | 'dots' | 'none'
  const [confirmClear, setConfirmClear] = useState(false);

  // Pen sizes
  const penSizes = [
    { value: 1.5, label: 'Fine' },
    { value: 3, label: 'Medium' },
    { value: 5, label: 'Thick' },
    { value: 8, label: 'Bold' },
  ];

  // Eraser sizes
  const eraserSizes = [
    { value: 12, label: 'Small' },
    { value: 24, label: 'Medium' },
    { value: 40, label: 'Large' },
  ];

  const handleClear = () => {
    canvasApiRef.current?.clear();
    setConfirmClear(false);
  };

  return (
    <section className="emr-ws-canvas-col non-printable">
      {/* Canvas Viewport Frame */}
      <div className="emr-ws-canvas-viewport bg-slate-100 overflow-auto flex-1 p-6 min-h-[500px]">
        <div
          className="emr-ws-canvas-frame transition-transform duration-200 bg-white"
          style={{
            transform: `scale(${a4Zoom})`,
            transformOrigin: 'top center',
            width: '100%',
            maxWidth: '520px',
            margin: '0 auto',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* Integrated Docked Toolbar inside the actual page column container styled using Vanilla CSS */}
          <div className="emr-ws-canvas-toolbar select-none">
            {/* Single Row: Draw tools, Zoom & History controls */}
            <div className="emr-ws-toolbar-row">
              {/* Pen / Eraser toggles */}
              <div className="emr-ws-toggle-container">
                <button
                  type="button"
                  className={`emr-ws-toggle-btn ${drawingTool === 'pen' ? 'active' : ''}`}
                  onClick={() => {
                    setDrawingTool('pen');
                    setConfirmClear(false);
                  }}
                  title="Draw Pen"
                >
                  <Pencil size={11} />
                  Pen
                </button>
                <button
                  type="button"
                  className={`emr-ws-toggle-btn ${drawingTool === 'eraser' ? 'active' : ''}`}
                  onClick={() => {
                    setDrawingTool('eraser');
                    setConfirmClear(false);
                  }}
                  title="Eraser Tool"
                >
                  <Eraser size={11} />
                  Eraser
                </button>
              </div>

              {/* Zoom Actions */}
              <div className="emr-ws-zoom-box">
                <button
                  type="button"
                  onClick={() => setA4Zoom(Math.max(0.4, a4Zoom - 0.1))}
                  className="emr-ws-zoom-btn"
                  title="Zoom Out"
                >
                  <ZoomOut size={11} />
                </button>
                <span
                  className="emr-ws-zoom-label"
                  onClick={() => setA4Zoom(1.0)}
                  title="Reset Zoom to 100%"
                >
                  {Math.round(a4Zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setA4Zoom(Math.min(1.8, a4Zoom + 0.1))}
                  className="emr-ws-zoom-btn"
                  title="Zoom In"
                >
                  <ZoomIn size={11} />
                </button>
              </div>

              {/* History Rig */}
              <div className="emr-ws-history-rig">
                <button
                  type="button"
                  onClick={() => canvasApiRef.current?.undo()}
                  className="emr-ws-history-btn"
                  title="Undo Ink"
                >
                  <Undo size={11} className="text-slate-700" />
                </button>
                <button
                  type="button"
                  onClick={() => canvasApiRef.current?.redo()}
                  className="emr-ws-history-btn"
                  title="Redo Ink"
                >
                  <Redo size={11} className="text-slate-700" />
                </button>
                {confirmClear ? (
                  <div className="emr-ws-confirm-clear">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="clear-btn"
                    >
                      Clear?
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="emr-ws-history-btn btn-danger"
                    title="Clear Page"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actual Drawing Canvas Page */}
          <ClinicalCanvas
            ref={canvasApiRef}
            key={`${activeTab}-${currentPageIdx}`}
            initialData={pageContent}
            onSave={onSave}
            gridVisible={gridVisible}
            gridSpacing={gridSpacing}
            variant="a4"
            drawingTool={drawingTool}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            eraserWidth={eraserWidth}
            gridStyle={gridStyle}
            showToolbar={false}
          />
        </div>
      </div>
    </section>
  );
}
