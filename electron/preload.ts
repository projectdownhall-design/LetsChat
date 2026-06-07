import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize:     () => ipcRenderer.invoke('window:minimize'),
  maximize:     () => ipcRenderer.invoke('window:maximize'),
  close:        () => ipcRenderer.invoke('window:close'),
  isMaximized:  () => ipcRenderer.invoke('window:is-maximized'),

  // Theme
  getTheme:    () => ipcRenderer.invoke('theme:get'),
  toggleTheme: (theme: 'dark' | 'light') => ipcRenderer.invoke('theme:toggle', theme),

  // App info
  getVersion:   () => ipcRenderer.invoke('app:get-version'),
  getServerUrl: () => ipcRenderer.invoke('app:get-server-url'),
  quitApp:      () => ipcRenderer.invoke('app:quit'),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),

  // Notifications
  showNotification: (data: { title: string; body: string }) =>
    ipcRenderer.invoke('notification:show', data),

  // Local storage (persistent)
  storeGet: (key: string)              => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: any)  => ipcRenderer.invoke('store:set', key, value),

  // Auto-start
  setAutoStart: (enabled: boolean) => ipcRenderer.invoke('auto-start:set', enabled),
  getAutoStart: () => ipcRenderer.invoke('auto-start:get'),

  // Zoom — set an exact zoom factor (e.g. 0.8, 1.0, 1.25)
  setZoom: (factor: number) => ipcRenderer.invoke('zoom:set', factor),

  // File dialog
  openFileDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:open-file', options),

  // ── Auto-Updater ──
  checkForUpdate:  () => ipcRenderer.invoke('update:check'),
  downloadUpdate:  () => ipcRenderer.invoke('update:download'),
  installUpdate:   () => ipcRenderer.invoke('update:install'),

  // Updater events (Push vom Main-Prozess → Renderer)
  onUpdateChecking:         (cb: () => void)                          => ipcRenderer.on('update:checking',         (_e) => cb()),
  onUpdateAvailable:        (cb: (info: any) => void) => ipcRenderer.on('update:available',        (_e, d) => cb(d)),
  onUpdateNotAvailable:     (cb: () => void)           => ipcRenderer.on('update:not-available',    (_e) => cb()),
  onUpdateDownloadProgress: (cb: (p: any) => void)     => ipcRenderer.on('update:download-progress',(_e, d) => cb(d)),
  onUpdateDownloaded:       (cb: (info: { version: string }) => void) => ipcRenderer.on('update:downloaded',       (_e, d) => cb(d)),
  onUpdateError:            (cb: (msg: string) => void)               => ipcRenderer.on('update:error',            (_e, d) => cb(d)),

  // Listener entfernen (für Cleanup in useEffect)
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update:checking');
    ipcRenderer.removeAllListeners('update:available');
    ipcRenderer.removeAllListeners('update:not-available');
    ipcRenderer.removeAllListeners('update:download-progress');
    ipcRenderer.removeAllListeners('update:downloaded');
    ipcRenderer.removeAllListeners('update:error');
  },
});

// Types are declared in src/types/electron.d.ts for the renderer process
// and used here only for the preload context via the ElectronAPI interface above.
