import { Router, Request, Response } from 'express';
import { db } from '../db/schema';
import { authenticateToken } from './middleware';

const router = Router();

router.get('/:chatId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const { chatId } = req.params;
    const page   = parseInt(req.query.page as string) || 1;
    const limit  = 50;
    const offset = (page - 1) * limit;

    const [userId1, userId2] = chatId.split('_');
    if (userId1 !== currentUserId && userId2 !== currentUserId)
      return res.status(403).json({ error: 'Zugriff verweigert' });

    const messages = await db.all(`
      SELECT m.id, m.chat_id, m.sender_id, m.content, m.type, m.media_url,
             m.status, m.reply_to, m.created_at, m.deleted_for,
             u.display_name AS sender_name,
             u.avatar_url   AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [chatId, limit, offset]);

    const messageIds = messages.map((m: any) => m.id);
    const reactions = messageIds.length > 0
      ? await db.all(
          'SELECT message_id, user_id, emoji FROM reactions WHERE message_id = ANY($1)',
          [messageIds]
        )
      : [];

    const reactionsByMsg: Record<string, { emoji: string; userId: string }[]> = {};
    for (const r of reactions) {
      if (!reactionsByMsg[r.message_id]) reactionsByMsg[r.message_id] = [];
      reactionsByMsg[r.message_id].push({ emoji: r.emoji, userId: r.user_id });
    }

    const totalRow = await db.get('SELECT COUNT(*) AS count FROM messages WHERE chat_id = $1', [chatId]);
    const total = parseInt(totalRow?.count || '0', 10);

    return res.json({
      messages: messages.reverse().map((m: any) => ({
        id: m.id,
        chatId: m.chat_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderAvatar: m.sender_avatar,
        content: m.content,
        type: m.type,
        mediaUrl: m.media_url,
        status: m.status,
        replyTo: m.reply_to,
        createdAt: m.created_at,
        deletedFor: JSON.parse(m.deleted_for || '[]'),
        reactions: reactionsByMsg[m.id] || [],
      })).filter((m: any) => !m.deletedFor.includes(currentUserId)),
      hasMore: offset + limit < total,
      total,
    });
  } catch (err) {
    console.error('[Messages] Error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.delete('/:messageId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const { messageId } = req.params;
    const { deleteFor } = req.body;

    const message = await db.get('SELECT * FROM messages WHERE id = $1', [messageId]);
    if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden' });

    if (deleteFor === 'all' && message.sender_id !== currentUserId)
      return res.status(403).json({ error: 'Nur eigene Nachrichten können für alle gelöscht werden' });

    if (deleteFor === 'all') {
      await db.run(
        "UPDATE messages SET content = '', type = 'deleted', deleted_for = '[]' WHERE id = $1",
        [messageId]
      );
    } else {
      const deletedFor = JSON.parse(message.deleted_for || '[]');
      if (!deletedFor.includes(currentUserId)) deletedFor.push(currentUserId);
      await db.run('UPDATE messages SET deleted_for = $1 WHERE id = $2', [JSON.stringify(deletedFor), messageId]);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[Messages] Delete error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

export { router as messagesRouter };
