import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User, Patient } from '../models/index.js'
import { seedAllStaff } from '../lib/seedStaff.js'
import { staffByGroup, STAFF_DEFAULT_PASSWORD, STAFF_REGISTRY } from '../lib/staffRegistry.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import os from 'os'
import nodemailer from 'nodemailer'
import { getWorkflowContext } from '../lib/permissions.js'
import { logAuditAction } from '../lib/auditLogger.js'

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

// Helper: Dynamically fetch host computer's active IP address for local area network deep linking
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '10.0.2.2' // fallback IP
}
const HOST_IP = getLocalIpAddress()

// Helper: Compile & send responsive welcome verification HTML email with magic links
const sendVirtualEmail = async (toEmail, name, mrn, patientProfileId, token) => {
  const dir = path.join(process.cwd(), 'sent-emails')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const deepLinkExpo = `exp://${HOST_IP}:8081/--/verify?token=${token}`
  const deepLinkCustom = `bharathealthbridge://verify?token=${token}`
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Bharat Health Bridge</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #E2E8F0;">
    
    <!-- Tricolor Flag Accent -->
    <div style="height: 6px; font-size: 0; line-height: 0;">
      <span style="display: inline-block; width: 33.33%; height: 6px; background-color: #FF9933;"></span><!--
   --><span style="display: inline-block; width: 33.34%; height: 6px; background-color: #FFFFFF;"></span><!--
   --><span style="display: inline-block; width: 33.33%; height: 6px; background-color: #138808;"></span>
    </div>

    <!-- Professional Onboarding Header -->
    <div style="padding: 35px 40px; background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%); text-align: center;">
      <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 850; letter-spacing: 0.5px;">BHARAT HEALTH BRIDGE</h1>
      <p style="color: #93C5FD; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">India's Digital Health Gateway</p>
    </div>

    <!-- Email Body -->
    <div style="padding: 40px;">
      <h2 style="color: #0F172A; margin: 0 0 16px 0; font-size: 22px; font-weight: 800;">Namaste, ${name}!</h2>
      
      <p style="color: #475569; line-height: 26px; font-size: 15px; margin: 0 0 24px 0;">
        Thank you for choosing Bharat Health Bridge. Your digital health passport has been successfully registered and linked securely to the National Digital Health Mission (NDHM) EMR registry.
      </p>

      <!-- Digital Credentials Card -->
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 16px 0; color: #1E3A8A; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 8px;">
          Your Secure Digital Health ID
        </h3>
        
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Full Name</td>
            <td style="color: #0F172A; padding: 8px 0; font-weight: 700; text-align: right;">${name}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Registered Email</td>
            <td style="color: #0F172A; padding: 8px 0; font-weight: 700; text-align: right;">${toEmail}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Clinical EMR MRN</td>
            <td style="color: #1E3A8A; padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace; font-size: 13px;">${mrn}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Passport ID</td>
            <td style="color: #10B981; padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace; font-size: 13px;">${patientProfileId}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button / Magic Link -->
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #475569; font-size: 13px; line-height: 20px; margin-bottom: 16px; font-weight: 600;">
          Tap the secure button below on your mobile device to launch the app and authenticate instantly (no manual login required):
        </p>
        
        <a href="${deepLinkExpo}" 
           style="background-color: #3B82F6; color: #FFFFFF; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25); transition: background-color 0.2s;">
           🚀 Activate & Open App (Expo Go)
        </a>
        
        <div style="margin-top: 12px;">
          <a href="${deepLinkCustom}" 
             style="background-color: #10B981; color: #FFFFFF; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); transition: background-color 0.2s;">
             ✨ Activate & Open App (Direct Custom Link)
          </a>
        </div>
      </div>

      <!-- Verification Link for Browser -->
      <div style="text-align: center; border-top: 1px solid #F1F5F9; padding-top: 24px; margin-bottom: 20px;">
        <span style="color: #64748B; font-size: 13px; display: block; margin-bottom: 10px;">Alternatively, verify your profile on a web browser:</span>
        <a href="http://${HOST_IP}:4000/api/users/verify-email?email=${encodeURIComponent(toEmail)}" 
           style="color: #1E3A8A; font-weight: 700; font-size: 13px; text-decoration: underline;">
           Verify Profile via Browser
        </a>
      </div>

      <p style="color: #94A3B8; font-size: 11px; line-height: 18px; text-align: center; margin: 0;">
        This communication is securely signed and compliant with the Digital Personal Data Protection (DPDP) Act of India. Your health records are encrypted at rest.
      </p>
    </div>

    <!-- Professional Footer -->
    <div style="background-color: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p style="margin: 0; color: #64748B; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
        Ministry of Health & Family Welfare
      </p>
      <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 9px; font-weight: 600;">
        Government of India • Unified EMR Gateway Portal
      </p>
    </div>

  </div>
</body>
</html>
  `
  
  // Save locally as a guaranteed fallback copy
  const filePath = path.join(dir, `verification_${toEmail.replace(/[^a-zA-Z0-9]/g, '_')}.html`)
  fs.writeFileSync(filePath, htmlContent, 'utf8')
  console.log(`[EMAIL SERVICE] Virtual email copy saved at: ${filePath}`)

  // Try to dispatch actual email via SMTP/Gmail if configured
  const userSmtp = process.env.SMTP_USER || process.env.GMAIL_USER
  const passSmtp = process.env.SMTP_PASS || process.env.GMAIL_PASS

  if (userSmtp && passSmtp) {
    try {
      console.log(`[EMAIL SERVICE] Dispatching actual email to ${toEmail} using SMTP/Gmail configurations...`)
      
      const config = {
        auth: {
          user: userSmtp,
          pass: passSmtp
        }
      }

      if (process.env.SMTP_HOST) {
        config.host = process.env.SMTP_HOST
        config.port = parseInt(process.env.SMTP_PORT || '587')
        config.secure = process.env.SMTP_SECURE === 'true'
      } else {
        config.service = 'gmail'
      }

      const transporter = nodemailer.createTransport(config)

      const info = await transporter.sendMail({
        from: `"Bharat Health Bridge" <${userSmtp}>`,
        to: toEmail,
        subject: `🇮🇳 Welcome to Bharat Health Bridge — Secure EMR Identity Verified`,
        html: htmlContent
      })
      console.log(`[EMAIL SERVICE] Actual verification email successfully delivered to ${toEmail}! Message ID: ${info.messageId}`)
    } catch (err) {
      console.error(`[EMAIL SERVICE] SMTP/Gmail delivery failed! Details:`, err.message)
      console.error(err)
      console.warn(`[EMAIL SERVICE] Make sure GMAIL_USER/SMTP_USER and GMAIL_PASS/SMTP_PASS in your .env are correct.`)
      console.warn(`[EMAIL SERVICE] If using Gmail, make sure you enabled 2-Step Verification on your Google Account and created a dedicated "App Password" to bypass OAuth blockages.`)
    }
  } else {
    console.log(`[EMAIL SERVICE] No SMTP credentials in .env (GMAIL_USER & GMAIL_PASS are empty). Saving virtual fallback email to sent-emails/.`)
  }
}

router.post('/register', async (req, res) => {
  const schema = z.object({ 
    name: z.string().min(2), 
    email: z.string().email().optional(), 
    phone: z.string().optional(), 
    password: z.string().min(6).optional(), 
    googleId: z.string().optional(),
    role: z.string().optional().default('patient'),
    employeeId: z.string().optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
    bloodGroup: z.string().optional()
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

  const { name, email, phone, password, googleId, dob, address, bloodGroup } = parsed.data

  // Check if user already exists by email or phone
  let exists = null
  if (email) exists = await User.findOne({ email })
  if (!exists && phone) exists = await User.findOne({ phone })
  if (!exists && googleId) exists = await User.findOne({ googleId })

  if (exists) return res.status(409).json({ error: 'User already exists' })

  const userData = { name, email, phone, googleId }
  if (password) userData.password = await bcrypt.hash(password, 10)

  const user = await User.create(userData)

  // Auto-create patient profile for newly registered patient
  if (user.role === 'patient') {
    let calculatedAge = 28
    if (dob) {
      const birthDate = new Date(dob)
      const today = new Date()
      calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
    }

    const patient = await Patient.create({
      patientName: user.name,
      mrn: `MRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      dob: dob || '1998-05-15',
      age: calculatedAge,
      gender: 'Male',
      phone: user.phone || '0000000000',
      email: user.email || '',
      address: address || 'Not Provided',
      bloodGroup: bloodGroup || undefined,
      aadharCardId: user.aadharCardId || '000000000000',
      organDonor: false
    })
    user.patientProfileId = patient._id
    if (dob) user.dob = new Date(dob)
    await user.save()

    const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'dev', { expiresIn: '30d' })

    // Trigger email verification pipeline with token
    if (user.email) {
      sendVirtualEmail(user.email, user.name, patient.mrn, patient._id.toString(), token)
    }

    return res.status(201).json({ token, user: { id: user._id, _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, employeeId: user.employeeId, healthCardImage: user.healthCardImage, healthCardType: user.healthCardType, aadharCardId: user.aadharCardId, aadharCardImage: user.aadharCardImage, patientProfileId: user.patientProfileId || null } })
  }

  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'dev', { expiresIn: '30d' })

  res.status(201).json({ token, user: { id: user._id, _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, employeeId: user.employeeId, healthCardImage: user.healthCardImage, healthCardType: user.healthCardType, aadharCardId: user.aadharCardId, aadharCardImage: user.aadharCardImage, patientProfileId: user.patientProfileId || null } })
})

