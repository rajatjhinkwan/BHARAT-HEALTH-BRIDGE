import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="no-print" style={{ 
            background: '#0f172a', 
            color: '#94a3b8', 
            padding: '2rem',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.85rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} />
                <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>Bharat Health Bridge Enterprise Build v2.4.0</span>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem' }}>
               <span>Server IP: 192.168.10.4 (Internal)</span>
               <span>IT Support Ext: 4004</span>
               <span>Data Policy: HIPAA Compliant Level 3</span>
            </div>

            <div style={{ marginTop: '1rem', opacity: 0.7 }}>
                &copy; {new Date().getFullYear()} Bharat Health Bridge Systems Administration. Unauthorized distribution is prohibited.
            </div>
        </footer>
    );
}
