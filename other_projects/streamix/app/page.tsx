'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MovieCard from '@/components/movie/MovieCard';
import { MediaItem } from '@/lib/vidapi';

type MediaType = 'movies' | 'series';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get('q');
  const typeParam = searchParams.get('type');
  const mediaParam = (searchParams.get('media') as MediaType) ?? 'movies';

  const [mediaType, setMediaType] = useState<MediaType>(mediaParam);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  const buildUrl = (pg: number, mt: MediaType) => {
    const p = new URLSearchParams();
    p.set('page', String(pg));
    p.set('mediaType', mt);
    if (q) p.set('q', q);
    return `/api/movies?${p}`;
  };

  const loadPage = useCallback(
    async (pg: number, mt: MediaType, reset: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      try {
        const res = await fetch(buildUrl(pg, mt));
        const data = await res.json();
        const results: MediaItem[] = data.results ?? [];
        setTotalPages(data.total_pages ?? 1);
        setMovies((prev) => (reset ? results : [...prev, ...results]));
      } catch { /* silent */ } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [q]
  );

  useEffect(() => {
    setMovies([]);
    setPage(1);
    loadPage(1, mediaType, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, mediaType]);

  useEffect(() => {
    if (page === 1) return;
    loadPage(page, mediaType, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchingRef.current && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, totalPages]);

  const switchMedia = (mt: MediaType) => {
    setMediaType(mt);
    router.push(`/?media=${mt}`);
  };

  let title = mediaType === 'series' ? '📺 TV Series' : '🏠 Latest Movies';
  if (q) title = `Results for "${q}"`;
  else if (typeParam === 'popular') title = '🔥 Popular Now';
  else if (typeParam === 'toprated') title = '⭐ Top Rated';

  return (
    <div className="min-h-screen bg-[#03171E]">
      <div className="pt-16 px-4 sm:px-8 max-w-[1800px] mx-auto pb-16">

        {/* Media Tabs */}
        <div className="flex items-center gap-0 mb-0 pt-6 border-b border-[#1e4a5c]/50">
          {(['movies', 'series'] as MediaType[]).map((mt) => (
            <button
              key={mt}
              onClick={() => switchMedia(mt)}
              className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                mediaType === mt
                  ? 'text-white border-[#00A0EC]'
                  : 'text-[#7a9caa] border-transparent hover:text-white hover:border-[#1e4a5c]'
              }`}
            >
              {mt === 'movies' ? '🎬 Movies' : '📺 TV Series'}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-5 flex items-baseline gap-3 pt-5">
          <h1 className="text-white font-semibold text-lg">{title}</h1>
          {movies.length > 0 && (
            <span className="text-[#7a9caa] text-xs">{movies.length} titles</span>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-3">
          {movies.map((movie) => (
            <MovieCard key={`${movie.id}-${movie.type}`} movie={movie} size="md" />
          ))}
          {loading &&
            Array.from({ length: 16 }).map((_, i) => (
              <div key={`sk-${i}`} className="w-full aspect-[2/3] skeleton rounded" />
            ))}
        </div>

        {/* Empty */}
        {!loading && movies.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-white font-semibold text-lg mb-1">Nothing found</p>
            <p className="text-[#7a9caa] text-sm">Try a different search term</p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} className="h-10 mt-8 flex items-center justify-center">
          {loading && movies.length > 0 && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#00A0EC] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
          {!loading && page >= totalPages && movies.length > 0 && (
            <p className="text-[#7a9caa] text-xs">— end of results —</p>
          )}
        </div>
      </div>
    </div>
  );
}
