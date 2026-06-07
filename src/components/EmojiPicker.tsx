import React, { useRef, useEffect } from 'react';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';

interface Props {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export const EmojiPicker: React.FC<Props> = ({ onEmojiSelect, onClose, position = 'top' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  return (
    <div
      ref={ref}
      className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 shadow-2xl rounded-lg overflow-hidden`}
    >
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        theme={Theme.DARK}
        searchPlaceHolder="Emoji suchen..."
        width={320}
        height={400}
        lazyLoadEmojis
      />
    </div>
  );
};
