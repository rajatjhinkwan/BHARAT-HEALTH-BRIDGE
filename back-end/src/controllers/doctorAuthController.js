import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/index.js';
import Doctor from '../models/Doctor.js';

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev';
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET || 'dev-refresh';

function signTokens(userId) {
  const access = jwt.sign({ sub: userId, type: 'access' }, JWT_SECRET(), { expiresIn: '7d' });
  const refresh = jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_SECRET(), { expiresIn: '30d' });
  return { access, refresh };
}

function formatUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    employeeId: user.employeeId,
    department: user.department,
    avatar: user.avatar,
    specialization: user.specialization,
  };
}

export const registerDoctor = async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      department: z.string().optional(),
      specialization: z.string().optional(),
      employeeId: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { name, email, password, phone, department, specialization, employeeId } = parsed.data;

    const exists = await User.findOne({ $or: [{ email }, ...(employeeId ? [{ employeeId }] : [])] });
    if (exists) return res.status(409).json({ error: 'Doctor already registered with this email or ID' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      role: 'doctor',
      department,
      specialization,
      employeeId: employeeId || `DOC-${Date.now().toString(36).toUpperCase()}`,
      availabilityStatus: 'OFFLINE',
    });

    const doctor = await Doctor.createFromUser(user);
    const tokens = signTokens(user._id);

    res.status(201).json({
      message: 'Doctor registered successfully',
      token: tokens.access,
      refreshToken: tokens.refresh,
      user: formatUser(user),
      doctor: doctor.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

export const loginDoctor = async (req, res, next) => {
  try {
    const { email, employeeId, password, department } = req.body;
    let user = null;

    if (email) user = await User.findOne({ email });
    else if (employeeId) user = await User.findOne({ employeeId });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const role = (user.role || '').toLowerCase();
    if (!['doctor', 'medical_director'].includes(role)) {
      return res.status(403).json({ error: 'Not a doctor account' });
    }

    if (department && user.department && user.department !== department) {
      return res.status(401).json({ error: `Department mismatch. Expected: ${user.department}` });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const doctor = await Doctor.createFromUser(user);
    const tokens = signTokens(user._id);

    doctor.logActivity('login', 'security', { ip: req.ip });
    doctor.security.loginActivity.unshift({
      device: req.headers['user-agent']?.slice(0, 80) || 'Unknown',
      ip: req.ip,
      location: 'India',
    });
    if (doctor.security.loginActivity.length > 20) {
      doctor.security.loginActivity = doctor.security.loginActivity.slice(0, 20);
    }
    await doctor.save();

    res.json({
      token: tokens.access,
      refreshToken: tokens.refresh,
      user: formatUser(user),
      doctor: doctor.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET());
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid refresh token' });

    const tokens = signTokens(decoded.sub);
    res.json({ token: tokens.access, refreshToken: tokens.refresh });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logoutDoctor = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
