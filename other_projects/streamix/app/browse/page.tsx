import { Suspense } from 'react';
import {
    getTrending,
    getPopular,
    getTopRated,
    getNowPlaying,
    getUpcoming,
    getByGenre,
    FEATURED_GENRES,
} from '@/lib/tmdb';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';

async function BrowseContent({ searchParams }: { searchParams: { q?: string; genre?: string; genreName?: string; type?: string } }) {
    const { q, genre, genreName, type } = searchParams;

    // Search results view - displays matching movies for user query
    if (q) {
        const { searchMovies } = await import('@/lib/tmdb');
        const results = await searchMovies(q);
        return (
            <div className="pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto pb-16">
                <h1 className="text-white font-semibold text-lg mb-1">
                    Search results for <span className="text-[#00A0EC]">&ldquo;{q}&rdquo;</span>
                </h1>
                <p className="text-[#7a9caa] text-sm mb-6">{results.results.length} titles found</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                    {results.results.map((movie) => {
                        const { default: MovieCard } = require('@/components/movie/MovieCard');
                        return <MovieCard key={movie.id} movie={movie} size="md" />;
                    })}
                </div>
                {results.results.length === 0 && (
                    <div className="text-center py-20 text-[#7a9caa]">
                        <p className="text-4xl mb-3">🎬</p>
                        <p className="text-lg">No results found for &ldquo;{q}&rdquo;</p>
                    </div>
                )}
            </div>
        );
    }

    // Genre filter view - shows all movies in specific genre
    if (genre) {
        const genreMovies = await getByGenre(Number(genre));
        return (
            <div className="pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto pb-16">
                <h1 className="text-white font-semibold text-lg mb-1">
                    {genreName ?? 'Genre'}
                </h1>
                <p className="text-[#7a9caa] text-sm mb-6">{genreMovies.results.length} titles</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                    {genreMovies.results.map((movie) => {
                        const { default: MovieCard } = require('@/components/movie/MovieCard');
                        return <MovieCard key={movie.id} movie={movie} size="md" />;
                    })}
                </div>
            </div>
        );
    }

    // Popular / Top Rated filter modes
    if (type === 'popular' || type === 'toprated') {
        const movies = type === 'popular' ? await getPopular() : await getTopRated();
        const label = type === 'popular' ? '🔥 Popular Now' : '⭐ Top Rated';
        return (
            <div className="pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto pb-16">
                <h1 className="text-white font-semibold text-lg mb-6">{label}</h1>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                    {movies.results.map((movie) => {
                        const { default: MovieCard } = require('@/components/movie/MovieCard');
                        return <MovieCard key={movie.id} movie={movie} size="md" />;
                    })}
                </div>
            </div>
        );
    }

    // Default home — fetch all rows in parallel
    const [trending, popular, topRated, nowPlaying, upcoming, ...genreResults] = await Promise.all([
        getTrending('week'),
        getPopular(),
        getTopRated(),
        getNowPlaying(),
        getUpcoming(),
        ...FEATURED_GENRES.slice(0, 3).map((g) => getByGenre(g.id)),
    ]);

    return (
        <>
            <HeroBanner movies={trending.results} />
            <div className="px-4 sm:px-8 max-w-[1800px] mx-auto pb-16 -mt-4 relative z-10">
                <MovieRow title="🔥 Trending This Week" movies={trending.results} size="md" />
                <MovieRow title="▶ Now Playing" movies={nowPlaying.results} size="md" />
                <MovieRow title="⭐ Top Rated" movies={topRated.results} size="md" />
                <MovieRow title="🌟 Popular" movies={popular.results} size="md" />
                <MovieRow title="🎬 Coming Soon" movies={upcoming.results} size="md" />
                {FEATURED_GENRES.slice(0, 3).map((genre, i) => (
                    <MovieRow
                        key={genre.id}
                        title={genre.name}
                        movies={genreResults[i]?.results ?? []}
                        size="md"
                    />
                ))}
            </div>
        </>
    );
}

export default function BrowsePage({ searchParams }: { searchParams: { q?: string; genre?: string; genreName?: string; type?: string } }) {
    return (
        <div className="min-h-screen bg-[#03171E]">
            <Suspense fallback={
                <div className="pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
                    <div className="w-full h-[52vw] max-h-[650px] min-h-[380px] skeleton rounded mb-8" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="mb-8">
                            <div className="h-4 w-36 skeleton rounded mb-3" />
                            <div className="flex gap-2.5">
                                {Array.from({ length: 7 }).map((_, j) => (
                                    <div key={j} className="w-36 sm:w-44 aspect-[2/3] skeleton rounded flex-shrink-0" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            }>
                <BrowseContent searchParams={searchParams} />
            </Suspense>
        </div>
    );
}