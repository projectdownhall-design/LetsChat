# LetsChat - Desktop Messenger

Ein WhatsApp-ähnlicher Desktop-Messenger für Windows, gebaut mit Electron, React und Node.js.

## Schnellstart (3 Schritte)

### 1. Voraussetzungen
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Windows 10/11**
- Optional für Installer: **Inno Setup 6** - [Download](https://jrsoftware.org/isdl.php)

### 2. Installation
```bash
cd LetsChat
npm install
```

### 3. Entwicklungsmodus starten
```bash
npm run dev
```

Dies startet gleichzeitig:
- Backend-Server auf Port 3001
- Vite Dev-Server auf Port 5173
- Electron-Fenster

## Mehrere Instanzen testen

Um zwei Nutzer gleichzeitig zu testen:

**Terminal 1** (Server + Erste App):
```bash
npm run dev
```

**Terminal 2** (Zweite Electron-Instanz):
```bash
cross-env NODE_ENV=development electron . --user-data-dir="%APPDATA%\LetsChat2"
```

Alternativ: Öffne `http://localhost:5173` im Browser für weitere Instanzen.

## Benutzer anlegen

1. App starten mit `npm run dev`
2. Klicke auf "Registrieren"
3. Erstelle zwei Accounts (z.B. `user1` und `user2`)
4. Logge dich in der zweiten Instanz als `user2` ein
5. Wähle "Neuen Chat starten" → wähle den anderen Nutzer

## Build für Windows

```bash
npm run build
```

Erstellt die App unter `dist-electron/`.

## Installer erstellen

### Mit electron-builder (NSIS):
```bash
npm run build
```
Der NSIS-Installer wird automatisch erstellt.

### Mit Inno Setup:
```bash
# Erst Assets generieren:
node installer/generate-assets.js

# Dann Inno Setup aufrufen (ISCC muss im PATH sein):
npm run build:installer

# Oder manuell:
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\setup.iss
```

## Projektstruktur

```
LetsChat/
├── electron/          # Electron Hauptprozess
│   ├── main.ts        # App-Einstiegspunkt, Fenster, IPC
│   ├── preload.ts     # Sichere IPC-Bridge (contextIsolation)
│   └── tray.ts        # System-Tray-Icon
├── src/               # React Frontend
│   ├── components/    # UI-Komponenten
│   ├── hooks/         # Custom Hooks (Socket, Verschlüsselung)
│   ├── store/         # Zustand (Zustand)
│   ├── App.tsx        # Hauptkomponente + Login
│   └── index.css      # Tailwind + globale Styles
├── server/            # Node.js Backend
│   ├── server.ts      # Express + Socket.io Server
│   ├── routes/        # REST API Endpunkte
│   ├── socket/        # WebSocket Handler
│   └── db/            # SQLite Schema
└── installer/         # Inno Setup
    └── setup.iss      # Installer-Skript
```

## Features

- **Echtzeit-Nachrichten** via WebSocket (Socket.io)
- **Gelesen-Status** (✓ gesendet → ✓✓ zugestellt → ✓✓ blau = gelesen)
- **Online/Offline-Anzeige** mit "zuletzt gesehen"
- **Dateien senden** (Bilder, Videos, Dokumente via Drag & Drop)
- **Emoji-Picker** mit Suche
- **Nachrichtensuche** (Ctrl+F)
- **System Tray** - App minimiert sich ins Tray
- **Windows-Benachrichtigungen** bei neuen Nachrichten
- **Autostart** optional konfigurierbar
- **Zoom** (Ctrl+/Ctrl-)
- **Dark/Light Mode**
- **End-to-End-Verschlüsselung** (AES-GCM)
- **SQLite-Datenbank** für lokale Nachrichtenhistorie
- **Typing-Indikator** ("schreibt...")
- **Nachrichten löschen** (für mich / für alle)
- **Antworten** auf einzelne Nachrichten
- **Emoji-Reaktionen** (👍❤️😂😮😢🙏)
- **Profilbild** hochladen

## Technologien

| Bereich | Technologie |
|---------|-------------|
| Desktop | Electron 33 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Echtzeit | Socket.io |
| Backend | Express + Node.js |
| Datenbank | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt |
| Build | Vite + electron-builder |
| Installer | Inno Setup 6 |

## API Dokumentation

### REST Endpoints

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | /api/auth/register | Registrierung |
| POST | /api/auth/login | Anmeldung |
| POST | /api/auth/refresh | Token-Erneuerung |
| GET | /api/contacts | Alle Nutzer |
| GET | /api/messages/:chatId | Nachrichtenhistorie |
| POST | /api/media/upload | Datei hochladen |
| POST | /api/media/avatar | Profilbild hochladen |

### WebSocket Events

**Client → Server:**
- `send_message` - Nachricht senden
- `typing_start` / `typing_stop` - Tipp-Indikator
- `mark_read` - Als gelesen markieren
- `delete_message` - Nachricht löschen
- `add_reaction` / `remove_reaction` - Reaktion

**Server → Client:**
- `new_message` - Neue Nachricht
- `message_status` - Status-Update
- `user_typing` - Tipp-Indikator
- `user_online` - Online-Status
- `message_deleted` - Gelöschte Nachricht
- `reaction_added` / `reaction_removed` - Reaktion

## Sicherheit

- `contextIsolation: true` - Renderer-Prozess isoliert
- `nodeIntegration: false` - Kein direkter Node.js-Zugriff
- JWT mit 15min Laufzeit + Refresh-Token (7 Tage)
- Passwörter als bcrypt-Hash (Faktor 12)
- AES-GCM Verschlüsselung für Nachrichten
- Content Security Policy im HTML
- Typisierte IPC-Bridge über preload.ts

## Lizenz

MIT
