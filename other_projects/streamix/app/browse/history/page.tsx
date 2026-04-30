'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

interface HistoryItem {
  id: number;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_rating: number;
  movie_year: number | null;
  watched_at: string;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  // User's watch history sorted by recent first
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Fetch watch history on component mount
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history?limit=50');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  // Delete single item from history
  const removeItem = async (movieId: number) => {
    try {
      await fetch(`/api/history?movieId=${movieId}`, { method: 'DELETE' });
      setHistory((h) => h.filter((i) => i.movie_id !== movieId));
    } catch { /* silent */ }
  };

  // Clear entire watch history with confirmation
  const clearAll = async () => {
    if (!confirm('Clear your entire watch history?')) return;
    setClearing(true);
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistory([]);
    } catch { /* silent */ } finally {
      setClearing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#03171E] pt-24 px-8">
        <div className="h-8 w-48 skeleton rounded mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03171E] pt-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display text-white tracking-wide">Watch History</h1>
            <p className="text-gray-400 text-sm mt-1">{history.length} titles watched</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearAll} disabled={clearing}
              className="text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-4 py-2 rounded transition-colors">
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-white text-xl font-semibold mb-2">No watch history yet</h2>
            <p className="text-gray-400 text-sm mb-6">Start watching movies to build your history</p>
            <Link href="/browse" className="btn-netflix">Browse Movies</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {history.map((item) => (
              <div key={item.id} className="group relative">
                <Link href={`/watch/${item.movie_id}`}>
                  <div className="aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a1a] relative">
                    {item.movie_poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.movie_poster} alt={item.movie_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center p-2">
                        <span className="text-xs text-gray-400">{item.movie_title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
                <button onClick={() => removeItem(item.movie_id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900 z-10"
                  aria-label="Remove">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="mt-1.5 px-0.5">
                  <p className="text-white text-xs font-medium truncate">{item.movie_title}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-gray-500 text-[11px]">{formatDate(item.watched_at)}</span>
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
