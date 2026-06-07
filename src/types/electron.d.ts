interface UpdateAvailableInfo {
  version: string;
  releaseNotes: string;
  releaseDate: string;
}

interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

interface ElectronAPI {
  // Window controls
  minimize:    () => Promise<void>;
  maximize:    () => Promise<void>;
  close:       () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // Theme
  getTheme:    () => Promise<'dark' | 'light'>;
  toggleTheme: (theme: 'dark' | 'light') => Promise<'dark' | 'light'>;

  // App info
  getVersion:   () => Promise<string>;
  getServerUrl: () => Promise<string>;
  quitApp:      () => Promise<void>;

  // Shell
  openExternal: (url: string) => Promise<void>;

  // Notifications
  showNotification: (data: { title: string; body: string }) => Promise<void>;

  // Persistent store
  storeGet: (key: string) => Promise<any>;
  storeSet: (key: string, value: any) => Promise<void>;

  // System
  setAutoStart: (enabled: boolean) => Promise<void>;
  getAutoStart: () => Promise<boolean>;

  // Zoom
  setZoom: (factor: number) => Promise<number>;

  // File dialog
  openFileDialog: (options: any) => Promise<{ filePaths: string[]; canceled: boolean }>;

  // Auto-Updater
  checkForUpdate:  () => Promise<void>;
  downloadUpdate:  () => Promise<void>;
  installUpdate:   () => Promise<void>;

  // Updater events (push Main → Renderer)
  onUpdateChecking:         (cb: () => void) => void;
  onUpdateAvailable:        (cb: (info: UpdateAvailableInfo) => void) => void;
  onUpdateNotAvailable:     (cb: () => void) => void;
  onUpdateDownloadProgress: (cb: (p: UpdateProgress) => void) => void;
  onUpdateDownloaded:       (cb: (info: { version: string }) => void) => void;
  onUpdateError:            (cb: (msg: string) => void) => void;
  removeUpdateListeners:    () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
