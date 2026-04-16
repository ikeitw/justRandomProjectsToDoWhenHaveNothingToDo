'use client';

import { useState, useEffect, useRef } from 'react';
import { STREAM_PROVIDERS } from '@/lib/streaming';

interface VideoPlayerProps {
  movieId: number;
  movieTitle: string;
  onError?: () => void;
}

export default function VideoPlayer({ movieId, movieTitle, onError }: VideoPlayerProps) {
  const [providerIndex, setProviderIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgress = useRef<number>(0);

  const currentProvider = STREAM_PROVIDERS[providerIndex];

  // Restore playback position from database on component mount
  useEffect(() => {
    fetch(`/api/progress?movieId=${movieId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.progress && data.progress > 30) setResumeAt(data.progress);
        })
        .catch(() => {});
  }, [movieId]);

  const streamUrl = resumeAt !== null
      ? `${currentProvider?.getUrl(movieId)}?resumeAt=${Math.floor(resumeAt)}`
      : currentProvider?.getUrl(movieId);

  // Listen for progress events from VidAPI player
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'PLAYER_EVENT') return;
      const { player_status, player_progress, player_duration } = e.data.data;

      if (player_status === 'playing' && player_progress) {
        // Debounce saves — only update DB if progress >5s since last save
        if (Math.abs(player_progress - lastSavedProgress.current) < 5) return;
        lastSavedProgress.current = player_progress;

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieId, progress: player_progress, duration: player_duration }),
          }).catch(() => {});
        }, 2000);
      }

      if (player_status === 'completed') {
        // Reset progress when video completes so it starts fresh on next watch
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId, progress: 0, duration: player_duration }),
        }).catch(() => {});
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [movieId]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    // Fail fast if provider doesn't respond in 12s
    timeoutRef.current = setTimeout(() => { handleProviderError(); }, 12000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerIndex]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleProviderError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (providerIndex < STREAM_PROVIDERS.length - 1) {
      setProviderIndex((i) => i + 1);
    } else {
      setError(true);
      setLoading(false);
      onError?.();
    }
  };

  const selectProvider = (index: number) => {
    setProviderIndex(index);
    setShowProviders(false);
    setLoading(true);
    setError(false);
  };

  if (error) {
    return (
        <div className="video-container bg-[#0a0a0a]">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="text-5xl mb-4">🎬</div>
            <h3 className="text-white text-xl font-bold mb-2">Stream Unavailable</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md">
              All streaming sources for <strong className="text-white">{movieTitle}</strong> are currently
              unavailable. This may be a regional restriction or temporary outage.
            </p>
            <button
                onClick={() => { setProviderIndex(0); setError(false); setLoading(true); }}
                className="btn-netflix mb-3"
            >
              Try Again
            </button>
            <p className="text-gray-500 text-xs">Tried {STREAM_PROVIDERS.length} sources</p>
          </div>
        </div>
    );
  }

  return (
      <div className="relative">
        <div className="video-container">
          {loading && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-2 border-netflix-red border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white text-sm font-medium">Loading stream...</p>
                <p className="text-gray-500 text-xs mt-1">Source: {currentProvider?.name}</p>
              </div>
          )}

          <iframe
              ref={iframeRef}
              src={streamUrl}
              title={`${movieTitle} - Stream`}
              allowFullScreen
              allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
              onLoad={handleLoad}
              onError={handleProviderError}
              className="absolute inset-0 w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"
          />
        </div>

        <div className="bg-[#0d0d0d] border-t border-white/5 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">Source:</span>
            <span className="text-gray-300 text-xs font-medium">{currentProvider?.name}</span>
            {loading && <span className="text-yellow-500 text-xs animate-pulse">● Connecting</span>}
            {!loading && !error && <span className="text-green-500 text-xs">● Active</span>}
            {resumeAt && resumeAt > 30 && !loading && (
                <span className="text-blue-400 text-xs">↩ Resumed at {Math.floor(resumeAt / 60)}m {Math.floor(resumeAt % 60)}s</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {providerIndex > 0 && (
                <button onClick={() => selectProvider(providerIndex - 1)}
                        className="text-xs text-gray-400 hover:text-white transition-colors">
                  ← Prev
                </button>
            )}
            {providerIndex < STREAM_PROVIDERS.length - 1 && (
                <button onClick={() => selectProvider(providerIndex + 1)}
                        className="text-xs text-gray-400 hover:text-white transition-colors">
                  Next →
                </button>
            )}
            <div className="relative">
              <button onClick={() => setShowProviders(!showProviders)}
                      className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1 rounded transition-colors">
                Sources ({STREAM_PROVIDERS.length})
              </button>
              {showProviders && (
                  <div className="absolute bottom-full right-0 mb-1 w-48 bg-[#1a1a1a] border border-white/10 rounded shadow-xl py-1 z-50">
                    {STREAM_PROVIDERS.map((provider, idx) => (
                        <button key={idx} onClick={() => selectProvider(idx)}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                                    idx === providerIndex
                                        ? 'text-white bg-netflix-red/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}>
                          <span>{provider.name}</span>
                          {idx === providerIndex && <span className="text-netflix-red">●</span>}
                        </button>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}