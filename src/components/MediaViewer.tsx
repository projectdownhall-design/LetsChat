import React, { useEffect } from 'react';

interface Props {
  url: string;
  type: 'image' | 'video';
  onClose: () => void;
}

const SERVER_URL = 'http://localhost:3001';

export const MediaViewer: React.FC<Props> = ({ url, type, onClose }) => {
  const fullUrl = url.startsWith('http') ? url : `${SERVER_URL}${url}`;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        onClick={onClose}
        aria-label="Schließen"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[90vh]">
        {type === 'image' ? (
          <img
            src={fullUrl}
            alt="Medieninhalt"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        ) : (
          <video
            src={fullUrl}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        )}
      </div>
    </div>
  );
};
