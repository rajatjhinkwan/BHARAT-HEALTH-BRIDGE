import React from 'react';
import { Shield } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer no-print">
      <div className="site-footer-brand">
        <Shield size={16} />
        <span>Bharat Health Bridge Enterprise Build v2.4.0</span>
      </div>
      <div className="site-footer-links">
        <span>Server IP: 192.168.10.4 (Internal)</span>
        <span>IT Support Ext: 4004</span>
        <span>Data Policy: HIPAA Compliant Level 3</span>
      </div>
      <div className="site-footer-copy">
        &copy; {new Date().getFullYear()} Bharat Health Bridge Systems Administration. Unauthorized distribution is prohibited.
      </div>
    </footer>
  );
}
