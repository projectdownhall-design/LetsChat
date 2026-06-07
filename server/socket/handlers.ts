import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/schema';
import { JWT_SECRET } from '../routes/auth';

const onlineUsers = new Map<string, { socketId: string; userId: string }>();

function getChatId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export function setupSocketHandlers(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentifizierung erforderlich'));
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      (socket as any).userId = payload.userId;
      return next();
    } catch {
      return next(new Error('Ungültiger Token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;

    (async () => {
      onlineUsers.set(userId, { socketId: socket.id, userId });
      await db.run('UPDATE users SET last_seen = $1 WHERE id = $2', [Date.now(), userId]);
      socket.broadcast.emit('user_online', { userId, lastSeen: Date.now(), online: true });
      socket.emit('online_users', Array.from(onlineUsers.keys()));
    })();

    socket.on('send_message', async (data: {
      to: string; content: string; type?: string; mediaUrl?: string; replyTo?: string;
    }) => {
      try {
        const { to, content, type = 'text', mediaUrl, replyTo } = data;
        const chatId    = getChatId(userId, to);
        const messageId = uuidv4();
        const now       = Date.now();

        await db.run(
          "INSERT INTO messages (id,chat_id,sender_id,content,type,media_url,status,reply_to,created_at,deleted_for) VALUES ($1,$2,$3,$4,$5,$6,'sent',$7,$8,'[]')",
          [messageId, chatId, userId, content, type, mediaUrl || null, replyTo || null, now]
        );

        const sender = await db.get('SELECT display_name, avatar_url FROM users WHERE id = $1', [userId]);

        const message = {
          id: messageId, chatId, senderId: userId,
          senderName:   sender?.display_name || '',
          senderAvatar: sender?.avatar_url   || null,
          content, type,
          mediaUrl:  mediaUrl  || null,
          status:    'sent',
          replyTo:   replyTo   || null,
          createdAt: now,
          reactions: [], deletedFor: [],
        };

        socket.emit('new_message', message);

        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
          io.to(recipientSocket.socketId).emit('new_message', message);
          await db.run("UPDATE messages SET status = 'delivered' WHERE id = $1", [messageId]);
          socket.emit('message_status', { messageId, status: 'delivered' });
        }
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        socket.emit('error', { message: 'Nachricht konnte nicht gesendet werden' });
      }
    });

    socket.on('typing_start', (data: { to: string }) => {
      const rec = onlineUsers.get(data.to);
      if (rec) io.to(rec.socketId).emit('user_typing', { userId, chatId: getChatId(userId, data.to), typing: true });
    });

    socket.on('typing_stop', (data: { to: string }) => {
      const rec = onlineUsers.get(data.to);
      if (rec) io.to(rec.socketId).emit('user_typing', { userId, chatId: getChatId(userId, data.to), typing: false });
    });

    socket.on('mark_read', async (data: { messageIds: string[]; chatId: string; from: string }) => {
      try {
        const { messageIds, from } = data;
        if (!messageIds?.length) return;
        for (const id of messageIds) {
          await db.run(
            "UPDATE messages SET status = 'read' WHERE id = $1 AND sender_id = $2 AND status != 'read'",
            [id, from]
          );
        }
        const senderSocket = onlineUsers.get(from);
        if (senderSocket) io.to(senderSocket.socketId).emit('message_status', { messageIds, status: 'read' });
      } catch (err) {
        console.error('[Socket] mark_read error:', err);
      }
    });

    socket.on('delete_message', async (data: { messageId: string; deleteFor: 'me' | 'all'; chatId: string; to: string }) => {
      try {
        const { messageId, deleteFor, to } = data;
        const message = await db.get('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (!message) return;

        if (deleteFor === 'all' && message.sender_id === userId) {
          await db.run("UPDATE messages SET content = '', type = 'deleted' WHERE id = $1", [messageId]);
          socket.emit('message_deleted', { messageId, deleteFor: 'all' });
          const rec = onlineUsers.get(to);
          if (rec) io.to(rec.socketId).emit('message_deleted', { messageId, deleteFor: 'all' });
        } else {
          const deletedFor = JSON.parse(message.deleted_for || '[]');
          if (!deletedFor.includes(userId)) deletedFor.push(userId);
          await db.run('UPDATE messages SET deleted_for = $1 WHERE id = $2', [JSON.stringify(deletedFor), messageId]);
          socket.emit('message_deleted', { messageId, deleteFor: 'me' });
        }
      } catch (err) {
        console.error('[Socket] delete_message error:', err);
      }
    });

    socket.on('add_reaction', async (data: { messageId: string; emoji: string; to: string }) => {
      try {
        const { messageId, emoji, to } = data;
        const existing = await db.get('SELECT 1 FROM reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
        if (existing) {
          await db.run('UPDATE reactions SET emoji = $1 WHERE message_id = $2 AND user_id = $3', [emoji, messageId, userId]);
        } else {
          await db.run('INSERT INTO reactions (message_id,user_id,emoji,created_at) VALUES ($1,$2,$3,$4)', [messageId, userId, emoji, Date.now()]);
        }
        const reactionData = { messageId, emoji, userId };
        socket.emit('reaction_added', reactionData);
        const rec = onlineUsers.get(to);
        if (rec) io.to(rec.socketId).emit('reaction_added', reactionData);
      } catch (err) {
        console.error('[Socket] add_reaction error:', err);
      }
    });

    socket.on('remove_reaction', async (data: { messageId: string; to: string }) => {
      try {
        const { messageId, to } = data;
        await db.run('DELETE FROM reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
        const reactionData = { messageId, userId };
        socket.emit('reaction_removed', reactionData);
        const rec = onlineUsers.get(to);
        if (rec) io.to(rec.socketId).emit('reaction_removed', reactionData);
      } catch (err) {
        console.error('[Socket] remove_reaction error:', err);
      }
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      const lastSeen = Date.now();
      await db.run('UPDATE users SET last_seen = $1 WHERE id = $2', [lastSeen, userId]);
      socket.broadcast.emit('user_online', { userId, lastSeen, online: false });
    });
  });
}
