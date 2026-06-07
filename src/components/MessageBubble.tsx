import React, { useState } from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Message } from '../store/chatStore';
import { StatusTick } from './StatusTick';
import { MediaViewer } from './MediaViewer';
import { ContactAvatar } from './ContactAvatar';

const SERVER_URL = 'http://localhost:3001';
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply: (message: Message) => void;
  onDelete: (messageId: string, deleteFor: 'me' | 'all') => void;
  onReaction: (messageId: string, emoji: string) => void;
  replyMessage?: Message | null;
  currentUserId: string;
}

export const MessageBubble: React.FC<Props> = ({
  message,
  isOwn,
  showAvatar,
  onReply,
  onDelete,
  onReaction,
  replyMessage,
  currentUserId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [mediaViewer, setMediaViewer] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  if (message.type === 'deleted') {
    return (
      <div className={clsx('flex items-end gap-2 mb-1 px-4', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        <div className={clsx(
          'px-3 py-2 rounded-lg text-sm italic',
          isOwn ? 'bg-lc-bubble-out' : 'bg-lc-bubble-in',
          'text-lc-text-muted'
        )}>
          🚫 Nachricht wurde gelöscht
        </div>
      </div>
    );
  }

  const timeStr = format(new Date(message.createdAt), 'HH:mm');
  const mediaUrl = message.mediaUrl
    ? (message.mediaUrl.startsWith('http') ? message.mediaUrl : `${SERVER_URL}${message.mediaUrl}`)
    : null;

  const reactionGroups = message.reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || []);
    acc[r.emoji].push(r.userId);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <>
      {mediaViewer && (
        <MediaViewer
          url={mediaViewer.url}
          type={mediaViewer.type}
          onClose={() => setMediaViewer(null)}
        />
      )}

      <div
        className={clsx(
          'flex items-end gap-2 mb-1 px-4 group',
          isOwn ? 'flex-row-reverse' : 'flex-row'
        )}
        onMouseLeave={() => { setShowMenu(false); setShowReactions(false); }}
      >
        {!isOwn && showAvatar && (
          <ContactAvatar
            name={message.senderName}
            avatarUrl={message.senderAvatar}
            size="sm"
          />
        )}
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div className={clsx('max-w-[65%] relative', isOwn ? 'items-end' : 'items-start')}>
          {replyMessage && (
            <div className={clsx(
              'mb-1 px-3 py-1.5 rounded-t-lg border-l-4 border-lc-green bg-black/20 text-xs cursor-pointer',
              isOwn ? 'bg-black/30' : 'bg-black/20'
            )}>
              <p className="text-lc-green font-medium truncate">{replyMessage.senderName}</p>
              <p className="text-lc-text-muted truncate">
                {replyMessage.type !== 'text' ? `📎 ${replyMessage.type}` : replyMessage.content}
              </p>
            </div>
          )}

          <div
            className={clsx(
              'relative rounded-lg px-3 py-2 shadow-sm',
              isOwn ? 'bg-lc-bubble-out rounded-tr-none' : 'bg-lc-bubble-in rounded-tl-none'
            )}
          >
            {!isOwn && (
              <p className="text-lc-green text-xs font-semibold mb-1">{message.senderName}</p>
            )}

            {message.type === 'image' && mediaUrl && (
              <img
                src={mediaUrl}
                alt="Bild"
                className="max-w-full rounded cursor-pointer mb-1 max-h-64 object-cover"
                onClick={() => setMediaViewer({ url: mediaUrl, type: 'image' })}
                loading="lazy"
              />
            )}

            {message.type === 'video' && mediaUrl && (
              <video
                src={mediaUrl}
                className="max-w-full rounded cursor-pointer mb-1 max-h-48"
                onClick={() => setMediaViewer({ url: mediaUrl, type: 'video' })}
              />
            )}

            {message.type === 'document' && mediaUrl && (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-1 text-lc-green hover:underline"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="text-sm truncate">Dokument öffnen</span>
              </a>
            )}

            {message.type === 'text' && (
              <p className="text-lc-text text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}

            <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
              <span className="text-[10px] text-lc-text-muted">{timeStr}</span>
              {isOwn && <StatusTick status={message.status} className="text-lc-text-muted" />}
            </div>

            <div
              className={clsx(
                'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1',
                isOwn ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'
              )}
            >
              <button
                onClick={() => setShowReactions(v => !v)}
                className="p-1 rounded-full bg-lc-bg-chat hover:bg-lc-hover text-lc-text-muted hover:text-lc-text transition-colors"
                title="Reaktion"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => { setShowMenu(v => !v); }}
                className="p-1 rounded-full bg-lc-bg-chat hover:bg-lc-hover text-lc-text-muted hover:text-lc-text transition-colors"
                title="Optionen"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {showReactions && (
              <div className={clsx(
                'absolute z-10 flex gap-1 p-2 bg-lc-header rounded-full shadow-lg -top-12',
                isOwn ? 'right-0' : 'left-0'
              )}>
                {REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onReaction(message.id, emoji); setShowReactions(false); }}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {showMenu && (
              <div className={clsx(
                'absolute z-10 bg-lc-header border border-lc-border rounded-lg shadow-xl py-1 min-w-36 -top-2',
                isOwn ? 'right-full mr-1' : 'left-full ml-1'
              )}>
                <button
                  onClick={() => { onReply(message); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-lc-text hover:bg-lc-hover transition-colors"
                >
                  Antworten
                </button>
                <button
                  onClick={() => { onDelete(message.id, 'me'); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-lc-text hover:bg-lc-hover transition-colors"
                >
                  Für mich löschen
                </button>
                {isOwn && (
                  <button
                    onClick={() => { onDelete(message.id, 'all'); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-lc-hover transition-colors"
                  >
                    Für alle löschen
                  </button>
                )}
              </div>
            )}
          </div>

          {Object.entries(reactionGroups).length > 0 && (
            <div className={clsx(
              'flex flex-wrap gap-1 mt-1',
              isOwn ? 'justify-end' : 'justify-start'
            )}>
              {Object.entries(reactionGroups).map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => onReaction(message.id, emoji)}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors',
                    userIds.includes(currentUserId)
                      ? 'bg-lc-green/20 border-lc-green text-lc-green'
                      : 'bg-lc-bubble-in border-lc-border text-lc-text hover:border-lc-green'
                  )}
                >
                  <span>{emoji}</span>
                  {userIds.length > 1 && <span>{userIds.length}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
