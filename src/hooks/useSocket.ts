import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

const SERVER_URL = 'http://localhost:3001';

let socketInstance: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, user } = useAuthStore();
  const {
    addMessage,
    updateMessageStatus,
    updateMessageStatusBatch,
    setTyping,
    updateContactOnlineStatus,
    deleteMessage,
    addReaction,
    removeReaction,
    activeChat,
    incrementUnread,
  } = useChatStore();

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = io(SERVER_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    socketInstance = socket;
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      reconnectAttempts.current = 0;
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      reconnectAttempts.current++;
    });

    socket.on('new_message', (message) => {
      addMessage(message);

      if (activeChat?.id !== message.chatId && message.senderId !== user?.id) {
        incrementUnread(message.chatId);

        if (window.electronAPI) {
          window.electronAPI.showNotification({
            title: message.senderName,
            body: message.type === 'text' ? message.content : `📎 ${message.type}`,
          });
        }
      }

      if (message.senderId !== user?.id) {
        socket.emit('mark_read', {
          messageIds: [message.id],
          chatId: message.chatId,
          from: message.senderId,
        });
      }
    });

    socket.on('message_status', (data: { messageId?: string; messageIds?: string[]; status: any }) => {
      if (data.messageIds) {
        updateMessageStatusBatch(data.messageIds, data.status);
      } else if (data.messageId) {
        updateMessageStatus(data.messageId, data.status);
      }
    });

    socket.on('user_typing', (data: { userId: string; chatId: string; typing: boolean }) => {
      setTyping(data.chatId, data.typing);
    });

    socket.on('user_online', (data: { userId: string; lastSeen: number; online: boolean }) => {
      updateContactOnlineStatus(data.userId, data.online, data.lastSeen);
    });

    socket.on('online_users', (userIds: string[]) => {
      userIds.forEach(id => updateContactOnlineStatus(id, true, Date.now()));
    });

    socket.on('message_deleted', (data: { messageId: string; deleteFor: 'me' | 'all' }) => {
      if (activeChat) {
        deleteMessage(data.messageId, activeChat.id, data.deleteFor, user?.id || '');
      }
    });

    socket.on('reaction_added', (data: { messageId: string; emoji: string; userId: string }) => {
      addReaction(data.messageId, data.emoji, data.userId);
    });

    socket.on('reaction_removed', (data: { messageId: string; userId: string }) => {
      removeReaction(data.messageId, data.userId);
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
      socketRef.current = null;
    };
  }, [accessToken, user?.id]);

  const sendMessage = useCallback((data: {
    to: string;
    content: string;
    type?: string;
    mediaUrl?: string;
    replyTo?: string;
  }) => {
    socketRef.current?.emit('send_message', data);
  }, []);

  const sendTypingStart = useCallback((to: string) => {
    socketRef.current?.emit('typing_start', { to });
  }, []);

  const sendTypingStop = useCallback((to: string) => {
    socketRef.current?.emit('typing_stop', { to });
  }, []);

  const markRead = useCallback((messageIds: string[], chatId: string, from: string) => {
    socketRef.current?.emit('mark_read', { messageIds, chatId, from });
  }, []);

  const deleteMsg = useCallback((messageId: string, deleteFor: 'me' | 'all', chatId: string, to: string) => {
    socketRef.current?.emit('delete_message', { messageId, deleteFor, chatId, to });
  }, []);

  const addReactionSocket = useCallback((messageId: string, emoji: string, to: string) => {
    socketRef.current?.emit('add_reaction', { messageId, emoji, to });
  }, []);

  const removeReactionSocket = useCallback((messageId: string, to: string) => {
    socketRef.current?.emit('remove_reaction', { messageId, to });
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markRead,
    deleteMessage: deleteMsg,
    addReaction: addReactionSocket,
    removeReaction: removeReactionSocket,
    isConnected: socketRef.current?.connected ?? false,
  };
}

export function getSocket(): Socket | null {
  return socketInstance;
}
