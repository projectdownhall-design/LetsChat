import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { useSocket } from './hooks/useSocket';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { UpdateNotification } from './components/UpdateNotification';
import { TermsOfService } from './components/TermsOfService';
import { Contact, Chat } from './store/chatStore';

const SERVER_URL = 'http://localhost:3001';

// Configure axios defaults
axios.defaults.baseURL = SERVER_URL;

// Token refresh interceptor
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    if (err.response?.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setAccessToken, logout } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return Promise.reject(err);
      }

      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken } = res.data;
        setAccessToken(accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { username, password }
        : { username, password, displayName };

      const res = await axios.post(endpoint, payload);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-wa-bg-main">
      <div className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-wa-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-wa-green/30">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-wa-text">LetsChat</h1>
          <p className="text-wa-text-muted text-sm mt-1">Dein sicherer Messenger</p>
        </div>

        <div className="flex bg-wa-input-bg rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-wa-green text-white' : 'text-wa-text-muted hover:text-wa-text'
            }`}
          >
            Anmelden
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-wa-green text-white' : 'text-wa-text-muted hover:text-wa-text'
            }`}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-wa-text-muted text-xs mb-1 block">Anzeigename</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Dein Name"
                required
                className="w-full bg-wa-input-bg text-wa-text px-4 py-3 rounded-lg text-sm outline-none border border-transparent focus:border-wa-green transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-wa-text-muted text-xs mb-1 block">Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Benutzername"
              required
              autoComplete="username"
              className="w-full bg-wa-input-bg text-wa-text px-4 py-3 rounded-lg text-sm outline-none border border-transparent focus:border-wa-green transition-colors"
            />
          </div>

          <div>
            <label className="text-wa-text-muted text-xs mb-1 block">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-wa-input-bg text-wa-text px-4 py-3 rounded-lg text-sm outline-none border border-transparent focus:border-wa-green transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-wa-green hover:bg-wa-green/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bitte warten...' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-wa-bg-chat">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-wa-green/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-14 h-14 text-wa-green" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <h2 className="text-wa-text text-2xl font-light">LetsChat für Windows</h2>
        <p className="text-wa-text-muted text-sm max-w-xs">
          Wähle einen Chat aus oder starte eine neue Konversation
        </p>
        <div className="flex items-center gap-2 text-wa-text-muted text-xs mt-6">
          <svg className="w-4 h-4 text-wa-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Ende-zu-Ende-verschlüsselt
        </div>
      </div>
    </div>
  );
}

function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximize();
      setMaximized(await window.electronAPI.isMaximized());
    }
  };

  if (!window.electronAPI) return null;

  return (
    <div className="flex items-center justify-between h-8 bg-wa-bg-main px-2 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-2 text-wa-text-muted text-xs pl-2">
        <svg width="18" height="18" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="url(#tbGrad)"/>
          <path d="M20 8C13.373 8 8 13.149 8 19.5C8 22.07 8.9 24.44 10.41 26.34L8.5 32L14.36 30.12C16.12 31.01 18.01 31.5 20 31.5C26.627 31.5 32 26.351 32 20C32 13.649 26.627 8 20 8Z" fill="white"/>
          <circle cx="15" cy="20" r="1.8" fill="#25D366"/>
          <circle cx="20" cy="20" r="1.8" fill="#25D366"/>
          <circle cx="25" cy="20" r="1.8" fill="#25D366"/>
          <defs>
            <linearGradient id="tbGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#25D366"/>
              <stop offset="1" stopColor="#128C7E"/>
            </linearGradient>
          </defs>
        </svg>
        <span className="text-wa-green font-semibold">LetsChat</span>
      </div>
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="w-10 h-8 flex items-center justify-center text-wa-text-muted hover:text-wa-text hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 10 1">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center text-wa-text-muted hover:text-wa-text hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 10 10" strokeWidth="1">
            {maximized ? (
              <path d="M0 3h7v7H0zM3 0h7v7" />
            ) : (
              <rect width="9" height="9" x=".5" y=".5" />
            )}
          </svg>
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="w-10 h-8 flex items-center justify-center text-wa-text-muted hover:text-white hover:bg-red-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 10 10">
            <path d="M10 .7L9.3 0 5 4.3.7 0 0 .7 4.3 5 0 9.3l.7.7L5 5.7 9.3 10l.7-.7L5.7 5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const { chats, contacts, activeChat, setContacts, setActiveChat, getOrCreateChat } = useChatStore();
  const initSettings = useSettingsStore(s => s.initSettings);

  const [termsAccepted, setTermsAccepted] = useState<boolean>(
    () => localStorage.getItem('terms_accepted') === 'true'
  );

  useSocket();

  // Restore persisted settings (theme, zoom, autostart) on startup.
  useEffect(() => {
    initSettings();
  }, [initSettings]);

  const handleAcceptTerms = useCallback(() => {
    localStorage.setItem('terms_accepted', 'true');
    window.electronAPI?.storeSet('terms_accepted', true);
    setTermsAccepted(true);
  }, []);

  const handleDeclineTerms = useCallback(() => {
    if (window.electronAPI) window.electronAPI.quitApp();
    else window.close();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const loadContacts = async () => {
      try {
        const res = await axios.get('/api/contacts', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setContacts(res.data);
      } catch (err) {
        console.error('Load contacts error:', err);
      }
    };

    loadContacts();
  }, [isAuthenticated, accessToken]);

  const handleChatSelect = useCallback((chat: Chat) => {
    setActiveChat(chat);
  }, [setActiveChat]);

  const handleNewChat = useCallback((contact: Contact) => {
    if (!user) return;
    const chat = getOrCreateChat(contact, user.id);
    setActiveChat(chat);
  }, [user, getOrCreateChat, setActiveChat]);

  if (!termsAccepted) {
    return (
      <div className="flex flex-col h-screen bg-wa-bg-main overflow-hidden">
        <TitleBar />
        <TermsOfService onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-wa-bg-main overflow-hidden">
      <TitleBar />
      <UpdateNotification />

      {!isAuthenticated ? (
        <LoginScreen />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[320px] min-w-[280px] flex-shrink-0 flex flex-col">
            <ChatList
              chats={chats}
              contacts={contacts}
              activeChat={activeChat}
              onChatSelect={handleChatSelect}
              onNewChat={handleNewChat}
            />
          </div>

          <div className="flex-1 overflow-hidden">
            {activeChat ? (
              <ChatWindow chat={activeChat} />
            ) : (
              <WelcomeScreen />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
