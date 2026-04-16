'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import VideoPlayer from '@/components/movie/VideoPlayer';
import MovieRow from '@/components/movie/MovieRow';
import { useAuth } from '@/components/AuthContext';
import { MovieDetails } from '@/lib/tmdb';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/components/AuthContext';

function WatchClientInner({ movie }: { movie: MovieDetails }) {
  const { user } = useAuth();
  // Watchlist and history UI states
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [historyRecorded, setHistoryRecorded] = useState(false);

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  // Extract director from crew list
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');
  const cast = movie.credits?.cast?.slice(0, 5) ?? [];
  // Find official trailer, fallback to any YouTube video
  const trailer = movie.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  ) ?? movie.videos?.results?.find((v) => v.site === 'YouTube');

  // Record movie in watch history when page loads
  useEffect(() => {
    if (!user || historyRecorded) return;
    const record = async () => {
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movie }),
        });
        setHistoryRecorded(true);
      } catch { /* silent */ }
    };
    record();
  }, [user, movie, historyRecorded]);

  // Check if movie already in watchlist on mount
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const res = await fetch('/api/watchlist');
        if (res.ok) {
          const data = await res.json();
          setInWatchlist(data.watchlist?.some((w: { movie_id: number }) => w.movie_id === movie.id));
        }
      } catch { /* silent */ }
    };
    check();
  }, [user, movie.id]);

  // Add/remove from watchlist toggle
  const toggleWatchlist = async () => {
    if (!user) return;
    setWatchlistLoading(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie }),
      });
      const data = await res.json();
      setInWatchlist(data.action === 'added');
    } catch { /* silent */ } finally {
      setWatchlistLoading(false);
    }
  };

  const recommendations = movie.recommendations?.results?.slice(0, 15) ?? [];
  const similar = movie.similar?.results?.slice(0, 15) ?? [];

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-[1400px] mx-auto">
          <VideoPlayer movieId={movie.id} movieTitle={movie.title} />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wide mb-2">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-gray-400 italic text-lg mb-4">&ldquo;{movie.tagline}&rdquo;</p>
            )}

            <div className="flex items-center flex-wrap gap-3 mb-6">
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <span>★</span><span>{movie.vote_average.toFixed(1)}</span>
              </span>
              <span className="text-gray-400 text-sm">({movie.vote_count.toLocaleString()} votes)</span>
              {year && <span className="text-gray-300 text-sm font-medium">{year}</span>}
              {movie.runtime && (
                <span className="text-gray-300 text-sm">
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              <span className="border border-gray-600 text-gray-300 text-xs px-1.5 py-0.5 rounded">HD</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${movie.vote_average >= 7 ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>
                {movie.vote_average >= 7 ? 'CERTIFIED FRESH' : 'GOOD'}
              </span>
            </div>

            {movie.genres && (
              <div className="flex flex-wrap gap-2 mb-5">
                {movie.genres.map((g) => (
                  <span key={g.id} className="genre-tag">{g.name}</span>
                ))}
              </div>
            )}

            <p className="text-gray-300 text-base leading-relaxed mb-6">{movie.overview}</p>

            <div className="flex items-center gap-3 flex-wrap mb-8">
              {user ? (
                <button onClick={toggleWatchlist} disabled={watchlistLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-colors ${
                    inWatchlist
                      ? 'bg-green-700 hover:bg-green-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}>
                  {inWatchlist ? '✓ In My List' : '+ My List'}
                </button>
              ) : (
                <Link href="/login"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded text-sm transition-colors border border-white/20">
                  + My List
                </Link>
              )}

              {trailer && (
                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 text-white font-semibold px-5 py-2.5 rounded text-sm transition-colors border border-red-800/50">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Watch Trailer
                </a>
              )}
            </div>

            <div className="space-y-4">
              {director && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-sm w-20 flex-shrink-0">Director</span>
                  <span className="text-white text-sm font-medium">{director.name}</span>
                </div>
              )}
              {cast.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-sm w-20 flex-shrink-0">Cast</span>
                  <span className="text-white text-sm">{cast.map((c) => c.name).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            {movie.poster_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title}
                className="w-full rounded-lg shadow-2xl" />
            )}
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-12">
            <MovieRow title="More Like This" movies={recommendations} />
          </div>
        )}
        {similar.length > 0 && recommendations.length === 0 && (
          <div className="mt-12">
            <MovieRow title="Similar Movies" movies={similar} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchClient({ movie }: { movie: MovieDetails }) {
  return (
    <AuthProvider>
      <WatchClientInner movie={movie} />
    </AuthProvider>
  );
}
