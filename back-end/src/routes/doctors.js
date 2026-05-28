import { Router } from 'express';
import {
  registerDoctor,
  loginDoctor,
  refreshToken,
  logoutDoctor,
} from '../controllers/doctorAuthController.js';
import {
  getProfile,
  updateProfile,
  updateProfileImage,
  updateAvailability,
  updateSettings,
  updatePassword,
  uploadDocument as uploadDocumentHandler,
  deleteDocument,
  getDocument,
  getActivity,
  updateSecurity,
  verifyMobileOtp,
  sendMobileOtp,
} from '../controllers/doctorController.js';
import { authenticate, requireDoctor, attachDoctorProfile } from '../middleware/auth.js';
import { authLimiter, uploadLimiter, apiLimiter } from '../middleware/rateLimiter.js';
import { uploadImage, uploadDocument, handleMulterError } from '../middleware/upload.js';

const router = Router();

// Auth (public)
router.post('/auth/register', authLimiter, registerDoctor);
router.post('/auth/login', authLimiter, loginDoctor);
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', logoutDoctor);

// Protected profile routes
const protectedChain = [apiLimiter, authenticate, requireDoctor, attachDoctorProfile];

router.get('/profile', ...protectedChain, getProfile);
router.patch('/profile', ...protectedChain, updateProfile);
router.patch('/profile/image', uploadLimiter, ...protectedChain, uploadImage.single('image'), handleMulterError, updateProfileImage);
router.patch('/profile/availability', ...protectedChain, updateAvailability);
router.patch('/profile/settings', ...protectedChain, updateSettings);
router.patch('/profile/password', ...protectedChain, updatePassword);
router.patch('/profile/security', ...protectedChain, updateSecurity);
router.get('/profile/activity', ...protectedChain, getActivity);

// Documents
router.post(
  '/documents',
  uploadLimiter,
  ...protectedChain,
  uploadDocument.single('file'),
  handleMulterError,
  uploadDocumentHandler
);
router.get('/documents/:docId', ...protectedChain, getDocument);
router.delete('/documents/:docId', ...protectedChain, deleteDocument);

// OTP verification (demo)
router.post('/verify/mobile/send', ...protectedChain, sendMobileOtp);
router.post('/verify/mobile', ...protectedChain, verifyMobileOtp);

export default router;
