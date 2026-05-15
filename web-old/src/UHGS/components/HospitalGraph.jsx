import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
    Users, 
    Stethoscope, 
    Home, 
    Activity, 
    Settings, 
    Search,
    Plus,
    Minus,
    Maximize,
    ChevronRight,
    CircleDashed,
    LifeBuoy,
    Trash2,
    RotateCcw,
    RotateCw,
    Sliders,
    X,
    Maximize2,
    Minimize2,
    Grab
} from 'lucide-react';

const NODE_TYPES = {
    ROOT: { color: '#2563eb', icon: Settings, label: 'Central Command', level: 0 },
    DEPARTMENT: { color: '#8b5cf6', icon: Home, label: 'Dept', level: 1 },
    STAFF: { color: '#10b981', icon: Users, label: 'Staff', level: 2 },
    DOCTOR: { color: '#ef4444', icon: Stethoscope, label: 'Doctor', level: 2 },
    BED: { color: '#f59e0b', icon: Activity, label: 'Bed', level: 2 }
};

// Initial Mock Data Structure
const initialData = {
    nodes: [
        { 
            id: 'root', 
            type: 'ROOT', 
            label: 'Adam Smith', 
            role: 'Hospital Director', 
            subRole: 'Admin - CEO',
            status: 'Online',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            x: 0, y: 0 
        },
        { 
            id: 'dept_emergency', 
            type: 'DEPARTMENT', 
            label: 'Emily Johnson', 
            role: 'Emergency Head',
            subRole: 'Technical Manager',
            status: 'Offline',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
            parentId: 'root', 
            x: -400, y: 250 
        },
        { 
            id: 'dept_icu', 
            type: 'DEPARTMENT', 
            label: 'David Wilson', 
            role: 'ICU Chief',
            subRole: 'Operations Manager',
            status: 'Escalated',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
            parentId: 'root', 
            x: 0, y: 250 
        },
        { 
            id: 'dept_cardio', 
            type: 'DEPARTMENT', 
            label: 'Priya Patel', 
            role: 'Cardiology Lead',
            subRole: 'Medical Director',
            status: 'Online',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
            parentId: 'root', 
            x: 400, y: 250 
        },
        { 
            id: 'staff_nurse1', 
            type: 'STAFF', 
            label: 'Oscar Reyes', 
            role: 'Lead Nurse',
            subRole: 'Shift Supervisor',
            status: 'Online',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            parentId: 'dept_emergency', 
            x: -550, y: 500 
        },
        { 
            id: 'staff_doc1', 
            type: 'DOCTOR', 
            label: 'Rahul Verma', 
            role: 'ER Resident',
            subRole: 'Junior Doctor',
            status: 'Escalated',
            avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop',
            parentId: 'dept_emergency', 
            x: -250, y: 500 
        },
        { 
            id: 'asset_bed1', 
            type: 'BED', 
            label: 'Lara Miller', 
            role: 'Critical Care Unit',
            subRole: 'Bed Management',
            status: 'Escalated',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
            parentId: 'dept_icu', 
            x: 0, y: 500 
        },
        { 
            id: 'staff_nurse2', 
            type: 'STAFF', 
            label: 'Erika Lee', 
            role: 'Cardiac Nurse',
            subRole: 'Team Leader',
            status: 'Online',
            avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100&h=100&fit=crop',
            parentId: 'dept_cardio', 
            x: 400, y: 500 
        },
    ],
    links: [
        { source: 'root', target: 'dept_emergency' },
        { source: 'root', target: 'dept_icu' },
        { source: 'root', target: 'dept_cardio' },
        { source: 'dept_emergency', target: 'staff_nurse1' },
        { source: 'dept_emergency', target: 'staff_doc1' },
        { source: 'dept_icu', target: 'asset_bed1' },
        { source: 'dept_cardio', target: 'staff_nurse2' },
    ]
};

const initialConfig = {
    hSpacing: 1,
    vSpacing: 1,
    nodeScale: 1,
    edgeThickness: 2,
};

