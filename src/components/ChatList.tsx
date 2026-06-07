import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { format, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Chat, Contact, useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { ContactAvatar } from './ContactAvatar';
import { StatusTick } from './StatusTick';
import { SearchBar } from './SearchBar';
import { SettingsPanel } from './SettingsPanel';

interface Props {
  chats: Chat[];
  contacts: Contact[];
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  onNewChat: (contact: Contact) => void;
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Gestern';
  return format(date, 'dd.MM.yy', { locale: de });
}

export const ChatList: React.FC<Props> = ({
  chats,
  contacts,
  activeChat,
  onChatSelect,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuthStore();

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(chat =>
      chat.contact.displayName.toLowerCase().includes(q) ||
      chat.lastMessage?.content.toLowerCase().includes(q)
    );
  }, [chats, searchQuery]);

  const availableContacts = useMemo(() => {
    if (!showNewChat || !searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q)
    );
  }, [contacts, showNewChat, searchQuery]);

  return (
    <>
      <div className="flex flex-col h-full bg-lc-bg-sidebar border-r border-lc-border">
        <div className="flex items-center justify-between px-4 py-3 bg-lc-panel-header">
          <div className="flex items-center gap-3">
            <ContactAvatar
              name={user?.displayName || '?'}
              avatarUrl={user?.avatarUrl}
              size="md"
            />
            <span className="font-semibold text-lc-text text-base hidden sm:block">LetsChat</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowNewChat(v => !v); setShowSearch(false); }}
              className={clsx(
                'p-2 rounded-full transition-colors',
                showNewChat ? 'text-lc-green bg-lc-hover' : 'text-lc-icon hover:bg-lc-hover hover:text-lc-text'
              )}
              title="Neuen Chat starten"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => { setShowSearch(v => !v); setShowNewChat(false); }}
              className={clsx(
                'p-2 rounded-full transition-colors',
                showSearch ? 'text-lc-green bg-lc-hover' : 'text-lc-icon hover:bg-lc-hover hover:text-lc-text'
              )}
              title="Suchen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full text-lc-icon hover:bg-lc-hover hover:text-lc-text transition-colors"
              title="Einstellungen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {(showSearch || showNewChat) && (
          <div className="py-2 border-b border-lc-border">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={showNewChat ? 'Kontakt suchen...' : 'Suchen oder neuen Chat starten'}
              onClose={() => { setShowSearch(false); setShowNewChat(false); setSearchQuery(''); }}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {showNewChat ? (
            <>
              <div className="px-4 py-2 text-xs text-lc-text-muted font-medium uppercase tracking-wider">
                Kontakte auf LetsChat
              </div>
              {availableContacts.length === 0 ? (
                <div className="px-4 py-8 text-center text-lc-text-muted text-sm">
                  Keine Kontakte gefunden
                </div>
              ) : (
                availableContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => { onNewChat(contact); setShowNewChat(false); setSearchQuery(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-lc-hover transition-colors"
                  >
                    <ContactAvatar
                      name={contact.displayName}
                      avatarUrl={contact.avatarUrl}
                      size="md"
                      online={contact.online}
                      showStatus
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-lc-text font-medium truncate">{contact.displayName}</p>
                      <p className="text-lc-text-muted text-sm truncate">@{contact.username}</p>
                    </div>
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              {filteredChats.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <div className="text-lc-text-muted text-sm">
                    {searchQuery ? 'Keine Chats gefunden' : 'Noch keine Chats. Starte einen neuen Chat!'}
                  </div>
                </div>
              )}
              {filteredChats.map(chat => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChat?.id === chat.id}
                  currentUserId={user?.id || ''}
                  onClick={() => onChatSelect(chat)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
};

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isActive, currentUserId, onClick }) => {
  const lastMsg = chat.lastMessage;
  const isOwn = lastMsg?.senderId === currentUserId;

  const previewText = useMemo(() => {
    if (!lastMsg) return '';
    if (lastMsg.type === 'deleted') return '🚫 Nachricht gelöscht';
    if (lastMsg.type === 'image') return '📷 Foto';
    if (lastMsg.type === 'video') return '🎥 Video';
    if (lastMsg.type === 'document') return '📄 Dokument';
    return lastMsg.content;
  }, [lastMsg]);

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-lc-border/30',
        isActive ? 'bg-lc-hover' : 'hover:bg-lc-hover/50'
      )}
    >
      <ContactAvatar
        name={chat.contact.displayName}
        avatarUrl={chat.contact.avatarUrl}
        size="md"
        online={chat.contact.online}
        showStatus
      />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <span className="text-lc-text font-medium truncate">{chat.contact.displayName}</span>
          {lastMsg && (
            <span className={clsx(
              'text-xs flex-shrink-0 ml-1',
              chat.unreadCount > 0 ? 'text-lc-green' : 'text-lc-text-muted'
            )}>
              {formatTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1 min-w-0">
            {isOwn && lastMsg && (
              <StatusTick status={lastMsg.status} className="text-lc-text-muted flex-shrink-0" />
            )}
            {chat.typing ? (
              <span className="text-lc-green text-sm italic">schreibt...</span>
            ) : (
              <span className="text-lc-text-muted text-sm truncate">{previewText}</span>
            )}
          </div>
          {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 ml-1 bg-lc-green text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-medium">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
