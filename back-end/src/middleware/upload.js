import multer from 'multer';
import { validateFile } from '../services/uploadService.js';

const memoryStorage = multer.memoryStorage();

const createUploader = (options = {}) =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: options.maxSize || 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = options.imagesOnly
        ? ['image/jpeg', 'image/png', 'image/webp']
        : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });

export const uploadImage = createUploader({ imagesOnly: true, maxSize: 5 * 1024 * 1024 });
export const uploadDocument = createUploader({ imagesOnly: false, maxSize: 10 * 1024 * 1024 });

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};
