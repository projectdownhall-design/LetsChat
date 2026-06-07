import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

autoUpdater.logger = log;
(log as any).transports.file.level = 'info';

// Nicht automatisch herunterladen — Nutzer entscheidet
autoUpdater.autoDownload         = false;
// Nach Download beim nächsten Beenden automatisch installieren
autoUpdater.autoInstallOnAppQuit = true;
// Keine Beta/RC-Versionen anbieten, außer die aktuelle ist auch eine
autoUpdater.allowPrerelease      = false;

let win: BrowserWindow | null = null;

function send(channel: string, data?: any) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}

export function initializeUpdater(mainWindow: BrowserWindow) {
  win = mainWindow;

  autoUpdater.on('checking-for-update', () => {
    send('update:checking');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    send('update:available', {
      version:      info.version,
      releaseNotes: info.releaseNotes ?? '',
      releaseDate:  info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    send('update:not-available');
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    send('update:download-progress', {
      percent:       Math.round(progress.percent),
      transferred:   progress.transferred,
      total:         progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    send('update:downloaded', { version: info.version });
  });

  autoUpdater.on('error', (err: Error) => {
    log.error('[Updater] Error:', err);
    send('update:error', err.message);
  });

  // Beim Start einmalig nach Updates suchen (5 Sek. Verzögerung damit das Fenster geladen ist)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      log.warn('[Updater] Check failed (offline?):', err.message);
    });
  }, 5000);
}

export function setupUpdaterIPC() {
  ipcMain.handle('update:check',    () => autoUpdater.checkForUpdates().catch(e => ({ error: e.message })));
  ipcMain.handle('update:download', () => autoUpdater.downloadUpdate());
  ipcMain.handle('update:install',  () => {
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.quitAndInstall(false, true);
  });
}
