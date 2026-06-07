import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/schema';

const router = Router();

const JWT_SECRET     = process.env.JWT_SECRET     || 'letschat-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'letschat-refresh-secret-change-in-production';

function generateTokens(userId: string) {
  const accessToken  = jwt.sign({ userId }, JWT_SECRET,     { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName)
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    if (username.length < 3 || username.length > 30)
      return res.status(400).json({ error: 'Benutzername muss 3-30 Zeichen lang sein' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });

    const existing = await db.get(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );
    if (existing) return res.status(409).json({ error: 'Benutzername bereits vergeben' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const { accessToken, refreshToken } = generateTokens(userId);
    const now = Date.now();

    await db.run(
      'INSERT INTO users (id, username, display_name, password_hash, refresh_token, last_seen, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, username.toLowerCase(), displayName, passwordHash, refreshToken, now, now]
    );

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: userId, username: username.toLowerCase(), displayName, avatarUrl: null },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });

    const user = await db.get('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    if (!user) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await db.run(
      'UPDATE users SET refresh_token = $1, last_seen = $2 WHERE id = $3',
      [refreshToken, Date.now(), user.id]
    );

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, displayName: user.display_name, avatarUrl: user.avatar_url },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Kein Refresh-Token' });

    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };
    const user = await db.get(
      'SELECT * FROM users WHERE id = $1 AND refresh_token = $2',
      [payload.userId, refreshToken]
    );
    if (!user) return res.status(401).json({ error: 'Ungültiger Refresh-Token' });

    const tokens = generateTokens(user.id);
    await db.run('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: 'Ungültiger Refresh-Token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };
      await db.run('UPDATE users SET refresh_token = NULL WHERE id = $1', [payload.userId]);
    }
    return res.json({ success: true });
  } catch {
    return res.json({ success: true });
  }
});

export { router as authRouter, JWT_SECRET };
