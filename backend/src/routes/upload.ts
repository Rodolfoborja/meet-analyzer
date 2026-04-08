import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req: AuthRequest, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', req.userId || 'anonymous');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a',
      'audio/x-m4a', 'audio/mp4', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

// POST /api/upload
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Return URL that can be accessed
    const url = `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/${req.userId}/${req.file.filename}`;

    res.json({
      url,
      filename: req.file.filename,
      size: req.file.size,
      type: req.file.mimetype,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

export { router as uploadRoutes };
