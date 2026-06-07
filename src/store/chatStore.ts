import { create } from 'zustand';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  type: 'text' | 'image' | 'video' | 'document' | 'deleted';
  mediaUrl: string | null;
  status: 'sent' | 'delivered' | 'read';
  replyTo: string | null;
  createdAt: number;
  reactions: { emoji: string; userId: string }[];
  deletedFor?: string[];
}

export interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: number;
  online?: boolean;
}

export interface Chat {
  id: string;
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
  typing: boolean;
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  contacts: Contact[];
  typingUsers: Record<string, boolean>;
  searchQuery: string;

  setContacts: (contacts: Contact[]) => void;
  updateContactOnlineStatus: (userId: string, online: boolean, lastSeen: number) => void;
  setActiveChat: (chat: Chat | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  updateMessageStatus: (messageId: string, status: Message['status'], chatId?: string) => void;
  updateMessageStatusBatch: (messageIds: string[], status: Message['status']) => void;
  deleteMessage: (messageId: string, chatId: string, deleteFor: 'me' | 'all', currentUserId: string) => void;
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, userId: string) => void;
  setTyping: (chatId: string, typing: boolean) => void;
  setUnreadCount: (chatId: string, count: number) => void;
  incrementUnread: (chatId: string) => void;
  clearUnread: (chatId: string) => void;
  setSearchQuery: (query: string) => void;
  getOrCreateChat: (contact: Contact, currentUserId: string) => Chat;
  updateLastMessage: (chatId: string, message: Message) => void;
}

function getChatId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  contacts: [],
  typingUsers: {},
  searchQuery: '',

  setContacts: (contacts) => set({ contacts }),

  updateContactOnlineStatus: (userId, online, lastSeen) => {
    set(state => ({
      contacts: state.contacts.map(c =>
        c.id === userId ? { ...c, online, lastSeen } : c
      ),
      chats: state.chats.map(chat =>
        chat.contact.id === userId
          ? { ...chat, contact: { ...chat.contact, online, lastSeen } }
          : chat
      ),
      activeChat: state.activeChat?.contact.id === userId
        ? { ...state.activeChat, contact: { ...state.activeChat.contact, online, lastSeen } }
        : state.activeChat,
    }));
  },

  setActiveChat: (chat) => set({ activeChat: chat }),

  getOrCreateChat: (contact, currentUserId) => {
    const chatId = getChatId(currentUserId, contact.id);
    const existing = get().chats.find(c => c.id === chatId);
    if (existing) return existing;

    const newChat: Chat = {
      id: chatId,
      contact,
      lastMessage: null,
      unreadCount: 0,
      typing: false,
    };

    set(state => ({ chats: [newChat, ...state.chats] }));
    return newChat;
  },

  addMessage: (message) => {
    set(state => {
      const existing = state.messages[message.chatId] || [];
      const alreadyExists = existing.some(m => m.id === message.id);
      if (alreadyExists) return state;

      const updated = [...existing, message];

      const chats = state.chats.map(chat =>
        chat.id === message.chatId
          ? { ...chat, lastMessage: message }
          : chat
      );

      const chatExists = chats.some(c => c.id === message.chatId);
      if (!chatExists) {
        const contact = state.contacts.find(c => c.id === message.senderId);
        if (contact) {
          chats.unshift({
            id: message.chatId,
            contact,
            lastMessage: message,
            unreadCount: 0,
            typing: false,
          });
        }
      }

      const sortedChats = [...chats].sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || 0;
        const bTime = b.lastMessage?.createdAt || 0;
        return bTime - aTime;
      });

      return {
        messages: { ...state.messages, [message.chatId]: updated },
        chats: sortedChats,
      };
    });
  },

  setMessages: (chatId, messages) =>
    set(state => ({ messages: { ...state.messages, [chatId]: messages } })),

  prependMessages: (chatId, messages) =>
    set(state => ({
      messages: {
        ...state.messages,
        [chatId]: [...messages, ...(state.messages[chatId] || [])],
      },
    })),

  updateLastMessage: (chatId, message) =>
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, lastMessage: message } : c),
    })),

  updateMessageStatus: (messageId, status, chatId) =>
    set(state => {
      const messages = { ...state.messages };
      if (chatId) {
        messages[chatId] = (messages[chatId] || []).map(m =>
          m.id === messageId ? { ...m, status } : m
        );
      } else {
        for (const cId of Object.keys(messages)) {
          messages[cId] = messages[cId].map(m =>
            m.id === messageId ? { ...m, status } : m
          );
        }
      }
      return { messages };
    }),

  updateMessageStatusBatch: (messageIds, status) =>
    set(state => {
      const messages = { ...state.messages };
      const idSet = new Set(messageIds);
      for (const chatId of Object.keys(messages)) {
        messages[chatId] = messages[chatId].map(m =>
          idSet.has(m.id) ? { ...m, status } : m
        );
      }
      return { messages };
    }),

  deleteMessage: (messageId, chatId, deleteFor, currentUserId) =>
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updated = chatMessages.map(m => {
        if (m.id !== messageId) return m;
        if (deleteFor === 'all') return { ...m, content: '', type: 'deleted' as const };
        return { ...m, deletedFor: [...(m.deletedFor || []), currentUserId] };
      }).filter(m => !(m.deletedFor?.includes(currentUserId)));

      return { messages: { ...state.messages, [chatId]: updated } };
    }),

  addReaction: (messageId, emoji, userId) =>
    set(state => {
      const messages = { ...state.messages };
      for (const chatId of Object.keys(messages)) {
        messages[chatId] = messages[chatId].map(m => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions.filter(r => r.userId !== userId);
          return { ...m, reactions: [...reactions, { emoji, userId }] };
        });
      }
      return { messages };
    }),

  removeReaction: (messageId, userId) =>
    set(state => {
      const messages = { ...state.messages };
      for (const chatId of Object.keys(messages)) {
        messages[chatId] = messages[chatId].map(m =>
          m.id === messageId
            ? { ...m, reactions: m.reactions.filter(r => r.userId !== userId) }
            : m
        );
      }
      return { messages };
    }),

  setTyping: (chatId, typing) =>
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, typing } : c),
      typingUsers: { ...state.typingUsers, [chatId]: typing },
      activeChat: state.activeChat?.id === chatId
        ? { ...state.activeChat, typing }
        : state.activeChat,
    })),

  setUnreadCount: (chatId, count) =>
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: count } : c),
    })),

  incrementUnread: (chatId) =>
    set(state => ({
      chats: state.chats.map(c =>
        c.id === chatId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      ),
    })),

  clearUnread: (chatId) =>
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
