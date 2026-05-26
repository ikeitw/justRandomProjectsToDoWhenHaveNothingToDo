'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MovieCard from '@/components/movie/MovieCard';
import CTA from '@/components/ui/CTA';
import { MediaItem } from '@/lib/vidapi';

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
  'Music', 'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
];

type SortOption = 'latest' | 'trending' | 'rating-desc' | 'title-asc' | 'title-desc' | 'oldest';

const SORT_LABELS: Record<SortOption, string> = {
  'latest':      'Latest',
  'trending':    'Trending',
  'rating-desc': 'Top Rated',
  'title-asc':   'A – Z',
  'title-desc':  'Z – A',
  'oldest':      'Oldest',
};

function sortItems(items: MediaItem[], sort: SortOption): MediaItem[] {
  const arr = [...items];
  switch (sort) {
    case 'latest':      return arr.sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));
    case 'oldest':      return arr.sort((a, b) => parseInt(a.year || '9999') - parseInt(b.year || '9999'));
    case 'trending':    return arr.sort((a, b) => b.popularity - a.popularity);
    case 'rating-desc': return arr.sort((a, b) => b.rating - a.rating);
    case 'title-asc':   return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':  return arr.sort((a, b) => b.title.localeCompare(a.title));
    default:            return arr;
  }
}

function filterByGenre(items: MediaItem[], genre: string | null): MediaItem[] {
  if (!genre) return items;
  return items.filter((m) => m.genre.toLowerCase().includes(genre.toLowerCase()));
}

export default function MoviesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q           = searchParams.get('q') ?? '';
  const activeGenre = searchParams.get('genre') ?? '';
  const activeSort  = (searchParams.get('sort') as SortOption) ?? 'latest';

  const [allItems, setAllItems]         = useState<MediaItem[]>([]);
  const [apiPage, setApiPage]           = useState(1);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [loading, setLoading]           = useState(false);
  const fetchingRef                     = useRef(false);
  const loaderRef                       = useRef<HTMLDivElement>(null);
  const genreStripRef                   = useRef<HTMLDivElement>(null);

  const fetchMore = useCallback(async (page: number, reset: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({ mediaType: 'movies', page: String(page) });
      if (q) params.set('q', q);
      const res  = await fetch(`/api/movies?${params}`);
      const data = await res.json();
      const results: MediaItem[] = data.results ?? [];
      setApiTotalPages(data.total_pages ?? 1);
      setAllItems((prev) => reset ? results : [...prev, ...results]);
    } catch { /* silent */ } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [q]);

  useEffect(() => {
    setAllItems([]);
    setApiPage(1);
    fetchMore(1, true);
  }, [q, fetchMore]);

  useEffect(() => {
    if (apiPage === 1) return;
    fetchMore(apiPage, false);
  }, [apiPage, fetchMore]);

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

  const displayed = sortItems(filterByGenre(allItems, activeGenre || null), activeSort);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`/browse/movies?${p}`, { scroll: false });
  };

  const clearFilters = () => router.replace('/browse/movies', { scroll: false });
  const hasFilters   = !!(activeGenre || (activeSort && activeSort !== 'latest') || q);

  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--oled)' }}>
      <div className="px-4 sm:px-8 max-w-[1800px] mx-auto pb-16">

        {/* Page header */}
        <div className="pt-8 pb-5 flex items-end justify-between gap-4 flex-wrap border-b" style={{ borderColor: 'var(--hairline)' }}>
          <div>
            <p
              className="mb-1 text-[10px] tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--dim)' }}
            >
              Browse
            </p>
            <h1
              className="leading-none"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                color: 'var(--ivory)',
              }}
            >
              Movies
            </h1>
          </div>
          <div className="flex items-center gap-3 pb-1">
            {displayed.length > 0 && (
              <span
                className="text-[11px] tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--dim)' }}
              >
                {displayed.length} titles
              </span>
            )}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] px-3 py-1.5 border transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--ivory)]"
                style={{ borderColor: 'var(--hairline)', color: 'var(--dim)', fontFamily: 'var(--font-mono)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Sort strip */}
        <div className="flex items-center gap-1 py-3 border-b" style={{ borderColor: 'var(--hairline)' }}>
          {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => setParam('sort', s === 'latest' ? '' : s)}
              className="px-3 py-1.5 text-[11px] tracking-[0.1em] uppercase transition-all border"
              style={{
                fontFamily: 'var(--font-mono)',
                background: activeSort === s ? 'var(--ivory)' : 'transparent',
                color: activeSort === s ? 'var(--oled)' : 'var(--dim)',
                borderColor: activeSort === s ? 'var(--ivory)' : 'transparent',
              }}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Genre strip — horizontally scrollable, no scrollbar */}
        <div
          ref={genreStripRef}
          className="flex items-center gap-1.5 py-3 border-b overflow-x-auto scrollbar-none"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <button
            onClick={() => setParam('genre', '')}
            className="flex-shrink-0 px-3 py-1 text-[11px] tracking-[0.08em] uppercase transition-all border"
            style={{
              fontFamily: 'var(--font-mono)',
              background: !activeGenre ? 'var(--accent)' : 'transparent',
              color: !activeGenre ? 'var(--oled)' : 'var(--dim)',
              borderColor: !activeGenre ? 'var(--accent)' : 'var(--hairline)',
            }}
          >
            All
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setParam('genre', activeGenre === g ? '' : g)}
              className="flex-shrink-0 px-3 py-1 text-[11px] tracking-[0.08em] uppercase transition-all border"
              style={{
                fontFamily: 'var(--font-mono)',
                background: activeGenre === g ? 'var(--accent)' : 'transparent',
                color: activeGenre === g ? 'var(--oled)' : 'var(--dim)',
                borderColor: activeGenre === g ? 'var(--accent)' : 'var(--hairline)',
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Search context */}
        {q && (
          <p className="pt-3 text-[var(--dim)] text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
            Results for &ldquo;<span style={{ color: 'var(--ivory)' }}>{q}</span>&rdquo;
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-3 pt-5">
          {displayed.map((movie) => (
            <MovieCard key={`${movie.id}-${movie.type}`} movie={movie} size="md" />
          ))}
          {loading && Array.from({ length: 16 }).map((_, i) => (
            <div key={`sk-${i}`} className="w-full aspect-[2/3] skeleton" />
          ))}
        </div>

        {/* Empty states */}
        {!loading && displayed.length === 0 && allItems.length > 0 && (
          <div className="text-center py-24">
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '2rem', color: 'var(--dim)' }} className="mb-3">
              No Results
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--dim)' }}>
              Nothing matches this genre in the current dataset
            </p>
            <CTA onClick={clearFilters} variant="accent" size="sm">Clear Filters</CTA>
          </div>
        )}

        {!loading && allItems.length === 0 && !loading && (
          <div className="text-center py-24">
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '2rem', color: 'var(--dim)' }} className="mb-3">
              No Movies Found
            </p>
            <p className="text-sm" style={{ color: 'var(--dim)' }}>Try a different search term</p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} className="h-10 mt-8 flex items-center justify-center">
          {loading && allItems.length > 0 && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 animate-bounce"
                  style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
          {!loading && apiPage >= apiTotalPages && allItems.length > 0 && (
            <p
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--dimmer)' }}
            >
              — end of results —
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
