import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/schema';
import { authenticateToken } from './middleware';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file,  cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/', 'video/', 'application/pdf', 'application/'];
    cb(null, allowed.some(t => file.mimetype.startsWith(t)));
  },
});

router.post('/upload', authenticateToken, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    const fileUrl  = `/uploads/${req.file.filename}`;
    let   fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) fileType = 'image';
    else if (req.file.mimetype.startsWith('video/')) fileType = 'video';
    return res.json({ url: fileUrl, type: fileType, filename: req.file.originalname, size: req.file.size });
  } catch (err) {
    console.error('[Media] Upload error:', err);
    return res.status(500).json({ error: 'Upload fehlgeschlagen' });
  }
});

router.post('/avatar', authenticateToken, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Kein Bild hochgeladen' });
    const userId    = (req as any).userId;
    const avatarUrl = `/uploads/${req.file.filename}`;
    await db.run('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);
    return res.json({ avatarUrl });
  } catch (err) {
    console.error('[Media] Avatar error:', err);
    return res.status(500).json({ error: 'Avatar-Upload fehlgeschlagen' });
  }
});

export { router as mediaRouter };
