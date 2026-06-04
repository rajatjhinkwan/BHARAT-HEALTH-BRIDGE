import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldCheck, Server, Database, Lock, Search, 
  Network, Cpu, Wifi, Users, Stethoscope, HeartPulse, 
  Building2, ChevronRight, PenTool, Zap, Globe, Microscope, 
  Code2, Layout, Database as DbIcon, ShieldAlert, Binary, 
  CheckCircle2, Hospital, ClipboardList, Pill, MousePointer2,
  Clock, ArrowRight, Layers, Fingerprint, FlaskConical, Droplets,
  Truck, Siren, Calendar, BarChart3, Shield, Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

// Import high-fidelity generated assets
import heroImgV2 from '../../assets/home/hero_v2.png';
import stylusImgV2 from '../../assets/home/stylus_v2.png';
import logisticsImgV2 from '../../assets/home/logistics_v2.png';

const MedicalPulse = () => (
  <div className="pulse-bg-container">
    <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
      <path
        className="path-pulse"
        d="M0,150 L200,150 L220,50 L240,250 L260,150 L400,150 L420,0 L440,300 L460,150 L600,150 L620,80 L640,220 L660,150 L1000,150"
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  </div>
);

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            setMousePos({ x, y });
        };
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const modules = [
        {
            title: "Electronic Medical Records",
            desc: "Next-gen EMR with high-fidelity digital ink and blockchain-secured prescriptions.",
            icon: <PenTool size={24} />,
            features: ["Action Pad Engine", "Secure Prescription", "History Timeline"],
            link: "/emr",
            color: "#0ea5e9"
        },
        {
            title: "Triage & Queue",
            desc: "Smart prioritization using trauma algorithms and real-time patient flow tracking.",
            icon: <Activity size={24} />,
            features: ["Trauma Scoring", "Live Queue Sync", "Wait-time Analytics"],
            link: "/triage",
            color: "#ef4444"
        },
        {
            title: "Pharmacy & AI Engine",
            desc: "Smart dispensation with AI-driven generic alternative recommendations.",
            icon: <Pill size={24} />,
            features: ["Inventory Control", "Generic Search", "Order Tracking"],
            link: "/pharmacy",
            color: "#10b981"
        },
        {
            title: "Lab & Diagnostics",
            desc: "Unified laboratory management for test ordering and digital result delivery.",
            icon: <FlaskConical size={24} />,
            features: ["Test Scheduling", "Result Management", "Imaging Storage"],
            link: "/lab",
            color: "#8b5cf6"
        },
        {
            title: "Bed Management",
            desc: "Dynamic ward mapping with 1:1 visualization of bed occupancy and resources.",
            icon: <Hospital size={24} />,
            features: ["Visual Ward Map", "Transfer Requests", "Discharge Flow"],
            link: "/beds",
            color: "#f59e0b"
        },
        {
            title: "Supply Chain & Inventory",
            desc: "Enterprise resource planning for medicines, surgicals, and hospital assets.",
            icon: <Truck size={24} />,
            features: ["Stock Monitoring", "Purchase Orders", "Audit Logs"],
            link: "/inventory",
            color: "#6366f1"
        },
        {
            title: "Emergency Response",
            desc: "High-priority node for rapid trauma intake and immediate resource allocation.",
            icon: <Siren size={24} />,
            features: ["Rapid Intake", "Emergency Queue", "Alert Broadcast"],
            link: "/emergency",
            color: "#f43f5e"
        },
        {
            title: "HR & Shift Logic",
            desc: "Operational management for medical staff, rotations, and performance metrics.",
            icon: <Users size={24} />,
            features: ["Shift Scheduling", "Performance KPIs", "Staff Hierarchy"],
            link: "/hr",
            color: "#3b82f6"
        },
        {
            title: "Patient Engagement",
            desc: "Public-facing portal for appointment booking and UHID-linked health records.",
            icon: <Calendar size={24} />,
            features: ["Book Appointments", "Health Records", "Consultation Hub"],
            link: "/schedule",
            color: "#2dd4bf"
        }
    ];

    return (
        <main className="gateway-main">
            <div className="modern-grid"></div>
            <MedicalPulse />
            
            <div className="ambient-orb orb-primary" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}></div>
            <div className="ambient-orb orb-secondary" style={{ transform: `translate(${mousePos.x * -0.8}px, ${mousePos.y * -0.8}px)` }}></div>
            <div className="ambient-orb orb-tertiary" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}></div>

            <div className="gateway-content-wrapper">
                
                {/* HERO SECTION */}
                <section className="hero-section">
                    <div className="hero-container">
                        <div className="hero-text-content">
                            <div className="platform-badge animate-fade-in">
                                <Zap size={14} style={{ marginRight: '8px' }} /> BHARAT HEALTH BRIDGE • CORE v5.0
                            </div>

                            <h1 className="hero-title animate-slide-up">
                                The Intelligent <br />
                                <span className="text-gradient-medical">Healthcare Nation</span>
                            </h1>

                            <p className="hero-subtitle animate-slide-up delay-100">
                                Bharat Health Bridge is an enterprise-grade hospital ecosystem that bridges the gap between clinical excellence and digital precision. From blockchain-secured EMRs to AI-driven logistics, we orchestrate the future of Indian healthcare.
                            </p>

                            <div className="hero-cta-group animate-slide-up delay-200">
                                {user ? (
                                    <button onClick={() => navigate('/governance')} className="btn-glow">
                                        Go to Command Center <Layout size={20} />
                                    </button>
                                ) : (
                                    <button onClick={() => navigate('/login')} className="btn-glow">
                                        Secure Staff Access <ArrowRight size={20} />
                                    </button>
                                )}
                                <a href="#ecosystem" className="btn-outline">
                                    Explore Ecosystem
                                </a>
                            </div>

                            <div className="platform-stats-bar animate-slide-up delay-300">
                                <div className="stat-pill">
                                    <strong>1M+</strong>
                                    <span>Records Hashed</span>
                                </div>
                                <div className="stat-pill">
                                    <strong>500+</strong>
                                    <span>Hospitals Linked</span>
                                </div>
                                <div className="stat-pill">
                                    <strong>99.9%</strong>
                                    <span>System Uptime</span>
                                </div>
                                <div className="stat-pill">
                                    <strong>AES</strong>
                                    <span>Military Grade</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-visual-content animate-fade-in delay-200">
                            <div className="hero-main-visual">
                                <img src="/hero_graphic.png" alt="Clinical Command Center" className="floating-visual" />
                                <div className="visual-glow-overlay"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE CLINICAL JOURNEY */}
                <section id="journey" className="journey-section">
                    <div className="section-title-wrapper centered">
                        <span className="section-label">Operational Logic</span>
                        <h2 className="section-main-title">The Clinical Workflow</h2>
                        <p className="section-subtitle">How Bharat Health Bridge streamlines the patient experience through integrated technology.</p>
                    </div>

                    <div className="journey-flow-container">
                        <div className="journey-step">
                            <div className="step-number">01</div>
                            <div className="step-content">
                                <h3>Digital Registration</h3>
                                <p>UHID generation and ABDM integration for instant patient identification.</p>
                            </div>
                        </div>
                        <div className="journey-line"></div>
                        <div className="journey-step">
                            <div className="step-number">02</div>
                            <div className="step-content">
                                <h3>Intelligent Triage</h3>
                                <p>Vital sign analysis and priority scoring based on clinical severity.</p>
                            </div>
                        </div>
                        <div className="journey-line"></div>
                        <div className="journey-step">
                            <div className="step-number">03</div>
                            <div className="step-content">
                                <h3>Precise Encounter</h3>
                                <p>Digital ink documentation with Action Pad and blockchain prescriptions.</p>
                            </div>
                        </div>
                        <div className="journey-line"></div>
                        <div className="journey-step">
                            <div className="step-number">04</div>
                            <div className="step-content">
                                <h3>Connected Care</h3>
                                <p>Automated routing to Lab, Pharmacy, or Wards based on clinical orders.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MODULE UNIVERSE */}
                <section id="ecosystem" className="ecosystem-section">
                    <div className="section-title-wrapper centered">
                        <span className="section-label">Platform Modules</span>
                        <h2 className="section-main-title">The Bharat Health Universe</h2>
                        <p className="section-subtitle">A comprehensive suite of clinical and operational nodes working in perfect sync.</p>
                    </div>

                    <div className="module-grid">
                        {modules.map((m, i) => (
                            <div key={i} className="module-card" style={{ '--accent': m.color }}>
                                <div className="module-icon-box">{m.icon}</div>
                                <h3 className="module-title">{m.title}</h3>
                                <p className="module-desc">{m.desc}</p>
                                <ul className="module-features">
                                    {m.features.map((f, j) => (
                                        <li key={j}><CheckCircle2 size={14} /> {f}</li>
                                    ))}
                                </ul>
                                <button className="module-link-btn" onClick={() => navigate(m.link)}>
                                    Explore Module <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* TECHNICAL DEEP DIVE */}
                <section className="tech-deep-dive">
                    <div className="deep-dive-row">
                        <div className="deep-dive-content">
                            <div className="module-badge">SECURITY ARCHITECTURE</div>
                            <h2 className="deep-dive-title">Built on Trust, Secured by Blockchain</h2>
                            <p className="deep-dive-text">
                                Data integrity is the foundation of healthcare. Bharat Health Bridge employs a distributed ledger system where every clinical event—from triage vitals to prescriptions—is cryptographically hashed.
                            </p>
                            <div className="tech-feature-list">
                                <div className="tech-feature">
                                    <ShieldCheck className="text-primary" />
                                    <div>
                                        <h4>Zero-Knowledge Proofs</h4>
                                        <p>Verify patient identity without exposing sensitive personal data.</p>
                                    </div>
                                </div>
                                <div className="tech-feature">
                                    <Lock className="text-primary" />
                                    <div>
                                        <h4>AES-256 Mesh Encryption</h4>
                                        <p>End-to-end encryption for all real-time communication between stations.</p>
                                    </div>
                                </div>
                                <div className="tech-feature">
                                    <Globe className="text-primary" />
                                    <div>
                                        <h4>ABDM Compliance</h4>
                                        <p>Fully compatible with the Ayushman Bharat Digital Mission standards.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="deep-dive-visual">
                            <img src={heroImgV2} alt="Security Mesh" className="feature-img" />
                            <div className="visual-glow"></div>
                        </div>
                    </div>
                </section>

                {/* TECH STACK */}
                <section className="tech-stack-section">
                    <div className="section-title-wrapper centered">
                        <span className="section-label">Under the Hood</span>
                        <h2 className="section-main-title">Modern Tech for Modern Medicine</h2>
                    </div>
                    <div className="tech-grid">
                        <div className="tech-item">
                            <Code2 className="tech-icon" />
                            <div className="tech-name">React & Vite</div>
                            <span className="tech-tag">Reactive UI</span>
                        </div>
                        <div className="tech-item">
                            <Server className="tech-icon" />
                            <div className="tech-name">Node.js</div>
                            <span className="tech-tag">Scalable Backend</span>
                        </div>
                        <div className="tech-item">
                            <DbIcon className="tech-icon" />
                            <div className="tech-name">MongoDB</div>
                            <span className="tech-tag">Clinical Data</span>
                        </div>
                        <div className="tech-item">
                            <Binary className="tech-icon" />
                            <div className="tech-name">EtherMesh</div>
                            <span className="tech-tag">Blockchain Logic</span>
                        </div>
                    </div>
                </section>

                {/* CTA SECTION */}
                <section className="final-cta">
                    <div className="cta-container">
                        <h2 className="cta-title">Ready to digitize your hospital?</h2>
                        <p className="cta-desc">Join the 500+ hospitals already bridging the gap with Bharat Health Bridge.</p>
                        <div className="cta-buttons">
                            <button onClick={() => navigate('/login')} className="btn-glow">Hospital Staff Login</button>
                            <button onClick={() => navigate('/patient-login')} className="btn-outline">Patient Portal</button>
                        </div>
                    </div>
                </section>

            </div>

            <footer className="gateway-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h4 className="text-gradient-medical">BHARAT HEALTH BRIDGE</h4>
                        <p>A unified clinical operating system designed for the scale and complexity of Indian Healthcare.</p>
                        <div className="social-links">
                            {/* Icons would go here */}
                        </div>
                    </div>
                    <div className="footer-links">
                        <div className="footer-col">
                            <h5>Clinical Modules</h5>
                            <ul>
                                <li><a href="/emr">Action Pad EMR</a></li>
                                <li><a href="/triage">Smart Triage</a></li>
                                <li><a href="/pharmacy">AI Pharmacy</a></li>
                                <li><a href="/lab">Diagnostics</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Operational</h5>
                            <ul>
                                <li><a href="/beds">Bed Inventory</a></li>
                                <li><a href="/inventory">Supply Chain</a></li>
                                <li><a href="/hr">Staffing Logic</a></li>
                                <li><a href="/emergency">Trauma Node</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Patients</h5>
                            <ul>
                                <li><a href="/patient-login">My Health (Patient Login)</a></li>
                                <li><a href="/hospitals">Find Hospitals</a></li>
                                <li><a href="/patient-history">Medical History</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Legal & Security</h5>
                            <ul>
                                <li><a href="#">Privacy Mesh</a></li>
                                <li><a href="#">Terms of Service</a></li>
                                <li><a href="#">Blockchain Audit</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Bharat Health Bridge. Engineered for the Nation. v5.0.1 (Stable Build)</p>
                </div>
            </footer>
        </main>
    );    
}


