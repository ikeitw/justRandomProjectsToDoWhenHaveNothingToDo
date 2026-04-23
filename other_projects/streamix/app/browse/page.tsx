import { Suspense } from 'react';
import { getLatestMovies, getLatestShows, getLatestEpisodes, getStats } from '@/lib/vidapi';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';

async function BrowseContent({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
  const { q, type } = searchParams;

  // Search mode — delegate to client page at /
  if (q || type) {
    // Redirect to the client-side browse page at root which handles search
    const { redirect } = await import('next/navigation');
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (type) qs.set('type', type);
    redirect(`/?${qs}`);
  }

  // Fetch movies and shows in parallel (2 pages each for more content)
  const [page1Movies, page2Movies, page1Shows, page2Shows] = await Promise.all([
    getLatestMovies(1),
    getLatestMovies(2),
    getLatestShows(1),
    getLatestShows(2),
  ]);

  const movies = [...page1Movies.items, ...page2Movies.items];
  const shows = [...page1Shows.items, ...page2Shows.items];

  // Split movies into sections based on rating for varied rows
  const topMovies = movies.filter((m) => m.rating >= 7.5);
  const recentMovies = movies.slice(0, 24);

  return (
    <>
      <HeroBanner movies={movies} />
      <div className="px-4 sm:px-8 max-w-[1800px] mx-auto pb-16 -mt-4 relative z-10">
        <MovieRow title="🎬 Latest Movies" movies={recentMovies} size="md" />
        <MovieRow title="📺 Latest TV Series" movies={shows.slice(0, 24)} size="md" />
        {topMovies.length > 0 && (
          <MovieRow title="⭐ Top Rated Movies" movies={topMovies.slice(0, 24)} size="md" />
        )}
        <MovieRow title="🔥 More Movies" movies={movies.slice(24)} size="md" />
        <MovieRow title="🌟 More Series" movies={shows.slice(24)} size="md" />
      </div>
    </>
  );
}

export default function BrowsePage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
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
        <BrowseContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
