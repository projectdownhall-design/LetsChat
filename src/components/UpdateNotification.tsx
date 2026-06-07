import React, { useEffect, useState, useCallback } from 'react';

type UpdateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available';   version: string; releaseNotes: string }
  | { phase: 'downloading'; percent: number; bytesPerSecond: number }
  | { phase: 'ready';       version: string }
  | { phase: 'error';       message: string }
  | { phase: 'up-to-date' };

function formatSpeed(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} MB/s`;
  if (bps >= 1_000)     return `${(bps / 1_000).toFixed(0)} KB/s`;
  return `${bps} B/s`;
}

export function UpdateNotification() {
  const [state, setState] = useState<UpdateState>({ phase: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onUpdateChecking(()        => setState({ phase: 'checking' }));
    window.electronAPI.onUpdateNotAvailable(()    => {
      setState({ phase: 'up-to-date' });
      setTimeout(() => setState({ phase: 'idle' }), 3000);
    });
    window.electronAPI.onUpdateAvailable((info)   => {
      setDismissed(false);
      setState({ phase: 'available', version: info.version, releaseNotes: String(info.releaseNotes || '') });
    });
    window.electronAPI.onUpdateDownloadProgress((p) =>
      setState({ phase: 'downloading', percent: p.percent, bytesPerSecond: p.bytesPerSecond })
    );
    window.electronAPI.onUpdateDownloaded((info)  => setState({ phase: 'ready', version: info.version }));
    window.electronAPI.onUpdateError((msg)        => {
      setState({ phase: 'error', message: msg });
      setTimeout(() => setState({ phase: 'idle' }), 6000);
    });

    return () => window.electronAPI?.removeUpdateListeners();
  }, []);

  const handleDownload = useCallback(async () => {
    setState(s => s.phase === 'available' ? { phase: 'downloading', percent: 0, bytesPerSecond: 0 } : s);
    await window.electronAPI?.downloadUpdate();
  }, []);

  const handleInstall = useCallback(() => {
    window.electronAPI?.installUpdate();
  }, []);

  const handleCheck = useCallback(async () => {
    setState({ phase: 'checking' });
    await window.electronAPI?.checkForUpdate();
  }, []);

  if (dismissed || state.phase === 'idle' || state.phase === 'checking') return null;

  // ── Up to date ──
  if (state.phase === 'up-to-date') {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c26] border border-[#25D366]/30 rounded-2xl shadow-xl text-sm text-[#e8f0ed]">
          <span className="text-[#25D366] text-base">✓</span>
          LetsChat ist aktuell
        </div>
      </div>
    );
  }

  // ── Error ──
  if (state.phase === 'error') {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#2a1a1a] border border-red-500/30 rounded-2xl shadow-xl text-sm text-[#e8f0ed]">
          <span className="text-red-400 text-base">⚠</span>
          <span>Update-Fehler: {state.message.slice(0, 60)}</span>
          <button onClick={() => setState({ phase: 'idle' })} className="ml-1 text-[#7a9488] hover:text-white">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 animate-slide-up">
      <div className="bg-[#1a2420] border border-[#25D366]/25 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v14M6 10l6 6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 20h16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#e8f0ed] text-sm font-semibold">
              {state.phase === 'available'   && `Update verfügbar – v${state.version}`}
              {state.phase === 'downloading' && 'Wird heruntergeladen…'}
              {state.phase === 'ready'       && `Bereit zur Installation – v${state.version}`}
            </div>
            <div className="text-[#7a9488] text-xs mt-0.5">LetsChat</div>
          </div>
          {state.phase === 'available' && (
            <button onClick={() => setDismissed(true)} className="text-[#7a9488] hover:text-[#e8f0ed] transition-colors flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">

          {/* Available */}
          {state.phase === 'available' && (
            <>
              {state.releaseNotes && (
                <p className="text-[#7a9488] text-xs leading-relaxed line-clamp-3">
                  {state.releaseNotes.replace(/<[^>]*>/g, '').slice(0, 120)}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
                >
                  Herunterladen
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="px-4 py-2 rounded-xl text-sm text-[#7a9488] hover:text-[#e8f0ed] hover:bg-white/5 transition-colors"
                >
                  Später
                </button>
              </div>
            </>
          )}

          {/* Downloading */}
          {state.phase === 'downloading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#7a9488]">
                <span>{state.percent}%</span>
                <span>{formatSpeed(state.bytesPerSecond)}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${state.percent}%`,
                    background: 'linear-gradient(90deg,#25D366,#128C7E)',
                  }}
                />
              </div>
              <p className="text-[#7a9488] text-xs">Bitte warten…</p>
            </div>
          )}

          {/* Ready to install */}
          {state.phase === 'ready' && (
            <>
              <p className="text-[#7a9488] text-xs">
                Das Update wurde heruntergeladen und kann jetzt installiert werden. Die App wird dazu neu gestartet.
              </p>
              <button
                onClick={handleInstall}
                className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
              >
                Jetzt neu starten &amp; installieren
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Exportiere auch eine manuelle Check-Funktion für das SettingsPanel
export function useUpdateChecker() {
  return useCallback(async () => {
    await window.electronAPI?.checkForUpdate();
  }, []);
}
