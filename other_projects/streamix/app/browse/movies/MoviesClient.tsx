'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MovieCard from '@/components/movie/MovieCard';
import { MediaItem } from '@/lib/vidapi';

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance',
  'Animation', 'Sci-Fi', 'Adventure', 'Mystery', 'Documentary',
  'Fantasy', 'Crime', 'Family', 'History', 'Music', 'War',
];

type SortOption = 'latest' | 'oldest' | 'rating-desc' | 'rating-asc' | 'title-asc' | 'title-desc';

const SORT_LABELS: Record<SortOption, string> = {
  'latest': '🆕 Newest First',
  'oldest': '📅 Oldest First',
  'rating-desc': '⭐ Best Rating',
  'rating-asc': '↓ Lowest Rating',
  'title-asc': '🔤 A → Z',
  'title-desc': '🔤 Z → A',
};

function sortItems(items: MediaItem[], sort: SortOption): MediaItem[] {
  const arr = [...items];
  switch (sort) {
    case 'latest':
      // Sort by year descending (newest release year first)
      return arr.sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));
    case 'oldest':
      return arr.sort((a, b) => parseInt(a.year || '9999') - parseInt(b.year || '9999'));
    case 'rating-desc':
      return arr.sort((a, b) => b.rating - a.rating);
    case 'rating-asc':
      return arr.sort((a, b) => a.rating - b.rating);
    case 'title-asc':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return arr.sort((a, b) => b.title.localeCompare(a.title));
    default: return arr;
  }
}

function filterByGenre(items: MediaItem[], genre: string | null): MediaItem[] {
  if (!genre) return items;
  return items.filter((m) =>
    m.genre.toLowerCase().includes(genre.toLowerCase())
  );
}

