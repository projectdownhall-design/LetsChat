import React from 'react';
import clsx from 'clsx';

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  showStatus?: boolean;
}

const SERVER_URL = 'http://localhost:3001';

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const statusSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-green-600',
    'bg-orange-500', 'bg-pink-600', 'bg-teal-600',
    'bg-indigo-600', 'bg-red-600', 'bg-yellow-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const ContactAvatar: React.FC<Props> = ({
  name,
  avatarUrl,
  size = 'md',
  online,
  showStatus = false,
}) => {
  const fullUrl = avatarUrl
    ? avatarUrl.startsWith('http') ? avatarUrl : `${SERVER_URL}${avatarUrl}`
    : null;

  return (
    <div className="relative flex-shrink-0">
      <div
        className={clsx(
          'rounded-full flex items-center justify-center overflow-hidden',
          sizeClasses[size],
          !fullUrl && getColor(name)
        )}
      >
        {fullUrl ? (
          <img
            src={fullUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="font-semibold text-white">{getInitials(name)}</span>
        )}
      </div>
      {showStatus && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-lc-bg-sidebar',
            statusSizeClasses[size],
            online ? 'bg-lc-green' : 'bg-lc-text-muted'
          )}
        />
      )}
    </div>
  );
};
