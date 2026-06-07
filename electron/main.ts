import { app, BrowserWindow, ipcMain, nativeTheme, shell, dialog, Notification } from 'electron';
import path from 'path';
import { setupTray } from './tray';
import { initializeUpdater, setupUpdaterIPC } from './updater';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Store = require('electron-store');
const store = new Store();

let mainWindow: BrowserWindow | null = null;
let serverProcess: any = null;

const isDev      = process.env.NODE_ENV === 'development';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

function getIconPath(): string {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'installer', 'assets', 'icon.ico');
  }
  return path.join(app.getAppPath(), 'installer', 'assets', 'icon.ico');
}

async function startServer() {
  if (isDev) return;

  const { fork } = require('child_process');
  const serverPath = path.join(process.resourcesPath, 'server', 'server.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '3001' },
    silent: false,
  });
  serverProcess.on('error', (err: Error) => console.error('[Main] Server error:', err));
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function createWindow() {
  const iconPath = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 800, minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#111B21',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false,
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('close', (event) => { event.preventDefault(); mainWindow?.hide(); });

  setupTray(mainWindow);
}

app.whenReady().then(async () => {
  setupUpdaterIPC();
  await startServer();
  await createWindow();
  if (mainWindow && !isDev) {
    initializeUpdater(mainWindow);
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
  mainWindow?.removeAllListeners('close');
});

// ── Window Controls ──
ipcMain.handle('window:minimize',     () => mainWindow?.minimize());
ipcMain.handle('window:maximize',     () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.handle('window:close',        () => mainWindow?.hide());
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);

// ── Theme ──
ipcMain.handle('theme:get',    () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
ipcMain.handle('theme:toggle', (_e, theme: 'dark' | 'light') => { nativeTheme.themeSource = theme; return theme; });

// ── App Info ──
ipcMain.handle('app:get-version',    () => app.getVersion());
ipcMain.handle('app:get-server-url', () => SERVER_URL);
ipcMain.handle('app:quit',           () => app.quit());

// ── Shell ──
ipcMain.handle('shell:open-external', (_e, url: string) => {
  if (url.startsWith('http://localhost') || url.startsWith('https://')) shell.openExternal(url);
});

// ── Notifications ──
ipcMain.handle('notification:show', (_e, data: { title: string; body: string }) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title: data.title, body: data.body, icon: getIconPath() });
    n.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
    n.show();
  }
});

// ── Persistent Store ──
ipcMain.handle('store:get', (_e, key: string) => store.get(key));
ipcMain.handle('store:set', (_e, key: string, value: any) => store.set(key, value));

// ── Auto Start ──
ipcMain.handle('auto-start:set', (_e, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled, path: app.getPath('exe') });
});
ipcMain.handle('auto-start:get', () => app.getLoginItemSettings().openAtLogin);

// ── Zoom ──
ipcMain.handle('zoom:set', (_e, factor: number) => {
  const f = Math.min(Math.max(factor, 0.5), 2.0);
  mainWindow?.webContents.setZoomFactor(f);
  return f;
});

// ── Dialog ──
ipcMain.handle('dialog:open-file', async (_e, options: any) => dialog.showOpenDialog(mainWindow!, options));