export default function MoviesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get('q') ?? '';
  const activeGenre = searchParams.get('genre') ?? '';
  const activeSort = (searchParams.get('sort') as SortOption) ?? 'latest';
  const minRating = parseFloat(searchParams.get('minRating') ?? '0');

  // All fetched items (raw from API, many pages buffered)
  const [allItems, setAllItems] = useState<MediaItem[]>([]);
  const [apiPage, setApiPage] = useState(1);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const fetchingRef = useRef(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Fetch next page of raw data from API
  const fetchMore = useCallback(async (page: number, reset: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({ mediaType: 'movies', page: String(page) });
      if (q) params.set('q', q);
      const res = await fetch(`/api/movies?${params}`);
      const data = await res.json();
      const results: MediaItem[] = data.results ?? [];
      setApiTotalPages(data.total_pages ?? 1);
      setAllItems((prev) => reset ? results : [...prev, ...results]);
    } catch { /* silent */ } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [q]);

  // Reset when search changes
  useEffect(() => {
    setAllItems([]);
    setApiPage(1);
    fetchMore(1, true);
  }, [q, fetchMore]);

  // Load more pages
  useEffect(() => {
    if (apiPage === 1) return;
    fetchMore(apiPage, false);
  }, [apiPage, fetchMore]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchingRef.current && apiPage < apiTotalPages) {
          setApiPage((p) => p + 1);
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [apiPage, apiTotalPages]);

  // Apply filters + sort client-side
  const filtered = filterByGenre(
    allItems.filter((m) => {
      if (minRating > 0 && m.rating < minRating) return false;
      return true;
    }),
    activeGenre || null
  );
  const displayed = sortItems(filtered, activeSort);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`/browse/movies?${p}`, { scroll: false });
  };

  const clearFilters = () => {
    router.replace('/browse/movies', { scroll: false });
  };

  const hasFilters = activeGenre || activeSort !== 'latest' || minRating > 0 || q;

  return (
    <div className="min-h-screen bg-[#03171E] pt-16">
      <div className="px-4 sm:px-8 max-w-[1800px] mx-auto pb-16">

        {/* Header */}
        <div className="pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white font-semibold text-xl flex items-center gap-2">
              🎬 Movies
              {displayed.length > 0 && (
                <span className="text-[#7a9caa] text-sm font-normal">{displayed.length} titles</span>
              )}
            </h1>
            {q && <p className="text-[#7a9caa] text-sm mt-0.5">Search: &ldquo;{q}&rdquo;</p>}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearFilters}
                className="text-xs text-[#7a9caa] hover:text-white border border-[#1e4a5c] hover:border-[#00A0EC]/50 px-3 py-1.5 rounded transition-colors">
                Clear filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                showFilters || hasFilters
                  ? 'bg-[#00A0EC]/10 text-[#00A0EC] border-[#00A0EC]/40'
                  : 'text-[#7a9caa] border-[#1e4a5c] hover:text-white hover:border-[#00A0EC]/50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2M15 16H9" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#0d2630] border border-[#1e4a5c] rounded-lg p-4 mb-6 space-y-4">
            {/* Sort */}
            <div>
              <p className="text-[#7a9caa] text-[10px] uppercase tracking-widest font-semibold mb-2">Sort By</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                  <button key={s} onClick={() => setParam('sort', s === 'latest' ? '' : s)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                      activeSort === s
                        ? 'bg-[#00A0EC] text-white border-[#00A0EC]'
                        : 'bg-[#03171E] text-[#7a9caa] border-[#1e4a5c] hover:text-white hover:border-[#00A0EC]/50'
                    }`}
                  >
                    {SORT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <p className="text-[#7a9caa] text-[10px] uppercase tracking-widest font-semibold mb-2">
                Min Rating: <span className="text-yellow-400">{minRating > 0 ? `★ ${minRating}+` : 'Any'}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[0, 5, 6, 7, 7.5, 8, 8.5, 9].map((r) => (
                  <button key={r} onClick={() => setParam('minRating', r > 0 ? String(r) : '')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                      minRating === r
                        ? 'bg-yellow-600 text-white border-yellow-600'
                        : 'bg-[#03171E] text-[#7a9caa] border-[#1e4a5c] hover:text-white hover:border-yellow-600/50'
                    }`}
                  >
                    {r === 0 ? 'Any' : `★ ${r}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre */}
            <div>
              <p className="text-[#7a9caa] text-[10px] uppercase tracking-widest font-semibold mb-2">Genre</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setParam('genre', '')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                    !activeGenre
                      ? 'bg-[#00A0EC] text-white border-[#00A0EC]'
                      : 'bg-[#03171E] text-[#7a9caa] border-[#1e4a5c] hover:text-white hover:border-[#00A0EC]/50'
                  }`}
                >
                  All
                </button>
                {GENRES.map((g) => (
                  <button key={g} onClick={() => setParam('genre', activeGenre === g ? '' : g)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                      activeGenre === g
                        ? 'bg-[#00A0EC] text-white border-[#00A0EC]'
                        : 'bg-[#03171E] text-[#7a9caa] border-[#1e4a5c] hover:text-white hover:border-[#00A0EC]/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {(activeGenre || activeSort !== 'latest' || minRating > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeGenre && (
              <span className="flex items-center gap-1 bg-[#00A0EC]/10 text-[#00A0EC] text-xs px-2.5 py-1 rounded border border-[#00A0EC]/30">
                {activeGenre}
                <button onClick={() => setParam('genre', '')} className="ml-1 hover:text-white">✕</button>
              </span>
            )}
            {activeSort !== 'latest' && (
              <span className="flex items-center gap-1 bg-[#00A0EC]/10 text-[#00A0EC] text-xs px-2.5 py-1 rounded border border-[#00A0EC]/30">
                {SORT_LABELS[activeSort]}
                <button onClick={() => setParam('sort', '')} className="ml-1 hover:text-white">✕</button>
              </span>
            )}
            {minRating > 0 && (
              <span className="flex items-center gap-1 bg-yellow-600/10 text-yellow-400 text-xs px-2.5 py-1 rounded border border-yellow-600/30">
                ★ {minRating}+
                <button onClick={() => setParam('minRating', '')} className="ml-1 hover:text-white">✕</button>
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
          {displayed.map((movie) => (
            <MovieCard key={`${movie.id}-${movie.type}`} movie={movie} size="md" />
          ))}
          {loading && Array.from({ length: 16 }).map((_, i) => (
            <div key={`sk-${i}`} className="w-full aspect-[2/3] skeleton rounded" />
          ))}
        </div>

        {!loading && displayed.length === 0 && allItems.length > 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-white font-semibold text-lg mb-1">No matches for these filters</p>
            <p className="text-[#7a9caa] text-sm mb-4">Try adjusting your genre, rating, or sort options</p>
            <button onClick={clearFilters} className="btn-netflix text-sm px-5 py-2">Clear Filters</button>
          </div>
        )}

        {!loading && allItems.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-white font-semibold text-lg mb-1">No movies found</p>
            <p className="text-[#7a9caa] text-sm">Try a different search</p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} className="h-10 mt-8 flex items-center justify-center">
          {loading && allItems.length > 0 && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#00A0EC] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          {!loading && apiPage >= apiTotalPages && allItems.length > 0 && (
            <p className="text-[#7a9caa] text-xs">— end of results —</p>
          )}
        </div>
      </div>
    </div>
  );
}
