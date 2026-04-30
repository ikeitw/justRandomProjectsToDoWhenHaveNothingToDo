'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

interface WatchlistItem {
  id: number;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_rating: number;
  movie_year: number | null;
  movie_genre: string | null;
  added_at: string;
}

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  // User's saved movies/shows
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Fetch watchlist from API on mount
  useEffect(() => {
    if (!user) return;
    const fetchWatchlist = async () => {
      try {
        const res = await fetch('/api/watchlist');
        if (res.ok) {
          const data = await res.json();
          setWatchlist(data.watchlist || []);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [user]);

  // Remove movie from watchlist (toggle action)
  const removeItem = async (movieId: number, movieData: WatchlistItem) => {
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie: {
            id: movieId,
            title: movieData.movie_title,
            poster_path: null,
            backdrop_path: null,
            vote_average: movieData.movie_rating,
            release_date: movieData.movie_year ? `${movieData.movie_year}-01-01` : null,
          },
        }),
      });
      setWatchlist((w) => w.filter((i) => i.movie_id !== movieId));
    } catch { /* silent */ }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#03171E] pt-24 px-8">
        <div className="h-8 w-32 skeleton rounded mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03171E] pt-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display text-white tracking-wide">My List</h1>
          <p className="text-gray-400 text-sm mt-1">{watchlist.length} saved titles</p>
        </div>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-white text-xl font-semibold mb-2">Your list is empty</h2>
            <p className="text-gray-400 text-sm mb-6">Browse movies and click &ldquo;+ My List&rdquo; to save them here</p>
            <Link href="/browse" className="btn-netflix">Browse Movies</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((item) => (
              <div key={item.id} className="group relative">
                <Link href={`/watch/${item.movie_id}`}>
                  <div className="aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a1a] relative">
                    {item.movie_poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.movie_poster} alt={item.movie_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="text-xs text-gray-400">{item.movie_title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
                <button onClick={() => removeItem(item.movie_id, item)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900 z-10"
                  aria-label="Remove from list">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="mt-1.5 px-0.5">
                  <p className="text-white text-xs font-medium truncate">{item.movie_title}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    {item.movie_year && <span className="text-gray-500 text-[11px]">{item.movie_year}</span>}
                    {item.movie_rating > 0 && (
                      <span className="text-yellow-400 text-[11px]">★ {Number(item.movie_rating).toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
