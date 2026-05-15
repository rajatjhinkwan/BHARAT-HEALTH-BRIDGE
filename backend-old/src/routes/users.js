import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({ storage })

const router = Router()

router.post('/register', async (req, res) => {
  const schema = z.object({ 
    name: z.string().min(2), 
    email: z.string().email().optional(), 
    phone: z.string().optional(), 
    password: z.string().min(6).optional(), 
    googleId: z.string().optional(),
    role: z.string().optional().default('patient'),
    employeeId: z.string().optional()
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

  const { name, email, phone, password, googleId } = parsed.data

  // Check if user already exists by email or phone
  let exists = null
  if (email) exists = await User.findOne({ email })
  if (!exists && phone) exists = await User.findOne({ phone })
  if (!exists && googleId) exists = await User.findOne({ googleId })

  if (exists) return res.status(409).json({ error: 'User already exists' })

  const userData = { name, email, phone, googleId }
  if (password) userData.password = await bcrypt.hash(password, 10)

  const user = await User.create(userData)
  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'dev', { expiresIn: '30d' })

  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, employeeId: user.employeeId } })
})

router.post('/login', async (req, res) => {
  const { email, employeeId, password, department } = req.body
  let user = null

  if (email) {
    user = await User.findOne({ email })
  } else if (employeeId) {
    user = await User.findOne({ employeeId })
  }

  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  // Unified Role check (making it case-insensitive for legacy data if needed)
  const userRole = user.role.toUpperCase();

  // Department Validation for Doctors and other clinical staff
  if (['DOCTOR', 'NURSE'].includes(userRole)) {
    if (department && user.department !== department) {
      return res.status(401).json({ 
        error: `Access Denied: You belong to ${user.department}, but you are trying to access ${department}.` 
      })
    }
  }

  if (password) {
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'dev', { expiresIn: '30d' })
  
  res.json({ 
    token, 
    user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        role: userRole, 
        employeeId: user.employeeId, 
        department: user.department, 
        avatar: user.avatar,
        specialization: user.specialization
    } 
  })
})


router.patch('/profile', upload.single('avatarFile'), async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    const { name, avatar, dob, gender, specialization } = req.body
    
    let avatarUrl = avatar
    if (req.file) {
      avatarUrl = `http://localhost:4000/uploads/${req.file.filename}`
    }

    const user = await User.findByIdAndUpdate(
      decoded.sub,
      { $set: { name, avatar: avatarUrl, dob, gender, specialization } },
      { new: true }
    )

    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      role: user.role, 
      department: user.department, 
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      specialization: user.specialization
    })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

router.get('/seed-staff', async (req, res) => {
    const users = [
        { name: 'Super Admin', employeeId: 'SAD-123', password: 'password123', role: 'super_admin', avatar: '/images/doctors/Screenshot 2026-05-13 194032.png' },
        { name: 'System Admin', employeeId: 'ADM-FAC-123', password: 'password123', role: 'hospital_admin', avatar: '/images/doctors/Screenshot 2026-05-13 194032.png' },
        { name: 'Main Reception', employeeId: 'REC-MAIN-123', password: 'password123', role: 'receptionist', avatar: '/images/doctors/Screenshot 2026-05-13 194012.png', dob: '1995-01-25', gender: 'Female' },
        { name: 'Emergency Nurse', employeeId: 'NUR-GEN-123', password: 'password123', role: 'nurse', department: 'Emergency', avatar: '/images/doctors/Screenshot 2026-05-13 194025.png', dob: '1992-07-12', gender: 'Female' },
        { name: 'Dr. Lenna (Nephro)', employeeId: 'DOC-NEPH-123', password: 'password123', role: 'doctor', department: 'Nephrology', avatar: '/images/doctors/Screenshot 2026-05-13 193934.png', dob: '1985-06-15', gender: 'Female', specialization: 'Nephrology Specialist' },
        { name: 'Dr. Aryan (Neuro)', employeeId: 'DOC-NEUR-123', password: 'password123', role: 'doctor', department: 'Neurology', avatar: '/images/doctors/Screenshot 2026-05-13 193937.png', dob: '1982-11-22', gender: 'Male', specialization: 'Senior Neurologist' },
        { name: 'Dr. Sara (ENT)', employeeId: 'DOC-ENT-123', password: 'password123', role: 'doctor', department: 'ENT', avatar: '/images/doctors/Screenshot 2026-05-13 193941.png', dob: '1990-03-10', gender: 'Female', specialization: 'ENT Consultant' },
        { name: 'Dr. Vikram (Dermat)', employeeId: 'DOC-DERM-123', password: 'password123', role: 'doctor', department: 'Dermatology', avatar: '/images/doctors/Screenshot 2026-05-13 193945.png', dob: '1988-12-05', gender: 'Male', specialization: 'Clinical Dermatologist' },
        { name: 'Dr. Meera (Gastro)', employeeId: 'DOC-GAST-123', password: 'password123', role: 'doctor', department: 'Gastroenterology', avatar: '/images/doctors/Screenshot 2026-05-13 193948.png', dob: '1984-09-30', gender: 'Female', specialization: 'Gastroenterology Head' },
        { name: 'Dr. Raj (Radio)', employeeId: 'DOC-RADI-123', password: 'password123', role: 'doctor', department: 'Radiology (X-Ray)', avatar: '/images/doctors/Screenshot 2026-05-13 193952.png', dob: '1979-05-20', gender: 'Male', specialization: 'Diagnostic Radiologist' },
        { name: 'Head Nurse', employeeId: 'NUR-123', password: 'password123', role: 'nurse', department: 'General Medicine', avatar: '/images/doctors/Screenshot 2026-05-13 194025.png', dob: '1992-07-12', gender: 'Female' },
        { name: 'Front Desk', employeeId: 'REC-123', password: 'password123', role: 'receptionist', avatar: '/images/doctors/Screenshot 2026-05-13 194012.png', dob: '1995-01-25', gender: 'Female' },
    ];

  for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      await User.findOneAndUpdate(
          { employeeId: u.employeeId },
          { ...u, password: hashed },
          { upsert: true, new: true }
      );
  }
  res.json({ ok: true, message: 'Departmental Staff Seeded' });
})

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    const user = await User.findById(decoded.sub)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      role: user.role, 
      department: user.department, 
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      specialization: user.specialization
    })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