export default function HospitalGraph({ onNodeSelect, isFullscreen, toggleFullscreen }) {
    const [viewData, setViewData] = useState(initialData);
    const [zoom, setZoom] = useState(0.8);
    const [offset, setOffset] = useState({ x: 0, y: -100 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    
    // Layout customization state
    const [config, setConfig] = useState(initialConfig);

    // History management
    const [history, setHistory] = useState([{ viewData: initialData, config: initialConfig }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const pushToHistory = (newData, newConfig) => {
        const entry = { 
            viewData: newData || viewData, 
            config: newConfig || config 
        };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(entry);
        if (newHistory.length > 50) newHistory.shift(); 
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        if (newData) setViewData(newData);
        if (newConfig) setConfig(newConfig);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setViewData(history[prevIndex].viewData);
            setConfig(history[prevIndex].config);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setViewData(history[nextIndex].viewData);
            setConfig(history[nextIndex].config);
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
    const handleReset = () => { setZoom(0.8); setOffset({ x: 0, y: -100 }); };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY;
            if (delta > 0) handleZoomOut();
            else handleZoomIn();
        }
    };

    const handlePan = (event, info) => {
        setOffset(prev => ({
            x: prev.x + info.delta.x / zoom,
            y: prev.y + info.delta.y / zoom
        }));
    };

    const handleDragEnd = (event, info, nodeId) => {
        const updatedNodes = viewData.nodes.map(node => {
            if (node.id === nodeId) {
                return { 
                    ...node, 
                    x: node.x + (info.offset.x / (zoom * config.hSpacing)), 
                    y: node.y + (info.offset.y / (zoom * config.vSpacing))
                };
            }
            return node;
        });
        pushToHistory({ ...viewData, nodes: updatedNodes }, null);
    };

    const handleDeleteNode = (nodeId) => {
        const nodeToDelete = viewData.nodes.find(n => n.id === nodeId);
        if (!nodeToDelete || nodeToDelete.type === 'ROOT') return;

        const getDescendants = (id) => {
            const children = viewData.nodes.filter(n => n.parentId === id);
            let descendants = [...children];
            children.forEach(child => {
                descendants = [...descendants, ...getDescendants(child.id)];
            });
            return descendants;
        };

        const descendants = getDescendants(nodeId);
        const idsToRemove = [nodeId, ...descendants.map(d => d.id)];

        const updatedNodes = viewData.nodes.filter(n => !idsToRemove.includes(n.id));
        const updatedLinks = viewData.links.filter(l => 
            !idsToRemove.includes(l.source) && !idsToRemove.includes(l.target)
        );

        pushToHistory({ nodes: updatedNodes, links: updatedLinks }, null);
    };

    // Calculate node position based on config
    const getNodePos = (node) => ({
        x: (node.x * config.hSpacing),
        y: (node.y * config.vSpacing)
    });

    return (
        <div className="uhgs-viewport" onWheel={handleWheel}>
            {/* Legend / Overlay Controls */}
            <div className="uhgs-top-toolbar">
                <div className="history-controls">
                    <button 
                        className={`control-btn-mini ${historyIndex === 0 ? 'disabled' : ''}`} 
                        onClick={handleUndo} 
                        title="Undo"
                        disabled={historyIndex === 0}
                    >
                        <RotateCcw size={18} color={historyIndex === 0 ? "#475569" : "#fff"} />
                    </button>
                    <button 
                        className={`control-btn-mini ${historyIndex === history.length - 1 ? 'disabled' : ''}`} 
                        onClick={handleRedo} 
                        title="Redo"
                        disabled={historyIndex === history.length - 1}
                    >
                        <RotateCw size={18} color={historyIndex === history.length - 1 ? "#475569" : "#fff"} />
                    </button>
                </div>
                <button 
                    className={`control-btn-mini ${showSettings ? 'active' : ''}`} 
                    onClick={() => setShowSettings(!showSettings)} 
                    title="Layout Settings"
                >
                    <Sliders size={18} color="#fff" />
                </button>
                
                <button 
                    className={`control-btn-mini ${isFullscreen ? 'active' : ''}`} 
                    onClick={toggleFullscreen} 
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize2 size={18} color="#fff" /> : <Maximize2 size={18} color="#fff" />}
                </button>
            </div>

            <AnimatePresence>
                {showSettings && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="uhgs-settings-panel uhgs-glass-panel"
                    >
                        <div className="settings-header">
                            <h3>Layout Engine</h3>
                            <button onClick={() => setShowSettings(false)} className="close-settings"><X size={18}/></button>
                        </div>
                        <div className="settings-body">
                            <div className="setting-item">
                                <label>Horizontal Space</label>
                                <input 
                                    type="range" min="0.5" max="2.5" step="0.1" 
                                    value={config.hSpacing} 
                                    onChange={(e) => {
                                        const newConfig = {...config, hSpacing: parseFloat(e.target.value)};
                                        setConfig(newConfig);
                                    }}
                                    onMouseUp={() => pushToHistory(null, config)}
                                />
                            </div>
                            <div className="setting-item">
                                <label>Vertical Space</label>
                                <input 
                                    type="range" min="0.5" max="2.5" step="0.1" 
                                    value={config.vSpacing} 
                                    onChange={(e) => {
                                        const newConfig = {...config, vSpacing: parseFloat(e.target.value)};
                                        setConfig(newConfig);
                                    }}
                                    onMouseUp={() => pushToHistory(null, config)}
                                />
                            </div>
                            <div className="setting-item">
                                <label>Node Scale</label>
                                <input 
                                    type="range" min="0.5" max="1.5" step="0.1" 
                                    value={config.nodeScale} 
                                    onChange={(e) => {
                                        const newConfig = {...config, nodeScale: parseFloat(e.target.value)};
                                        setConfig(newConfig);
                                    }}
                                    onMouseUp={() => pushToHistory(null, config)}
                                />
                            </div>
                            <div className="setting-item">
                                <label>Link Thickness</label>
                                <input 
                                    type="range" min="1" max="12" step="1" 
                                    value={config.edgeThickness} 
                                    onChange={(e) => {
                                        const newConfig = {...config, edgeThickness: parseInt(e.target.value)};
                                        setConfig(newConfig);
                                    }}
                                    onMouseUp={() => pushToHistory(null, config)}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.svg 
                width="100%" 
                height="100%" 
                style={{ background: 'transparent', touchAction: 'none' }}
                onPan={handlePan}
            >
                <motion.g
                    animate={{ scale: zoom, x: offset.x * zoom + (isFullscreen ? window.innerWidth/2 : 600), y: offset.y * zoom + (isFullscreen ? window.innerHeight/2 : 100) }}
                    transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                >
                    {/* Render Links */}
                    <AnimatePresence>
                        {viewData.links.map((link) => {
                            const sourceNode = viewData.nodes.find(n => n.id === link.source);
                            const targetNode = viewData.nodes.find(n => n.id === link.target);
                            if (!sourceNode || !targetNode) return null;

                            const source = getNodePos(sourceNode);
                            const target = getNodePos(targetNode);

                            const cardHeight = 140 * config.nodeScale;
                            const startX = source.x;
                            const startY = source.y + cardHeight; 
                            const endX = target.x;
                            const endY = target.y; 
                            
                            const cp1Y = startY + (endY - startY) / 2;
                            const cp2Y = startY + (endY - startY) / 2;

                            const path = `M ${startX} ${startY} C ${startX} ${cp1Y}, ${endX} ${cp2Y}, ${endX} ${endY}`;

                            return (
                                <motion.path
                                    key={`link-${link.source}-${link.target}`}
                                    d={path}
                                    className={`graph-link ${hoveredNode === link.source || hoveredNode === link.target ? 'active' : ''}`}
                                    style={{ strokeWidth: config.edgeThickness }}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                />
                            );
                        })}
                    </AnimatePresence>

                    {/* Render Nodes */}
                    <AnimatePresence>
                        {viewData.nodes.map((node) => {
                            const pos = getNodePos(node);
                            const cardWidth = 260 * config.nodeScale;
                            
                            return (
                                <motion.g
                                    key={node.id}
                                    drag
                                    dragMomentum={false}
                                    onDragEnd={(e, info) => handleDragEnd(e, info, node.id)}
                                    initial={{ scale: 0, opacity: 0, x: pos.x - cardWidth/2, y: pos.y }}
                                    animate={{ scale: config.nodeScale, opacity: 1, x: pos.x - cardWidth/2, y: pos.y }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    whileHover={{ zIndex: 50, scale: config.nodeScale * 1.05 }}
                                    onHoverStart={() => setHoveredNode(node.id)}
                                    onHoverEnd={() => setHoveredNode(null)}
                                    className="graph-node"
                                >
                                    <foreignObject width={260} height={145}>
                                        <div className="node-card" onClick={(e) => { e.stopPropagation(); onNodeSelect(node); }}>
                                            <div className="node-card-header">
                                                <div className="node-avatar-container">
                                                    <img src={node.avatar} alt={node.label} className="node-avatar" />
                                                    <span className={`status-indicator-mini dot-${node.status.toLowerCase()}`}></span>
                                                </div>
                                                <div className="node-header-actions">
                                                    <span className={`status-badge badge-${node.status.toLowerCase()}`}>
                                                        {node.status}
                                                    </span>
                                                    {node.type !== 'ROOT' && (
                                                        <button 
                                                            className="delete-node-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteNode(node.id);
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="node-card-info">
                                                <div className="node-name">{node.label}</div>
                                                <div className="node-role">{node.subRole}</div>
                                            </div>

                                            <div className="node-card-footer">
                                                <div className="status-dot-text">
                                                    <span className={`dot dot-${node.status.toLowerCase()}`}></span>
                                                    {node.status}
                                                </div>
                                                <div className="action-btn-mini">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </foreignObject>
                                </motion.g>
                            );
                        })}
                    </AnimatePresence>
                </motion.g>
            </motion.svg>

            <div className="uhgs-controls">
                <button className="control-btn" onClick={handleZoomIn} title="Zoom In"><Plus size={20}/></button>
                <button className="control-btn" onClick={handleZoomOut} title="Zoom Out"><Minus size={20}/></button>
                <button className="control-btn" onClick={handleReset} title="Reset View"><Maximize size={20}/></button>
                <div className="pan-indicator">
                    <Grab size={16} color="#94a3b8" />
                    <span>Drag background to pan</span>
                </div>
            </div>
        </div>
    );
}
