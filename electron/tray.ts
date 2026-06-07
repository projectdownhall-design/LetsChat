import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function setupTray(mainWindow: BrowserWindow) {
  const iconPath = path.join(__dirname, '..', 'installer', 'assets', 'icon.ico');

  try {
    tray = new Tray(iconPath);
  } catch {
    const icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFUSURBVFiF7ZaxSgNBEIa/3V0SghYqFoKFhYWFhYWFpYWFhYWFhZWVlYWVlZWFlYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhVj4HxyXkEsud3c3Bz4YGJiZ/2f+nZ0dEBERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER8AX7qbEAAAAAElFTkSuQmCC'
    );
    tray = new Tray(icon);
  }

  tray.setToolTip('LetsChat');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'LetsChat öffnen',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => {
        mainWindow.removeAllListeners('close');
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

export function updateTrayBadge(count: number) {
  if (!tray) return;
  if (count > 0) {
    tray.setToolTip(`LetsChat (${count} ungelesene Nachrichten)`);
  } else {
    tray.setToolTip('LetsChat');
  }
}
