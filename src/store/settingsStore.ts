import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Discrete zoom levels used by the A- / A+ buttons in the settings panel.
export const ZOOM_LEVELS = [0.8, 0.9, 1.0, 1.1, 1.25, 1.5];

interface SettingsState {
  darkMode: boolean;
  autoStart: boolean;
  zoomFactor: number;

  setDarkMode: (value: boolean) => void;
  setAutoStart: (value: boolean) => void;
  setZoomFactor: (value: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  /** Apply persisted settings to the DOM / Electron main process on startup. */
  initSettings: () => Promise<void>;
}

/** Add/remove the theme class on <html> so the whole app re-themes via CSS vars. */
function applyTheme(dark: boolean) {
  const el = document.documentElement;
  el.classList.toggle('dark', dark);
  el.classList.toggle('light', !dark);
}

/** Find the index of the closest entry in ZOOM_LEVELS to the given factor. */
function nearestZoomIndex(factor: number): number {
  let best = 0;
  let bestDiff = Infinity;
  ZOOM_LEVELS.forEach((level, i) => {
    const diff = Math.abs(level - factor);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      darkMode: true,
      autoStart: false,
      zoomFactor: 1.0,

      setDarkMode: (value) => {
        applyTheme(value);
        set({ darkMode: value });
        window.electronAPI?.toggleTheme(value ? 'dark' : 'light');
      },

      setAutoStart: (value) => {
        set({ autoStart: value });
        window.electronAPI?.setAutoStart(value);
      },

      setZoomFactor: (value) => {
        set({ zoomFactor: value });
        window.electronAPI?.setZoom(value);
      },

      zoomIn: () => {
        const i = nearestZoomIndex(get().zoomFactor);
        get().setZoomFactor(ZOOM_LEVELS[Math.min(i + 1, ZOOM_LEVELS.length - 1)]);
      },

      zoomOut: () => {
        const i = nearestZoomIndex(get().zoomFactor);
        get().setZoomFactor(ZOOM_LEVELS[Math.max(i - 1, 0)]);
      },

      resetZoom: () => get().setZoomFactor(1.0),

      initSettings: async () => {
        // Theme: apply persisted preference immediately (no flash).
        applyTheme(get().darkMode);

        if (!window.electronAPI) return;

        // Zoom: restore persisted factor in the main process.
        try {
          await window.electronAPI.setZoom(get().zoomFactor);
        } catch {
          /* ignore */
        }

        // Autostart: trust the OS as the source of truth and sync the store.
        try {
          const enabled = await window.electronAPI.getAutoStart();
          if (enabled !== get().autoStart) set({ autoStart: enabled });
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: 'letschat-settings',
      partialize: (s) => ({
        darkMode: s.darkMode,
        autoStart: s.autoStart,
        zoomFactor: s.zoomFactor,
      }),
    }
  )
);