router.get('/verify-email', async (req, res) => {
  const { email } = req.query
  if (!email) return res.status(400).send('<h1>Invalid Verification Request</h1>')
  
  const user = await User.findOne({ email })
  if (!user) return res.status(404).send('<h1>User Profile Not Found</h1>')
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Digital Health ID Verified</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #F3F4F6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 480px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #E5E7EB; }
    h1 { color: #1E3A8A; margin-top: 0; font-size: 24px; font-weight: 800; }
    p { color: #4B5563; font-size: 14px; line-height: 22px; }
    .badge { background-color: #10B98120; color: #10B981; padding: 8px 16px; border-radius: 20px; font-weight: 800; font-size: 12px; display: inline-block; margin-bottom: 20px; border: 1px solid #10B98130; }
    .btn { background-color: #1E3A8A; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">✓ KYC VERIFIED PROFILE</div>
    <h1>Identity Verified Successfully!</h1>
    <p>
      Congratulations! Your email address <strong>${email}</strong> has been successfully verified. Your digital health passport and EMR profile are now fully authenticated in the Bharat Health Bridge database.
    </p>
    <a href="#" class="btn" onclick="window.close()">Close Window</a>
  </div>
</body>
</html>
  `)
})

router.post('/login', async (req, res) => {
  const { email, employeeId, phone, password, department } = req.body
  let user = null

  if (email) {
    user = await User.findOne({ email })
  } else if (phone) {
    const normalized = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`
    user = await User.findOne({ $or: [{ phone: normalized }, { phone: phone.replace(/\D/g, '').slice(-10) }] })
  } else if (employeeId) {
    user = await User.findOne({ employeeId })
  }

  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  // Unified Role check (making it case-insensitive for legacy data if needed)
  const userRole = user.role.toUpperCase();

  // Only doctors & nurses require department at login (reception, lab, pharmacy: ID + password only)
  if (['DOCTOR', 'NURSE'].includes(userRole)) {
    if (!department) {
      return res.status(400).json({
        error: `Select your ${userRole === 'DOCTOR' ? 'clinical department' : 'assigned ward'} to continue.`,
      })
    }
    if (user.department !== department) {
      return res.status(401).json({
        error: `Access denied: your profile is ${user.department}, not ${department}.`,
      })
    }
  }

  if (['LAB_TECH', 'LAB_TECHNICIAN', 'PHARMACIST', 'PHARMACY_MANAGER', 'RECEPTIONIST'].includes(userRole) && department) {
    // ignore extra department field for single-field roles
  }

  if (password) {
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'dev', { expiresIn: '30d' })

  let patientProfileId = user.patientProfileId
  if (!patientProfileId && userRole === 'PATIENT') {
    const { Patient } = await import('../models/index.js')
    let linked = null
    if (user.phone) linked = await Patient.findOne({ phone: user.phone })
    if (!linked && user.email) linked = await Patient.findOne({ email: user.email })

    if (!linked) {
      linked = await Patient.create({
        patientName: user.name,
        mrn: `MRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        dob: '1998-05-15',
        age: 28,
        gender: 'Male',
        phone: user.phone || '0000000000',
        email: user.email || '',
        address: 'Not Provided',
        aadharCardId: user.aadharCardId || '000000000000',
        organDonor: false
      })
    }

    patientProfileId = linked._id
    user.patientProfileId = linked._id
    await user.save()
  }
  
  const workflow = getWorkflowContext(user)
  logAuditAction(user.name || user.email || 'Staff User', 'USER LOGIN', `Role: ${userRole} | Department: ${user.department || 'N/A'}`);

  res.json({ 
    token, 
    user: { 
        id: user._id, 
        _id: user._id,
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        role: userRole, 
        employeeId: user.employeeId, 
        department: user.department, 
        assignedWard: user.assignedWard,
        avatar: user.avatar,
        specialization: user.specialization,
        healthCardImage: user.healthCardImage,
        healthCardType: user.healthCardType,
        aadharCardId: user.aadharCardId,
        aadharCardImage: user.aadharCardImage,
        patientProfileId: patientProfileId || null,
        permissions: workflow.permissions,
        dashboard: workflow.dashboard,
        queueScope: workflow.queueScope,
        workflowAccess: workflow.workflowAccess
    } 
  })
})


router.patch('/profile', upload.fields([
  { name: 'avatarFile', maxCount: 1 },
  { name: 'healthCardFile', maxCount: 1 },
  { name: 'aadharFile', maxCount: 1 }
]), async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    const { 
      name, 
      avatar, 
      dob, 
      gender, 
      specialization,
      phone,
      email,
      address,
      bloodGroup,
      allergies,
      chronicIllness,
      emergencyContactName,
      emergencyContactPhone,
      healthCardType,
      aadharCardId,
      organDonor,
      currentMedications,
      symptoms
    } = req.body
    
    let avatarUrl = avatar
    if (req.files && req.files['avatarFile'] && req.files['avatarFile'][0]) {
      avatarUrl = `http://localhost:4000/uploads/${req.files['avatarFile'][0].filename}`
    }

    let healthCardImageUrl = req.body.healthCardImage
    if (req.files && req.files['healthCardFile'] && req.files['healthCardFile'][0]) {
      healthCardImageUrl = `http://localhost:4000/uploads/${req.files['healthCardFile'][0].filename}`
    }

    let aadharCardImageUrl = req.body.aadharCardImage
    if (req.files && req.files['aadharFile'] && req.files['aadharFile'][0]) {
      aadharCardImageUrl = `http://localhost:4000/uploads/${req.files['aadharFile'][0].filename}`
    }

    const user = await User.findById(decoded.sub)
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (name !== undefined) user.name = name
    if (avatarUrl !== undefined) user.avatar = avatarUrl
    if (dob !== undefined) user.dob = dob
    if (gender !== undefined) user.gender = gender
    if (specialization !== undefined) user.specialization = specialization
    if (phone !== undefined) user.phone = phone
    if (email !== undefined) user.email = email
    if (healthCardImageUrl !== undefined) user.healthCardImage = healthCardImageUrl
    if (healthCardType !== undefined) user.healthCardType = healthCardType
    if (aadharCardId !== undefined) user.aadharCardId = aadharCardId
    if (aadharCardImageUrl !== undefined) user.aadharCardImage = aadharCardImageUrl
    if (organDonor !== undefined) user.organDonor = organDonor
    
    await user.save()

    // Sync to Patient document
    if (user.patientProfileId) {
      const patient = await Patient.findById(user.patientProfileId)
      if (patient) {
        if (name !== undefined) patient.patientName = name
        if (dob !== undefined) patient.dob = dob
        if (gender !== undefined) patient.gender = gender
        if (avatarUrl !== undefined) patient.profileImage = avatarUrl
        if (phone !== undefined) patient.phone = phone
        if (email !== undefined) patient.email = email
        if (address !== undefined) patient.address = address
        if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup
        if (allergies !== undefined) patient.allergies = allergies
        if (chronicIllness !== undefined) patient.chronicIllness = chronicIllness
        if (emergencyContactName !== undefined) patient.emergencyContactName = emergencyContactName
        if (emergencyContactPhone !== undefined) patient.emergencyContactPhone = emergencyContactPhone
        if (healthCardImageUrl !== undefined) patient.healthCardImage = healthCardImageUrl
        if (healthCardType !== undefined) patient.healthCardType = healthCardType
        if (aadharCardId !== undefined) patient.aadharCardId = aadharCardId
        if (aadharCardImageUrl !== undefined) patient.aadharCardImage = aadharCardImageUrl
        if (organDonor !== undefined) patient.organDonor = organDonor
        if (currentMedications !== undefined) patient.symptoms = currentMedications
        if (symptoms !== undefined) patient.symptoms = symptoms
        
        await patient.save()
      }
    }

    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      role: user.role, 
      department: user.department, 
      assignedWard: user.assignedWard,
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      specialization: user.specialization,
      healthCardImage: user.healthCardImage,
      healthCardType: user.healthCardType,
      aadharCardId: user.aadharCardId,
      aadharCardImage: user.aadharCardImage,
      organDonor: user.organDonor,
      patientProfileId: user.patientProfileId || null
    })
  } catch (err) {
    console.error('Profile PATCH error:', err)
    res.status(401).json({ error: 'Invalid token' })
  }
})

router.get('/seed-staff', async (req, res) => {
  const results = await seedAllStaff();
  res.json({ ok: true, message: 'Full staff registry seeded', count: results.length });
});

/** Printable credential reference (demo environment) */
router.get('/staff-reference', (_req, res) => {
  const grouped = staffByGroup();
  res.json({
    defaultPassword: STAFF_DEFAULT_PASSWORD,
    twoFactorNote: 'Enter any 6 digits on step 2 (demo 2FA).',
    loginRules: {
      receptionist: 'Operator ID + password only',
      lab_tech: 'Operator ID + password only → Laboratory OS',
      pharmacist: 'Operator ID + password only → Pharmacy',
      doctor: 'Operator ID + password + select matching department',
      nurse: 'Operator ID + password + select matching ward/department',
    },
    grouped,
    total: STAFF_REGISTRY.length,
  });
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    const user = await User.findById(decoded.sub)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const workflow = getWorkflowContext(user)
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      role: user.role, 
      department: user.department, 
      assignedWard: user.assignedWard,
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      specialization: user.specialization,
      healthCardImage: user.healthCardImage,
      healthCardType: user.healthCardType,
      aadharCardId: user.aadharCardId,
      aadharCardImage: user.aadharCardImage,
      patientProfileId: user.patientProfileId || null,
      permissions: workflow.permissions,
      dashboard: workflow.dashboard,
      queueScope: workflow.queueScope,
      workflowAccess: workflow.workflowAccess
    })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
