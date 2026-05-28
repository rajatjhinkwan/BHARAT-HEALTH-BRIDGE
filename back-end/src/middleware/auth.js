import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import Doctor from '../models/Doctor.js';
import { getWorkflowContext } from '../lib/permissions.js';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — token required' });
  }

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    if (err.message === 'JWT_SECRET is not configured') {
      return res.status(500).json({ error: 'Server authentication is not configured' });
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const validatePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const context = getWorkflowContext(req.user);
    if (!context.permissions[permissionName]) {
      return res.status(403).json({ error: `Forbidden: requires permission ${permissionName}` });
    }
    next();
  };
};

export const requireDoctor = async (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  const allowed = ['doctor', 'medical_director', 'hospital_admin', 'super_admin'];
  if (!allowed.includes(role)) {
    return res.status(403).json({ error: 'Doctor access required' });
  }
  next();
};

export const attachDoctorProfile = async (req, res, next) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) {
      doctor = await Doctor.createFromUser(req.user);
    }
    req.doctor = doctor;
    next();
  } catch (err) {
    next(err);
  }
};
