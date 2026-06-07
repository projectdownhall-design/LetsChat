import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClose?: () => void;
}

export const SearchBar: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Suchen...',
  onClose,
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      {onClose && (
        <button
          onClick={onClose}
          className="text-wa-green p-1 hover:bg-wa-hover rounded transition-colors"
          aria-label="Suche schließen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div className="flex-1 flex items-center bg-wa-input-bg rounded-lg px-3 py-2 gap-2">
        <svg className="w-4 h-4 text-wa-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-wa-text text-sm placeholder-wa-text-muted outline-none min-w-0"
          autoFocus
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-wa-text-muted hover:text-wa-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
