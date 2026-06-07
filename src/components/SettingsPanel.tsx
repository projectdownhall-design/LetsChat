import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { ContactAvatar } from './ContactAvatar';
import clsx from 'clsx';

const SERVER_URL = 'http://localhost:3001';

interface Props {
  onClose: () => void;
}

export const SettingsPanel: React.FC<Props> = ({ onClose }) => {
  const { user, setUser, accessToken, logout } = useAuthStore();
  const { darkMode, autoStart, zoomFactor, setDarkMode, setAutoStart, zoomIn, zoomOut, resetZoom } =
    useSettingsStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${SERVER_URL}/api/contacts/me`,
        { displayName },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setUser(res.data);
      setMessage('Profil gespeichert!');
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!accessToken) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.post(`${SERVER_URL}/api/media/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (user) {
        setUser({ ...user, avatarUrl: res.data.avatarUrl });
      }
      setMessage('Profilbild aktualisiert!');
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage('Fehler beim Hochladen');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/logout`, {
        refreshToken: useAuthStore.getState().refreshToken,
      });
    } catch {}
    logout();
  };

  const handleCheckUpdate = useCallback(async () => {
    if (!window.electronAPI) return;
    setCheckingUpdate(true);
    setUpdateMsg('');
    try {
      await window.electronAPI.checkForUpdate();
      // Response kommt via onUpdateAvailable / onUpdateNotAvailable Events
      // Wir zeigen nur einen kurzen Hinweis
      setUpdateMsg('Suche nach Updates…');
      setTimeout(() => setUpdateMsg(''), 4000);
    } catch {
      setUpdateMsg('Update-Prüfung fehlgeschlagen');
    } finally {
      setCheckingUpdate(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start animate-fade-in" onClick={onClose}>
      <div
        className="w-80 h-full bg-wa-bg-sidebar border-r border-wa-border shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-4 bg-wa-panel-header">
          <button
            onClick={onClose}
            className="text-wa-icon hover:text-wa-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-wa-text font-semibold">Einstellungen</h2>
        </div>

        <div className="p-4 space-y-6">
          {/* Profile */}
          <section>
            <h3 className="text-wa-text-muted text-xs font-medium uppercase tracking-wider mb-3">Profil</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <ContactAvatar
                  name={user?.displayName || '?'}
                  avatarUrl={user?.avatarUrl}
                  size="lg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }}
                />
              </div>

              <div className="w-full space-y-2">
                <label className="text-wa-text-muted text-xs">Anzeigename</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-wa-input-bg text-wa-text px-3 py-2 rounded-lg text-sm outline-none border border-transparent focus:border-wa-green"
                />
                <p className="text-wa-text-muted text-xs">@{user?.username}</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || !displayName.trim()}
                className="w-full py-2 bg-wa-green hover:bg-wa-green/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Speichern...' : 'Profil speichern'}
              </button>

              {message && (
                <p className="text-wa-green text-sm text-center">{message}</p>
              )}
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-wa-text-muted text-xs font-medium uppercase tracking-wider mb-3">Darstellung</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-wa-text text-sm">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={clsx(
                    'relative w-11 h-6 rounded-full transition-colors',
                    darkMode ? 'bg-wa-green' : 'bg-wa-border'
                  )}
                >
                  <span className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>
            </div>
          </section>

          {/* Zoom (desktop only) */}
          {window.electronAPI && (
            <section>
              <h3 className="text-wa-text-muted text-xs font-medium uppercase tracking-wider mb-3">Zoom</h3>
              <div className="flex gap-2">
                <button
                  onClick={zoomOut}
                  className="flex-1 py-2 bg-wa-hover text-wa-text rounded-lg text-sm hover:bg-wa-border transition-colors"
                >
                  A-
                </button>
                <button
                  onClick={resetZoom}
                  title="Auf 100% zurücksetzen"
                  className="flex-1 py-2 bg-wa-hover text-wa-text rounded-lg text-sm hover:bg-wa-border transition-colors tabular-nums"
                >
                  {Math.round(zoomFactor * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  className="flex-1 py-2 bg-wa-hover text-wa-text rounded-lg text-sm hover:bg-wa-border transition-colors"
                >
                  A+
                </button>
              </div>
            </section>
          )}

          {/* System */}
          {window.electronAPI && (
            <section>
              <h3 className="text-wa-text-muted text-xs font-medium uppercase tracking-wider mb-3">System</h3>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-wa-text text-sm">Autostart</span>
                  <p className="text-wa-text-muted text-xs">Mit Windows starten</p>
                </div>
                <button
                  onClick={() => setAutoStart(!autoStart)}
                  className={clsx(
                    'relative w-11 h-6 rounded-full transition-colors',
                    autoStart ? 'bg-wa-green' : 'bg-wa-border'
                  )}
                >
                  <span className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    autoStart ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>
            </section>
          )}

          {/* Updates */}
          {window.electronAPI && (
            <section>
              <h3 className="text-wa-text-muted text-xs font-medium uppercase tracking-wider mb-3">Updates</h3>
              <div className="space-y-2">
                <button
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate}
                  className="w-full py-2 bg-wa-hover hover:bg-wa-border text-wa-text rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checkingUpdate ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Suche…
                    </>
                  ) : 'Nach Updates suchen'}
                </button>
                {updateMsg && <p className="text-wa-text-muted text-xs text-center">{updateMsg}</p>}
              </div>
            </section>
          )}

          {/* Logout */}
          <section className="pt-4 border-t border-wa-border">
            <button
              onClick={handleLogout}
              className="w-full py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg text-sm font-medium transition-colors"
            >
              Abmelden
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
