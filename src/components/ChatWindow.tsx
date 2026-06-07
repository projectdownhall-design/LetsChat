import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import axios from 'axios';
import { Chat, Message, useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { ContactAvatar } from './ContactAvatar';
import { EmojiPicker } from './EmojiPicker';
import { SearchBar } from './SearchBar';

const SERVER_URL = 'http://localhost:3001';
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface Props {
  chat: Chat;
}

function getDateLabel(ts: number): string {
  const date = new Date(ts);
  if (isToday(date)) return 'Heute';
  if (isYesterday(date)) return 'Gestern';
  return format(date, 'dd. MMMM yyyy', { locale: de });
}

export const ChatWindow: React.FC<Props> = ({ chat }) => {
  const { user, accessToken } = useAuthStore();
  const { messages, setMessages, prependMessages, clearUnread, deleteMessage } = useChatStore();
  const { sendMessage, sendTypingStart, sendTypingStop, markRead, deleteMessage: deleteSocket, addReaction, removeReaction } = useSocket();

  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatMessages = messages[chat.id] || [];

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return chatMessages;
    const q = searchQuery.toLowerCase();
    return chatMessages.filter(m => m.content.toLowerCase().includes(q));
  }, [chatMessages, searchQuery]);

  const displayMessages = searchQuery ? filteredMessages : chatMessages;

  const virtualizer = useVirtualizer({
    count: displayMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
    paddingStart: 8,
    paddingEnd: 8,
  });

  useEffect(() => {
    clearUnread(chat.id);
    setPage(1);
    setHasMore(true);
    loadMessages(1);
  }, [chat.id]);

  useEffect(() => {
    if (!searchQuery) {
      const timeout = setTimeout(() => {
        virtualizer.scrollToIndex(displayMessages.length - 1, { align: 'end' });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [displayMessages.length, chat.id, searchQuery]);

  useEffect(() => {
    const unreadMessages = chatMessages
      .filter(m => m.senderId !== user?.id && m.status !== 'read')
      .map(m => m.id);

    if (unreadMessages.length > 0) {
      markRead(unreadMessages, chat.id, chat.contact.id);
    }
  }, [chatMessages.length, chat.id]);

  const loadMessages = async (pageNum: number) => {
    if (!accessToken) return;
    try {
      setIsLoadingMore(true);
      const res = await axios.get(
        `${SERVER_URL}/api/messages/${chat.id}?page=${pageNum}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (pageNum === 1) {
        setMessages(chat.id, res.data.messages);
      } else {
        prependMessages(chat.id, res.data.messages);
      }
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error('Load messages error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el || isLoadingMore || !hasMore) return;
    if (el.scrollTop < 100) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage);
    }
  }, [page, isLoadingMore, hasMore]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    sendMessage({
      to: chat.contact.id,
      content: text,
      type: 'text',
      replyTo: replyTo?.id,
    });

    setInputText('');
    setReplyTo(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    handleTypingStop();
  }, [inputText, chat.contact.id, replyTo, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTypingStart = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStart(chat.contact.id);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleTypingStop, 3000);
  }, [chat.contact.id, sendTypingStart]);

  const handleTypingStop = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingStop(chat.contact.id);
    }
    clearTimeout(typingTimeoutRef.current);
  }, [chat.contact.id, sendTypingStop]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    if (e.target.value) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!accessToken) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${SERVER_URL}/api/media/upload`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      sendMessage({
        to: chat.contact.id,
        content: res.data.filename || file.name,
        type: res.data.type,
        mediaUrl: res.data.url,
      });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDeleteMessage = useCallback((messageId: string, deleteFor: 'me' | 'all') => {
    deleteSocket(messageId, deleteFor, chat.id, chat.contact.id);
    deleteMessage(messageId, chat.id, deleteFor, user?.id || '');
  }, [chat.id, chat.contact.id, user?.id]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg) return;
    const hasReacted = msg.reactions.some(r => r.userId === user?.id && r.emoji === emoji);
    if (hasReacted) {
      removeReaction(messageId, chat.contact.id);
    } else {
      addReaction(messageId, emoji, chat.contact.id);
    }
  }, [chatMessages, user?.id, chat.contact.id]);

  const lastSeenText = useMemo(() => {
    if (chat.contact.online) return 'Online';
    if (!chat.contact.lastSeen) return '';
    const d = new Date(chat.contact.lastSeen);
    if (isToday(d)) return `Zuletzt gesehen heute um ${format(d, 'HH:mm')}`;
    if (isYesterday(d)) return `Zuletzt gesehen gestern um ${format(d, 'HH:mm')}`;
    return `Zuletzt gesehen am ${format(d, 'dd.MM.yyyy')}`;
  }, [chat.contact.online, chat.contact.lastSeen]);

  useEffect(() => {
    const handleCtrlF = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(v => !v);
      }
    };
    window.addEventListener('keydown', handleCtrlF);
    return () => window.removeEventListener('keydown', handleCtrlF);
  }, []);

  return (
    <div
      className="flex flex-col h-full bg-lc-bg-chat"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-lc-header border-b border-lc-border">
        <div className="flex items-center gap-3">
          <ContactAvatar
            name={chat.contact.displayName}
            avatarUrl={chat.contact.avatarUrl}
            size="md"
            online={chat.contact.online}
            showStatus
          />
          <div>
            <p className="text-lc-text font-medium">{chat.contact.displayName}</p>
            <p className={clsx(
              'text-xs transition-colors',
              chat.contact.online ? 'text-lc-green' :
              chat.typing ? 'text-lc-green' : 'text-lc-text-muted'
            )}>
              {chat.typing ? 'schreibt...' : lastSeenText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(v => !v)}
            className={clsx(
              'p-2 rounded-full transition-colors',
              showSearch ? 'text-lc-green bg-lc-hover' : 'text-lc-icon hover:bg-lc-hover hover:text-lc-text'
            )}
            title="Suchen (Ctrl+F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="bg-lc-header border-b border-lc-border">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="In Chat suchen..."
            onClose={() => { setShowSearch(false); setSearchQuery(''); }}
          />
          {searchQuery && (
            <div className="px-4 py-1 text-xs text-lc-text-muted">
              {filteredMessages.length} Ergebnis{filteredMessages.length !== 1 ? 'se' : ''}
            </div>
          )}
        </div>
      )}

      {/* Chat background pattern */}
      <div
        className="flex-1 overflow-hidden relative"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23ffffff08'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23p)'/%3E%3C/svg%3E")`,
        }}
      >
        {isLoadingMore && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-lc-header px-3 py-1 rounded-full text-xs text-lc-text-muted">
            Lade ältere Nachrichten...
          </div>
        )}

        <div
          ref={parentRef}
          className="h-full overflow-y-auto scrollbar-thin"
          onScroll={handleScroll}
        >
          <div
            style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map(virtualItem => {
              const message = displayMessages[virtualItem.index];
              const prevMessage = displayMessages[virtualItem.index - 1];
              const showDateSep = !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));
              const nextMessage = displayMessages[virtualItem.index + 1];
              const showAvatar = !nextMessage || nextMessage.senderId !== message.senderId;
              const isOwn = message.senderId === user?.id;
              const replyMsg = message.replyTo ? chatMessages.find(m => m.id === message.replyTo) : null;

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {showDateSep && (
                    <div className="flex items-center justify-center py-2">
                      <span className="bg-lc-header/80 backdrop-blur-sm text-lc-text-muted text-xs px-3 py-1 rounded-full">
                        {getDateLabel(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onReply={setReplyTo}
                    onDelete={handleDeleteMessage}
                    onReaction={handleReaction}
                    replyMessage={replyMsg}
                    currentUserId={user?.id || ''}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-lc-header border-t border-lc-border">
          <div className="flex-1 border-l-4 border-lc-green pl-3 min-w-0">
            <p className="text-lc-green text-xs font-medium">{replyTo.senderName}</p>
            <p className="text-lc-text-muted text-sm truncate">
              {replyTo.type !== 'text' ? `📎 ${replyTo.type}` : replyTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-lc-text-muted hover:text-lc-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 bg-lc-header border-t border-lc-border">
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowEmoji(v => !v)}
              className={clsx(
                'p-2 rounded-full transition-colors',
                showEmoji ? 'text-lc-green' : 'text-lc-icon hover:text-lc-text'
              )}
              title="Emoji"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmoji && (
              <EmojiPicker
                onEmojiSelect={emoji => setInputText(prev => prev + emoji)}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>

          <button
            onClick={handleFilePick}
            disabled={uploading}
            className="p-2 rounded-full text-lc-icon hover:text-lc-text transition-colors disabled:opacity-50"
            title="Datei anhängen"
          >
            {uploading ? (
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
          />

          <div className="flex-1 bg-lc-input-bg rounded-xl px-4 py-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht eingeben"
              rows={1}
              className="w-full bg-transparent text-lc-text placeholder-lc-text-muted text-sm resize-none outline-none min-h-[24px] max-h-[150px]"
              style={{ height: 'auto' }}
            />
          </div>

          <button
            onClick={handleSend}
            className="p-2 rounded-full bg-lc-green hover:bg-lc-green/90 text-white transition-colors flex-shrink-0"
            title={inputText.trim() ? 'Senden' : 'Sprachnachricht'}
          >
            {inputText.trim() ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
