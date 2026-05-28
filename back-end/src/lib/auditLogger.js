import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export function logAuditAction(actor, action, details) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = new Date().toISOString().split('T')[0];
  const logMessage = `[${timestamp}] ${actor} | ${action} | ${details}\n`;
  
  // Console logging
  console.log(`[AUDIT LOG] ${logMessage.trim()}`);
  
  // File logging
  try {
    const logFile = path.join(logDir, `audit_${dateStr}.log`);
    fs.appendFileSync(logFile, logMessage, 'utf8');
  } catch (err) {
    console.error('Audit logger failed to write to file:', err.message);
  }
}
