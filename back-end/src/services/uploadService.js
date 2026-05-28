import fs from 'fs';
import path from 'path';
import cloudinary, { isCloudinaryEnabled } from '../config/cloudinary.js';

const UPLOAD_DIR = 'uploads';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function uploadToCloud(buffer, options = {}) {
  const { folder = 'bhb/doctors', resourceType = 'auto', mimetype } = options;

  if (isCloudinaryEnabled) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: resourceType === 'pdf' ? 'raw' : 'image',
      };

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          mimeType: mimetype,
          size: result.bytes,
        });
      });

      stream.end(buffer);
    });
  }

  const ext = mimetype?.includes('pdf') ? '.pdf' : '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  const port = process.env.PORT || 4000;
  return {
    url: `http://localhost:${port}/uploads/${filename}`,
    publicId: filename,
    mimeType: mimetype,
    size: buffer.length,
  };
}

export async function deleteFromCloud(publicId) {
  if (!publicId || !isCloudinaryEnabled) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn('Cloudinary delete failed:', e.message);
  }
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DOC_SIZE = 10 * 1024 * 1024;

export function validateFile(file, { imagesOnly = false } = {}) {
  const allowed = imagesOnly ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
  const maxSize = imagesOnly ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

  if (!allowed.includes(file.mimetype)) {
    throw new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`);
  }
  if (file.size > maxSize) {
    throw new Error(`File too large. Max ${imagesOnly ? '5MB' : '10MB'}`);
  }
}
