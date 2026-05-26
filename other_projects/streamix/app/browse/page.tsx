import { Suspense } from 'react';
import { getLatestMovies, getLatestShows, getTmdbDetails, MediaItem } from '@/lib/vidapi';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';
import CTA from '@/components/ui/CTA';
import Eyebrow from '@/components/ui/Eyebrow';

// ── Helpers ───────────────────────────────────────────────────────────────────

function byPopularity(items: MediaItem[]) {
  return [...items].sort((a, b) => b.popularity - a.popularity);
}

function byRating(items: MediaItem[]) {
  return [...items].sort((a, b) => b.rating - a.rating);
}

function byGenre(items: MediaItem[], genre: string) {
  return items.filter((m) => m.genre.toLowerCase().includes(genre.toLowerCase()));
}

// ── Main data-fetching component ──────────────────────────────────────────────

async function BrowseContent() {
  // 3 pages of movies (~60 items), 3 pages of shows (~60 items)
  const [p1m, p2m, p3m, p1s, p2s, p3s] = await Promise.all([
    getLatestMovies(1), getLatestMovies(2), getLatestMovies(3),
    getLatestShows(1),  getLatestShows(2),  getLatestShows(3),
  ]);

  const movies = [...p1m.items, ...p2m.items, ...p3m.items];
  const shows  = [...p1s.items, ...p2s.items, ...p3s.items];
  const all    = [...movies, ...shows];

  // Hero: top 5 movies by popularity
  const heroMovies = byPopularity(movies).slice(0, 5);

  // Fetch TMDB backdrops for hero items
  const backdropResults = await Promise.allSettled(
    heroMovies.map((m) => getTmdbDetails(parseInt(m.id, 10), m.type))
  );
  const backdropPaths = backdropResults.map((r) =>
    r.status === 'fulfilled' ? r.value.backdrop_path : null
  );

  // Rows
  const trendingNow   = byPopularity(all).slice(0, 24);
  const latestMovies  = movies.slice(0, 24);
  const latestSeries  = shows.slice(0, 24);
  const topMovies     = byRating(movies).slice(0, 24);
  const topSeries     = byRating(shows).slice(0, 24);

  // Editorial pick: highest-rated movie not already in hero
  const heroIds = new Set(heroMovies.map((m) => m.id));
  const editorialPick = byRating(movies).find((m) => !heroIds.has(m.id)) ?? null;

  // Genre rows — only show when ≥ 6 items exist
  const genreRows: { label: string; eyebrow: string; items: MediaItem[] }[] = [
    { label: 'Action',    eyebrow: 'Genre — Adrenaline',   items: byPopularity(byGenre(all, 'action'))   },
    { label: 'Comedy',   eyebrow: 'Genre — Laugh Track',   items: byPopularity(byGenre(all, 'comedy'))  },
    { label: 'Drama',    eyebrow: 'Genre — Human Stories', items: byPopularity(byGenre(all, 'drama'))   },
    { label: 'Thriller', eyebrow: 'Genre — Edge of Seat',  items: byPopularity(byGenre(all, 'thriller'))},
    { label: 'Sci-Fi',   eyebrow: 'Genre — Future Worlds', items: byPopularity(byGenre(all, 'sci'))     },
    { label: 'Crime',    eyebrow: 'Genre — Dark Side',     items: byPopularity(byGenre(all, 'crime'))   },
    { label: 'Horror',   eyebrow: 'Genre — Fear Factor',   items: byPopularity(byGenre(all, 'horror'))  },
    { label: 'Adventure',eyebrow: 'Genre — Wide World',    items: byPopularity(byGenre(all, 'adventure'))},
  ].filter((r) => r.items.length >= 6).map((r) => ({ ...r, items: r.items.slice(0, 24) }));

  return (
    <>
      <HeroBanner movies={heroMovies} backdropPaths={backdropPaths} />

      <div className="px-4 sm:px-8 max-w-[1800px] mx-auto pb-16 -mt-4 relative z-10">

        {/* Trending Now */}
        <MovieRow
          title="Trending Now"
          eyebrow="What Everyone's Watching"
          movies={trendingNow}
          size="md"
        />

        {/* Latest Movies */}
        <MovieRow
          title="Latest Movies"
          eyebrow="New to the Library"
          movies={latestMovies}
          size="md"
        />

        {/* Latest Series */}
        <MovieRow
          title="Latest Series"
          eyebrow="Fresh Episodes"
          movies={latestSeries}
          size="md"
        />

        {/* Editorial pick */}
        {editorialPick && <EditorialPick movie={editorialPick} />}

        {/* Top Rated Movies */}
        <MovieRow
          title="Top Rated Movies"
          eyebrow="Critically Acclaimed"
          movies={topMovies}
          size="md"
        />

        {/* Top Rated Series */}
        <MovieRow
          title="Top Rated Series"
          eyebrow="Essential Television"
          movies={topSeries}
          size="md"
        />

        {/* Genre rows */}
        {genreRows.map((row) => (
          <MovieRow
            key={row.label}
            title={row.label}
            eyebrow={row.eyebrow}
            movies={row.items}
            size="md"
          />
        ))}

      </div>
    </>
  );
}

// ── Editorial pick block ──────────────────────────────────────────────────────

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

// ── Page shell ────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--oled)' }}>
      <Suspense
        fallback={
          <div className="pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
            <div className="w-full h-[52vw] max-h-[760px] min-h-[460px] skeleton mb-8" />
            {Array.from({ length: 5 }).map((_, i) => (
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
