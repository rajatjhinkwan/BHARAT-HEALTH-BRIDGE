import * as yup from 'yup';

export const personalSchema = yup.object({
  fullName: yup.string().min(2, 'Name must be at least 2 characters').required('Full name is required'),
  gender: yup.string(),
  age: yup.number().min(22).max(90).nullable(),
  dateOfBirth: yup.string(),
  bloodGroup: yup.string(),
  bio: yup.string().max(500, 'Bio max 500 characters'),
  languages: yup.array().of(yup.string()),
});

export const professionalSchema = yup.object({
  medicalRegistrationNumber: yup.string(),
  specialization: yup.string().required('Specialization is required'),
  experienceYears: yup.number().min(0).max(60),
  consultationFees: yup.number().min(0),
  hospitalName: yup.string(),
});

export const contactSchema = yup.object({
  mobile: yup.string().matches(/^[+]?[\d\s-]{10,15}$/, 'Invalid mobile number'),
  email: yup.string().email('Invalid email'),
  pincode: yup.string().matches(/^\d{6}$/, 'Pincode must be 6 digits').nullable(),
});

export const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password required'),
  newPassword: yup
    .string()
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Include uppercase letter')
    .matches(/[0-9]/, 'Include a number')
    .required('New password required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password'),
});

export const getPasswordStrength = (password = '') => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[Math.min(score, 3)] || 'Weak', percent: (score / 4) * 100 };
};
