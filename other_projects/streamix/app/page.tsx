'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MovieCard from '@/components/movie/MovieCard';
import { Movie } from '@/lib/tmdb';

// Genre lists for filtering
const MOVIE_GENRES = [
    { id: 28, name: 'Action' }, { id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' },
    { id: 27, name: 'Horror' }, { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' },
    { id: 10749, name: 'Romance' }, { id: 16, name: 'Animation' }, { id: 12, name: 'Adventure' },
    { id: 9648, name: 'Mystery' }, { id: 10751, name: 'Family' }, { id: 36, name: 'History' },
];

const TV_GENRES = [
    { id: 10759, name: 'Action & Adventure' }, { id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' },
    { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 9648, name: 'Mystery' }, { id: 10762, name: 'Kids' },
    { id: 16, name: 'Animation' }, { id: 80, name: 'Crime' },
];

type MediaType = 'movies' | 'series';

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Extract URL parameters for search, filters, and media type
    const q = searchParams.get('q');
    const typeParam = searchParams.get('type');
    const genreParam = searchParams.get('genre');
    const genreNameParam = searchParams.get('genreName');
    const mediaParam = (searchParams.get('media') as MediaType) ?? 'movies';

    // Pagination and filter state
    const [mediaType, setMediaType] = useState<MediaType>(mediaParam);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activeGenre, setActiveGenre] = useState<number | null>(genreParam ? Number(genreParam) : null);
    const [activeGenreName, setActiveGenreName] = useState<string | null>(genreNameParam);

    const loaderRef = useRef<HTMLDivElement>(null);
    const fetchingRef = useRef(false);
    const currentGenres = mediaType === 'movies' ? MOVIE_GENRES : TV_GENRES;

    // Build API URL based on current filters
    const buildUrl = (pg: number, mt: MediaType, genre: number | null) => {
        const p = new URLSearchParams();
        p.set('page', String(pg));
        p.set('mediaType', mt);
        if (q) p.set('q', q);
        else if (genre) p.set('genre', String(genre));
        else if (typeParam) p.set('type', typeParam);
        return `/api/movies?${p}`;
    };

    // Fetch page of movies with deduplication logic
    const loadPage = useCallback(async (pg: number, mt: MediaType, genre: number | null, reset: boolean) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setLoading(true);
        try {
            const res = await fetch(buildUrl(pg, mt, genre));
            const data = await res.json();
            const results: Movie[] = data.results ?? [];
            setTotalPages(data.total_pages ?? 1);
            setMovies((prev) => reset ? results : [...prev, ...results]);
        } catch { /* silent */ } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, typeParam]);

    // Reset on filter change
    useEffect(() => {
        setMovies([]);
        setPage(1);
        loadPage(1, mediaType, activeGenre, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, typeParam, activeGenre, mediaType]);

    // Infinite scroll — load next page
    useEffect(() => {
        if (page === 1) return;
        loadPage(page, mediaType, activeGenre, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // Intersection observer
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
        setActiveGenre(null);
        setActiveGenreName(null);
        router.push(`/browse?media=${mt}`);
    };

    const switchGenre = (id: number, name: string) => {
        const next = activeGenre === id ? null : id;
        const nextName = activeGenre === id ? null : name;
        setActiveGenre(next);
        setActiveGenreName(nextName);
        if (next) router.push(`/browse?genre=${id}&genreName=${encodeURIComponent(name)}&media=${mediaType}`);
        else router.push(`/browse?media=${mediaType}`);
    };

    // Page title
    let title = mediaType === 'series' ? '📺 TV Series' : '🏠 Home';
    if (q) title = `Results for "${q}"`;
    else if (activeGenreName) title = `◈ ${activeGenreName}`;
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

                {/* Genre Pills */}
                <div className="flex flex-wrap gap-1.5 py-4 border-b border-[#1e4a5c]/30 mb-6">
                    <button
                        onClick={() => { setActiveGenre(null); setActiveGenreName(null); router.push(`/browse?media=${mediaType}${typeParam ? `&type=${typeParam}` : ''}`); }}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
                            !activeGenre
                                ? 'bg-[#00A0EC] text-white border-[#00A0EC]'
                                : 'bg-[#0d2630] text-[#7a9caa] hover:text-white border-[#1e4a5c] hover:border-[#00A0EC]/50'
                        }`}
                    >
                        All
                    </button>
                    {currentGenres.map((g) => (
                        <button
                            key={g.id}
                            onClick={() => switchGenre(g.id, g.name)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
                                activeGenre === g.id
                                    ? 'bg-[#00A0EC] text-white border-[#00A0EC]'
                                    : 'bg-[#0d2630] text-[#7a9caa] hover:text-white border-[#1e4a5c] hover:border-[#00A0EC]/50'
                            }`}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>

                {/* Title */}
                <div className="mb-5 flex items-baseline gap-3">
                    <h1 className="text-white font-semibold text-lg">{title}</h1>
                    {movies.length > 0 && (
                        <span className="text-[#7a9caa] text-xs">{movies.length} titles</span>
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-3">
                    {movies.map((movie) => (
                        <MovieCard key={`${movie.id}-${mediaType}`} movie={movie} size="md" />
                    ))}
                    {loading && Array.from({ length: 16 }).map((_, i) => (
                        <div key={`sk-${i}`} className="w-full aspect-[2/3] skeleton rounded" />
                    ))}
                </div>

                {/* Empty */}
                {!loading && movies.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-5xl mb-4">🎬</p>
                        <p className="text-white font-semibold text-lg mb-1">Nothing found</p>
                        <p className="text-[#7a9caa] text-sm">Try a different genre or search term</p>
                    </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={loaderRef} className="h-10 mt-8 flex items-center justify-center">
                    {loading && movies.length > 0 && (
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="w-2 h-2 rounded-full bg-[#00A0EC] animate-bounce"
                                     style={{ animationDelay: `${i * 0.15}s` }} />
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