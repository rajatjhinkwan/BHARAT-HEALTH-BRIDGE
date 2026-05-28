import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User } from '../models/index.js';
import Doctor from '../models/Doctor.js';
import { uploadToCloud, deleteFromCloud, validateFile } from '../services/uploadService.js';

const mergeSection = (target, source) => {
  if (!source || typeof source !== 'object') return;
  Object.keys(source).forEach((key) => {
    if (source[key] !== undefined && source[key] !== null) {
      target[key] = source[key];
    }
  });
};

export const getProfile = async (req, res) => {
  res.json({ doctor: req.doctor.toPublicJSON(), user: {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    employeeId: req.user.employeeId,
    department: req.user.department,
    avatar: req.user.avatar,
  }});
};

export const updateProfile = async (req, res, next) => {
  try {
    const { personal, professional, contact, settings, draft } = req.body;
    const doctor = req.doctor;

    if (personal) mergeSection(doctor.personal, personal);
    if (professional) mergeSection(doctor.professional, professional);
    if (contact) mergeSection(doctor.contact, contact);
    if (settings) mergeSection(doctor.settings, settings);
    if (draft !== undefined) doctor.draft = draft;

    if (personal?.fullName) {
      req.user.name = personal.fullName;
      await req.user.save();
    }
    if (contact?.email) req.user.email = contact.email;
    if (professional?.specialization) req.user.specialization = professional.specialization;
    if (professional?.department) req.user.department = professional.department;
    await req.user.save();

    doctor.logActivity('update', 'profile', { sections: Object.keys(req.body) });
    await doctor.save();

    res.json({ doctor: doctor.toPublicJSON(), message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

export const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    validateFile(req.file, { imagesOnly: true });

    if (req.doctor.profileImage?.publicId) {
      await deleteFromCloud(req.doctor.profileImage.publicId);
    }

    const result = await uploadToCloud(req.file.buffer, {
      folder: 'bhb/doctors/avatars',
      mimetype: req.file.mimetype,
    });

    req.doctor.profileImage = { url: result.url, publicId: result.publicId };
    req.user.avatar = result.url;
    await Promise.all([req.doctor.save(), req.user.save()]);

    req.doctor.logActivity('upload', 'profile_image');
    await req.doctor.save();

    res.json({
      profileImage: req.doctor.profileImage,
      avatar: result.url,
      message: 'Profile image updated',
    });
  } catch (err) {
    next(err);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!availability) return res.status(400).json({ error: 'Availability data required' });

    mergeSection(req.doctor.availability, availability);
    req.doctor.logActivity('update', 'availability');
    await req.doctor.save();

    const statusMap = { online: 'AVAILABLE', offline: 'OFFLINE', busy: 'IN CONSULTATION', emergency: 'AVAILABLE' };
    if (availability.status) {
      req.user.availabilityStatus = statusMap[availability.status] || 'OFFLINE';
      await req.user.save();
    }

    res.json({ availability: req.doctor.availability, message: 'Availability updated' });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: 'Settings required' });
    mergeSection(req.doctor.settings, settings);
    req.doctor.logActivity('update', 'settings');
    await req.doctor.save();
    res.json({ settings: req.doctor.settings, message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Valid current and new password required' });

    const { currentPassword, newPassword } = parsed.data;
    const ok = await bcrypt.compare(currentPassword, req.user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    req.user.password = await bcrypt.hash(newPassword, 12);
    await req.user.save();
    req.doctor.logActivity('password_change', 'security');
    await req.doctor.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    if (!type) return res.status(400).json({ error: 'Document type required' });

    validateFile(req.file);

    const existing = req.doctor.documents.find((d) => d.type === type);
    if (existing?.publicId) await deleteFromCloud(existing.publicId);

    const result = await uploadToCloud(req.file.buffer, {
      folder: `bhb/doctors/documents/${type}`,
      resourceType: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      mimetype: req.file.mimetype,
    });

    const doc = {
      type,
      name: req.file.originalname,
      url: result.url,
      publicId: result.publicId,
      mimeType: result.mimeType,
      size: result.size,
      uploadedAt: new Date(),
    };

    if (existing) {
      Object.assign(existing, doc);
    } else {
      req.doctor.documents.push(doc);
    }

    req.doctor.logActivity('upload', 'document', { type });
    await req.doctor.save();

    res.json({ document: doc, documents: req.doctor.documents, message: 'Document uploaded' });
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const doc = req.doctor.documents.id(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.publicId) await deleteFromCloud(doc.publicId);
    doc.deleteOne();
    req.doctor.logActivity('delete', 'document', { type: doc.type });
    await req.doctor.save();

    res.json({ documents: req.doctor.documents, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

export const getDocument = async (req, res) => {
  const doc = req.doctor.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ document: doc });
};

export const getActivity = async (req, res) => {
  res.json({ activity: req.doctor.activityLogs.slice(0, 20) });
};

export const updateSecurity = async (req, res, next) => {
  try {
    const { twoFactorEnabled, logoutAllDevices } = req.body;
    if (twoFactorEnabled !== undefined) {
      req.doctor.security.twoFactorEnabled = twoFactorEnabled;
    }
    if (logoutAllDevices) {
      req.doctor.security.sessions = [];
    }
    req.doctor.logActivity('update', 'security');
    await req.doctor.save();
    res.json({ security: req.doctor.security, message: 'Security settings updated' });
  } catch (err) {
    next(err);
  }
};

export const verifyMobileOtp = async (req, res) => {
  const { otp } = req.body;
  if (otp && String(otp).length === 6) {
    req.doctor.contact.mobileVerified = true;
    req.doctor.logActivity('verify', 'contact', { type: 'mobile' });
    req.doctor.save();
    return res.json({ verified: true, message: 'Mobile verified (demo OTP accepted)' });
  }
  res.status(400).json({ error: 'Enter valid 6-digit OTP' });
};

export const sendMobileOtp = async (req, res) => {
  res.json({ message: 'OTP sent to registered mobile (demo: use any 6 digits)', demoOtp: '123456' });
};
