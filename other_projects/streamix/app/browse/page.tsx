import { Suspense } from 'react';
import { getLatestMovies, getLatestShows } from '@/lib/vidapi';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';

async function BrowseContent() {
  const [page1Movies, page2Movies, page1Shows, page2Shows, page3Movies] = await Promise.all([
    getLatestMovies(1),
    getLatestMovies(2),
    getLatestShows(1),
    getLatestShows(2),
    getLatestMovies(3),
  ]);

  const movies = [...page1Movies.items, ...page2Movies.items, ...page3Movies.items];
  const shows = [...page1Shows.items, ...page2Shows.items];

  // Sort variants for different rows
  const topRatedMovies = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 24);
  const topRatedShows = [...shows].sort((a, b) => b.rating - a.rating).slice(0, 24);

  return (
    <>
      <HeroBanner movies={movies} />
      <div className="px-4 sm:px-8 max-w-[1800px] mx-auto pb-16 -mt-4 relative z-10">
        <MovieRow title="🎬 Latest Movies" movies={movies.slice(0, 24)} size="md" />
        <MovieRow title="📺 Latest TV Series" movies={shows.slice(0, 24)} size="md" />
        <MovieRow title="⭐ Top Rated Movies" movies={topRatedMovies} size="md" />
        <MovieRow title="🌟 Top Rated Series" movies={topRatedShows} size="md" />
        <MovieRow title="🔥 More Movies" movies={movies.slice(24, 48)} size="md" />
        <MovieRow title="📡 More Series" movies={shows.slice(24)} size="md" />
      </div>
    </>
  );
}

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-[#03171E]">
      <Suspense
        fallback={
          <div className="pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
            <div className="w-full h-[52vw] max-h-[650px] min-h-[380px] skeleton rounded mb-8" />
            {Array.from({ length: 4 }).map((_, i) => (
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
        }
      >
        <BrowseContent />
      </Suspense>
    </div>
  );
}
