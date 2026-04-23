'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { movieEmbedUrl, tvEmbedUrl } from '@/lib/vidapi';

interface VideoPlayerProps {
  tmdbId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  // TV-specific
  season?: number;
  episode?: number;
  totalEpisodes?: number;
  onNextEpisode?: () => void;
  onEpisodeChange?: (season: number, episode: number) => void;
}

export default function VideoPlayer({
  tmdbId,
  title,
  mediaType,
  season = 1,
  episode = 1,
  totalEpisodes,
  onNextEpisode,
  onEpisodeChange,
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [showNextBanner, setShowNextBanner] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgress = useRef<number>(0);

  // Unique key for progress storage — episode-aware for TV
  const progressKey = mediaType === 'tv'
    ? `${tmdbId}_s${season}e${episode}`
    : String(tmdbId);

  // Restore playback position from DB
  useEffect(() => {
    fetch(`/api/progress?movieId=${progressKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.progress && data.progress > 30) setResumeAt(data.progress);
        else setResumeAt(null);
      })
      .catch(() => setResumeAt(null));
  }, [progressKey]);

  // Build embed URL
  const streamUrl =
    mediaType === 'tv'
      ? tvEmbedUrl(tmdbId, season, episode, {
          resumeAt: resumeAt ?? undefined,
          color: '#00A0EC',
          lang: 'en',
        })
      : movieEmbedUrl(tmdbId, {
          resumeAt: resumeAt ?? undefined,
          color: '#00A0EC',
          lang: 'en',
        });

  // Listen for postMessage events from VidAPI player
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'PLAYER_EVENT') return;
      const { player_status, player_progress, player_duration } = e.data.data;

      if (player_status === 'playing' && player_progress) {
        if (Math.abs(player_progress - lastSavedProgress.current) < 5) return;
        lastSavedProgress.current = player_progress;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              movieId: progressKey,
              progress: player_progress,
              duration: player_duration,
            }),
          }).catch(() => {});
        }, 2000);
      }

      if (player_status === 'completed') {
        // Reset progress for this episode
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId: progressKey, progress: 0, duration: player_duration }),
        }).catch(() => {});

        // Show next episode banner for TV
        if (mediaType === 'tv' && onNextEpisode) {
          setShowNextBanner(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [progressKey, mediaType, onNextEpisode]);

  // Reset loading state when episode changes
  useEffect(() => {
    setLoading(true);
    setError(false);
    setShowNextBanner(false);
    lastSavedProgress.current = 0;
    timeoutRef.current = setTimeout(() => {
      setError(true);
      setLoading(false);
    }, 15000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [tmdbId, season, episode]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setError(true);
    setLoading(false);
  };

  const retry = () => {
    setError(false);
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = streamUrl;
    }
  };

  if (error) {
    return (
      <div className="video-container bg-[#0a0a0a]">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="text-5xl mb-4">{mediaType === 'tv' ? '📺' : '🎬'}</div>
          <h3 className="text-white text-xl font-bold mb-2">Stream Unavailable</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md">
            <strong className="text-white">{title}</strong>
            {mediaType === 'tv' && ` S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`}
            {' '}is temporarily unavailable.
          </p>
          <button onClick={retry} className="btn-netflix">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="video-container">
        {loading && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-2 border-[#00A0EC] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-sm font-medium">Loading stream…</p>
            {mediaType === 'tv' && (
              <p className="text-gray-500 text-xs mt-1">
                Season {season} · Episode {episode}
              </p>
            )}
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={streamUrl}
          title={`${title} — Stream`}
          allowFullScreen
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          onLoad={handleLoad}
          onError={handleError}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"
        />

        {/* Next episode banner */}
        {showNextBanner && onNextEpisode && (
          <div className="absolute bottom-4 right-4 z-20 bg-[#0d2630] border border-[#00A0EC]/50 rounded-lg p-4 shadow-xl flex items-center gap-4">
            <div>
              <p className="text-white text-sm font-semibold">Episode finished!</p>
              <p className="text-[#7a9caa] text-xs">
                Next: S{season.toString().padStart(2, '0')}E{(episode + 1).toString().padStart(2, '0')}
              </p>
            </div>
            <button
              onClick={() => { setShowNextBanner(false); onNextEpisode(); }}
              className="bg-[#00A0EC] hover:bg-[#0088cc] text-white font-bold text-xs px-4 py-2 rounded transition-colors"
            >
              Play Next →
            </button>
            <button
              onClick={() => setShowNextBanner(false)}
              className="text-[#7a9caa] hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-[#0d0d0d] border-t border-white/5 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-500">Source:</span>
          <span className="text-gray-300 font-medium">VidAPI</span>
          {loading && <span className="text-yellow-500 animate-pulse">● Connecting</span>}
          {!loading && !error && <span className="text-green-500">● Active</span>}
          {resumeAt && resumeAt > 30 && !loading && (
            <span className="text-[#00A0EC]">
              ↩ Resumed at {Math.floor(resumeAt / 60)}m {Math.floor(resumeAt % 60)}s
            </span>
          )}
        </div>
        {mediaType === 'tv' && (
          <span className="text-gray-500">
            S{season.toString().padStart(2, '0')} E{episode.toString().padStart(2, '0')}
            {totalEpisodes ? ` / ${totalEpisodes}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
