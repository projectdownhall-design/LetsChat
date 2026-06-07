import { useCallback } from 'react';

export function useNotifications() {
  const show = useCallback((title: string, body: string) => {
    if (window.electronAPI) {
      window.electronAPI.showNotification({ title, body });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!window.electronAPI && 'Notification' in window) {
      await Notification.requestPermission();
    }
  }, []);

  return { show, requestPermission };
}
