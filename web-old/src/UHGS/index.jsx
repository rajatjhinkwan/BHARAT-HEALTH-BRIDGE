import React, { useState } from 'react';
import HospitalGraph from './components/HospitalGraph';
import NodeDetail from './components/NodeDetail';
import { Activity, ShieldCheck, Search, Bell, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UHGS.css';

export default function UHGSContainer() {
    const [selectedNode, setSelectedNode] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const navigate = useNavigate();

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    return (
        <div className={`uhgs-container ${isFullscreen ? 'fullscreen' : ''}`}>
            {/* Header / Command Bar */}
            {!isFullscreen && (
                <header className="uhgs-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            onClick={() => navigate('/admin')} 
                            style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '12px' }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>UHGS <span className="text-primary">Command</span> Center</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Universal Hospital Governance System - Real-time Ops Visualization</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Search size={16} color="#94a3b8" />
                            <input 
                                placeholder="Find node or staff..." 
                                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ background: 'transparent', color: '#94a3b8', border: 'none' }}><Bell size={20}/></button>
                            <div style={{ padding: '0.4rem 0.8rem', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>SYSTEM OK</div>
                        </div>
                    </div>
                </header>
            )}

            {/* Main Graph View */}
            <main style={{ position: 'relative' }}>
                <HospitalGraph 
                    onNodeSelect={(node) => setSelectedNode(node)} 
                    isFullscreen={isFullscreen}
                    toggleFullscreen={toggleFullscreen}
                />
                
                {/* Node Detail Side Panel */}
                <NodeDetail 
                    selectedNode={selectedNode} 
                    onClose={() => setSelectedNode(null)} 
                />
            </main>

            {/* Status Footer / Command Summary */}
            {!isFullscreen && (
                <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem 2rem', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', zIndex: 40 }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nodes Connected: <span style={{ color: '#fff', fontWeight: 600 }}>12</span></div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Departments: <span style={{ color: '#fff', fontWeight: 600 }}>04</span></div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Staff: <span style={{ color: '#fff', fontWeight: 600 }}>156</span></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Latency: <span style={{ color: 'var(--success)', fontWeight: 600 }}>12ms</span></div>
                </footer>
            )}
        </div>
    );
}
