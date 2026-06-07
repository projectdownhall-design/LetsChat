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

// LetsChat brand mark: rounded tile + speech bubble with three dots.
// `uid` keeps each instance's gradient id unique to avoid SVG <defs> clashes.
function BrandLogo({ className = '', uid = 'lc' }: { className?: string; uid?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill={`url(#${uid})`} />
      <path d="M20 8C13.373 8 8 13.149 8 19.5C8 22.07 8.9 24.44 10.41 26.34L8.5 32L14.36 30.12C16.12 31.01 18.01 31.5 20 31.5C26.627 31.5 32 26.351 32 20C32 13.649 26.627 8 20 8Z" fill="white" />
      <circle cx="15" cy="20" r="1.8" fill="#25D366" />
      <circle cx="20" cy="20" r="1.8" fill="#25D366" />
      <circle cx="25" cy="20" r="1.8" fill="#25D366" />
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#25D366" />
          <stop offset="1" stopColor="#128C7E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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
    <div className="flex items-center justify-center h-full bg-lc-bg-main">
      <div className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <BrandLogo uid="loginLogo" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg shadow-lc-green/30" />
          <h1 className="text-2xl font-bold text-lc-text">LetsChat</h1>
          <p className="text-lc-text-muted text-sm mt-1">Dein sicherer Messenger</p>
        </div>

        <div className="flex bg-lc-input-bg rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-lc-green text-white' : 'text-lc-text-muted hover:text-lc-text'
            }`}
          >
            Anmelden
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-lc-green text-white' : 'text-lc-text-muted hover:text-lc-text'
            }`}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-lc-text-muted text-xs mb-1 block">Anzeigename</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Dein Name"
                required
                className="w-full bg-lc-input-bg text-lc-text px-4 py-3 rounded-lg text-sm outline-none border border-transparent focus:border-lc-green transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-lc-text-muted text-xs mb-1 block">Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Benutzername"
              required
              autoComplete="username"
              className="w-full bg-lc-input-bg text-lc-text px-4 py-3 rounded-lg text-sm outline-none border border-transparent focus:border-lc-green transition-colors"
            />
          </div>

          <div>
            <label className="text-lc-text-muted text-xs mb-1 block">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-lc-input-bg text-lc-text px-4 py-3 rounded-lg text-sm outline-none border border-transparent focus:border-lc-green transition-colors"
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
            className="w-full py-3 bg-lc-green hover:bg-lc-green/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="flex flex-col items-center justify-center h-full bg-lc-bg-chat">
      <div className="text-center space-y-4">
        <BrandLogo uid="welcomeLogo" className="w-24 h-24 mx-auto rounded-2xl" />
        <h2 className="text-lc-text text-2xl font-light">LetsChat für Windows</h2>
        <p className="text-lc-text-muted text-sm max-w-xs">
          Wähle einen Chat aus oder starte eine neue Konversation
        </p>
        <div className="flex items-center gap-2 text-lc-text-muted text-xs mt-6">
          <svg className="w-4 h-4 text-lc-green" fill="currentColor" viewBox="0 0 20 20">
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
    <div className="flex items-center justify-between h-8 bg-lc-bg-main px-2 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-2 text-lc-text-muted text-xs pl-2">
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
        <span className="text-lc-green font-semibold">LetsChat</span>
      </div>
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="w-10 h-8 flex items-center justify-center text-lc-text-muted hover:text-lc-text hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 10 1">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center text-lc-text-muted hover:text-lc-text hover:bg-white/10 transition-colors"
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
          className="w-10 h-8 flex items-center justify-center text-lc-text-muted hover:text-white hover:bg-red-600 transition-colors"
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
      <div className="flex flex-col h-screen bg-lc-bg-main overflow-hidden">
        <TitleBar />
        <TermsOfService onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-lc-bg-main overflow-hidden">
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
