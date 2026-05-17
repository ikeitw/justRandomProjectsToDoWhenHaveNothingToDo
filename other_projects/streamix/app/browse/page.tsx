import { Suspense } from 'react';
import { getLatestMovies, getLatestShows, getTmdbDetails, MediaItem } from '@/lib/vidapi';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';
import CTA from '@/components/ui/CTA';
import Eyebrow from '@/components/ui/Eyebrow';

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

  const featured = movies.slice(0, 5);

  // Fetch TMDB backdrop_path for hero slides — gracefully handles missing API key
  const backdropResults = await Promise.allSettled(
    featured.map((m) => getTmdbDetails(parseInt(m.id, 10), m.type))
  );
  const backdropPaths = backdropResults.map((r) =>
    r.status === 'fulfilled' ? r.value.backdrop_path : null
  );

  const topRatedMovies = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 24);
  const topRatedShows = [...shows].sort((a, b) => b.rating - a.rating).slice(0, 24);

  // Editorial pick — highest-rated movie in the current dataset
  const editorialPick = topRatedMovies[0] ?? null;

  return (
    <>
      <HeroBanner movies={movies} backdropPaths={backdropPaths} />
      <div className="px-4 sm:px-8 max-w-[1800px] mx-auto pb-16 -mt-4 relative z-10">
        <MovieRow title="Latest Movies"  eyebrow="01 — Cinema"     movies={movies.slice(0, 24)}  size="md" />
        <MovieRow title="Latest Series"  eyebrow="02 — Television" movies={shows.slice(0, 24)}   size="md" />

        {/* Editorial pick — between rows 2 and 3 */}
        {editorialPick && <EditorialPick movie={editorialPick} />}

        <MovieRow title="Top Rated Movies" eyebrow="03 — Acclaimed"  movies={topRatedMovies}       size="md" />
        <MovieRow title="Top Rated Series" eyebrow="04 — Essential"  movies={topRatedShows}        size="md" />
        <MovieRow title="More Movies"      eyebrow="05 — Discovery"  movies={movies.slice(24, 48)} size="md" />
        <MovieRow title="More Series"      eyebrow="06 — Explore"    movies={shows.slice(24)}      size="md" />
      </div>
    </>
  );
}

// ── Editorial pick block ─────────────────────────────────────────────────────

function EditorialPick({ movie }: { movie: MediaItem }) {
  const watchUrl = `/watch/${movie.id}?type=${movie.type}`;

  const stats = [
    { label: 'Score',    value: `★ ${movie.rating.toFixed(1)}` },
    { label: 'Released', value: movie.year || '—' },
    { label: 'Genre',    value: movie.genre?.split(',')[0]?.trim() || '—' },
  ];

  return (
    <section
      className="py-16 sm:py-20 my-8 border-t border-b"
      style={{ borderColor: 'var(--hairline-soft)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-12 md:gap-16 items-center">

        {/* Left — editorial text */}
        <div>
          <Eyebrow label="Editor's Selection · Tonight" className="mb-5" />

          <h2
            className="text-[var(--ivory)] leading-[0.98] mb-6"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(2.25rem, 5vw, 4.5rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {movie.title}
          </h2>

          {/* Stats */}
          <div className="flex gap-8 mb-9 flex-wrap">
            {stats.map((s) => (
              <div key={s.label}>
                <div
                  className="mb-1.5 text-[9px] tracking-[0.2em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--dim)' }}
                >
                  {s.label}
                </div>
                <div
                  className="text-[22px] leading-none"
                  style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ivory)' }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <CTA
              href={watchUrl}
              variant="primary"
              size="md"
              icon={
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 14 14">
                  <path d="M3 2L11.5 7L3 12V2Z" />
                </svg>
              }
            >
              Begin
            </CTA>
            <CTA href={watchUrl} variant="ghost" size="md">
              More Info
            </CTA>
          </div>
        </div>

        {/* Right — poster with offset editorial tag */}
        <div className="relative">
          {movie.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full max-w-[360px] md:max-w-none aspect-[2/3] object-cover mx-auto md:mx-0"
            />
          ) : (
            <div
              className="w-full aspect-[2/3] flex items-center justify-center"
              style={{ background: 'var(--surface)' }}
            >
              <span className="text-6xl">{movie.type === 'tv' ? '📺' : '🎬'}</span>
            </div>
          )}

          {/* Floating "selected by" tag */}
          <div
            className="absolute bottom-0 right-0 translate-y-5 hidden sm:block px-5 py-4 border border-[var(--hairline)] max-w-[200px]"
            style={{ background: 'var(--oled)' }}
          >
            <div
              className="mb-2 text-[9px] tracking-[0.18em] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
            >
              Selected By
            </div>
            <div
              className="text-[16px] leading-snug"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ivory)' }}
            >
              The Streamix Editorial Desk
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page shell ───────────────────────────────────────────────────────────────

export default function BrowsePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--oled)' }}>
      <Suspense
        fallback={
          <div className="pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
            <div className="w-full h-[52vw] max-h-[760px] min-h-[460px] skeleton mb-8" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-10">
                <div className="h-2.5 w-24 skeleton mb-1.5" />
                <div className="h-6 w-52 skeleton mb-4" />
                <div className="h-px bg-[var(--hairline)] mb-3" />
                <div className="flex gap-3">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="w-36 sm:w-44 aspect-[2/3] skeleton flex-shrink-0" />
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
