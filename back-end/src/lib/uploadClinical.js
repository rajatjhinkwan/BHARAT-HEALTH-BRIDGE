import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = 'uploads/clinical';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

export const clinicalUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export function clinicalFileUrl(req, filename) {
  const host = req.get('host') || 'localhost:4000';
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}/uploads/clinical/${filename}`;
}
