import { Router, Request, Response } from 'express';
import { db } from '../db/schema';
import { authenticateToken } from './middleware';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const contacts = await db.all(
      'SELECT id, username, display_name, avatar_url, last_seen FROM users WHERE id != $1 ORDER BY display_name ASC',
      [currentUserId]
    );
    return res.json(contacts.map(c => ({
      id: c.id,
      username: c.username,
      displayName: c.display_name,
      avatarUrl: c.avatar_url,
      lastSeen: c.last_seen,
    })));
  } catch (err) {
    console.error('[Contacts] Error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await db.get(
      'SELECT id, username, display_name, avatar_url, last_seen FROM users WHERE id = $1',
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    return res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      lastSeen: user.last_seen,
    });
  } catch (err) {
    console.error('[Contacts] Me error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { displayName } = req.body;
    if (displayName) {
      await db.run('UPDATE users SET display_name = $1 WHERE id = $2', [displayName, userId]);
    }
    const user = await db.get(
      'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
      [userId]
    );
    return res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    });
  } catch (err) {
    console.error('[Contacts] Update error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

export { router as contactsRouter };
