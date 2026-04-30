'use client';

import { useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import VideoPlayer from '@/components/movie/VideoPlayer';
import MovieRow from '@/components/movie/MovieRow';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { TmdbMovieDetails, MediaItem, movieEmbedUrl } from '@/lib/vidapi';

// ─── Season/Episode Selector ─────────────────────────────────────────────────

function EpisodeSelector({
  details,
  season,
  episode,
  onSelect,
}: {
  details: TmdbMovieDetails;
  season: number;
  episode: number;
  onSelect: (s: number, e: number) => void;
}) {
  const [activeSeason, setActiveSeason] = useState(season);
  const seasons = (details.seasons ?? []).filter((s) => s.season_number > 0);
  const currentSeason = seasons.find((s) => s.season_number === activeSeason);

  if (!seasons.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-white font-semibold text-sm mb-3">Episodes</h3>
      {/* Season tabs */}
      <div className="flex items-center gap-0 border-b border-[#1e4a5c]/50 mb-4 overflow-x-auto">
        {seasons.map((s) => (
          <button
            key={s.season_number}
            onClick={() => setActiveSeason(s.season_number)}
            className={`px-4 py-2 text-xs font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
              activeSeason === s.season_number
                ? 'text-white border-[#00A0EC]'
                : 'text-[#7a9caa] border-transparent hover:text-white'
            }`}
          >
            Season {s.season_number}
            <span className="ml-1.5 text-[10px] text-[#7a9caa]">({s.episode_count})</span>
          </button>
        ))}
      </div>

      {/* Episode grid */}
      {currentSeason && (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {Array.from({ length: currentSeason.episode_count }, (_, i) => {
            const epNum = i + 1;
            const isActive = activeSeason === season && epNum === episode;
            return (
              <button
                key={epNum}
                onClick={() => onSelect(activeSeason, epNum)}
                className={`aspect-square rounded flex items-center justify-center text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-[#00A0EC] text-white border-[#00A0EC] shadow-lg shadow-[#00A0EC]/20'
                    : 'bg-[#0d2630] text-[#7a9caa] border-[#1e4a5c] hover:border-[#00A0EC]/50 hover:text-white hover:bg-[#122c38]'
                }`}
              >
                {epNum}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Navbar skeleton fallback ─────────────────────────────────────────────────

function NavbarFallback() {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-[#03171E] border-b border-[#1e4a5c]">
      <div className="max-w-[1800px] mx-auto px-6 flex items-center h-full gap-4">
        <div className="w-24 h-5 skeleton rounded" />
        <div className="w-16 h-4 skeleton rounded" />
        <div className="w-16 h-4 skeleton rounded" />
      </div>
    </div>
  );
}

// ─── Inner client (needs auth context) ───────────────────────────────────────

function WatchClientInner({
  details,
  tmdbId,
  mediaType,
  initialSeason,
  initialEpisode,
}: {
  details: TmdbMovieDetails;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  initialSeason: number;
  initialEpisode: number;
}) {
  const { user } = useAuth();
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const title = details.title ?? details.name ?? 'Untitled';
  const year = (details.release_date ?? details.first_air_date ?? '').slice(0, 4);
  const runtime =
    details.runtime ??
    (details.episode_run_time?.[0] ? details.episode_run_time[0] : null);
  const director = details.credits?.crew?.find((c) => c.job === 'Director');
  const cast = details.credits?.cast?.slice(0, 6) ?? [];
  const trailer =
    details.videos?.results?.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
    ) ?? details.videos?.results?.find((v) => v.site === 'YouTube');

  // Normalise similar/recommendations to MediaItem for MovieRow
  const toMediaItem = (item: TmdbMovieDetails): MediaItem => ({
    id: String(item.id),
    imdb_id: '',
    title: item.title ?? item.name ?? 'Untitled',
    year: (item.release_date ?? item.first_air_date ?? '').slice(0, 4),
    poster_url: item.poster_path
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
      : null,
    rating: item.vote_average ?? 0,
    genre: '',
    type: mediaType,
    embed_url: movieEmbedUrl(item.id),
  });

  const recommendations =
    details.recommendations?.results?.slice(0, 15).map(toMediaItem) ?? [];
  const similar =
    details.similar?.results?.slice(0, 15).map(toMediaItem) ?? [];

  // Next episode logic
  const currentSeasonObj = details.seasons?.find((s) => s.season_number === season);
  const totalEpisodesInSeason = currentSeasonObj?.episode_count ?? 0;
  const hasNextEpisode =
    mediaType === 'tv' &&
    (episode < totalEpisodesInSeason ||
      season < (details.number_of_seasons ?? 1));

  const handleNextEpisode = useCallback(() => {
    if (episode < totalEpisodesInSeason) {
      setEpisode((e) => e + 1);
    } else if (season < (details.number_of_seasons ?? 1)) {
      setSeason((s) => s + 1);
      setEpisode(1);
    }
  }, [episode, season, totalEpisodesInSeason, details.number_of_seasons]);

  const handleEpisodeSelect = (s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
  };

  const toggleWatchlist = async () => {
    if (!user) return;
    setWatchlistLoading(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie: {
            id: tmdbId,
            title,
            poster_path: details.poster_path,
            backdrop_path: details.backdrop_path,
            vote_average: details.vote_average,
            release_date: details.release_date ?? details.first_air_date,
          },
        }),
      });
      const data = await res.json();
      setInWatchlist(data.action === 'added');
    } catch {
      /* silent */
    } finally {
      setWatchlistLoading(false);
    }
  };

  const posterUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : null;

  return (
    <div className="min-h-screen bg-[#03171E]">
      {/* Navbar with Suspense — useSearchParams inside Navbar needs it */}
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>

      {/* Player */}
      <div className="pt-14">
        <div className="max-w-[1400px] mx-auto">
          <VideoPlayer
            tmdbId={tmdbId}
            title={title}
            mediaType={mediaType}
            season={season}
            episode={episode}
            totalEpisodes={totalEpisodesInSeason}
            onNextEpisode={hasNextEpisode ? handleNextEpisode : undefined}
            onEpisodeChange={handleEpisodeSelect}
          />
        </div>
      </div>

      {/* Details */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Back link */}
            <Link
              href={mediaType === 'tv' ? '/browse/series' : '/browse/movies'}
              className="inline-flex items-center gap-1.5 text-[#7a9caa] hover:text-white text-xs mb-4 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {mediaType === 'tv' ? 'TV Series' : 'Movies'}
            </Link>

            {/* Title */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1">
                <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wide leading-tight">
                  {title}
                </h1>
                {mediaType === 'tv' && (
                  <p className="text-[#00A0EC] text-sm font-semibold mt-1">
                    Season {season} · Episode {episode}
                    {currentSeasonObj && ` of ${currentSeasonObj.episode_count}`}
                  </p>
                )}
              </div>
              {mediaType === 'tv' && (
                <span className="mt-2 bg-[#0d2630] border border-[#1e4a5c] text-[#7a9caa] text-xs font-bold px-2 py-1 rounded shrink-0">
                  TV SERIES
                </span>
              )}
            </div>

            {details.tagline && (
              <p className="text-gray-400 italic text-base mb-4">&ldquo;{details.tagline}&rdquo;</p>
            )}

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-3 mb-5">
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <span>★</span>
                <span>{(details.vote_average ?? 0).toFixed(1)}</span>
              </span>
              <span className="text-gray-400 text-sm">
                ({(details.vote_count ?? 0).toLocaleString()} votes)
              </span>
              {year && <span className="text-gray-300 text-sm font-medium">{year}</span>}
              {runtime && (
                <span className="text-gray-300 text-sm">
                  {Math.floor(runtime / 60)}h {runtime % 60}m
                </span>
              )}
              {mediaType === 'tv' && details.number_of_seasons && (
                <span className="text-gray-300 text-sm">
                  {details.number_of_seasons} season
                  {details.number_of_seasons > 1 ? 's' : ''}
                </span>
              )}
              <span className="border border-gray-600 text-gray-300 text-xs px-1.5 py-0.5 rounded">
                HD
              </span>
              {(details.vote_average ?? 0) >= 7 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-800 text-green-200">
                  CERTIFIED FRESH
                </span>
              )}
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {details.genres.map((g) => (
                  <span key={g.id} className="genre-tag">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-gray-300 text-base leading-relaxed mb-6">{details.overview}</p>

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap mb-6">
              {user ? (
                <button
                  onClick={toggleWatchlist}
                  disabled={watchlistLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-colors ${
                    inWatchlist
                      ? 'bg-green-700 hover:bg-green-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {inWatchlist ? '✓ In My List' : '+ My List'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded text-sm transition-colors border border-white/20"
                >
                  + My List
                </Link>
              )}

              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 text-white font-semibold px-5 py-2.5 rounded text-sm transition-colors border border-red-800/50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Trailer
                </a>
              )}

              {hasNextEpisode && (
                <button
                  onClick={handleNextEpisode}
                  className="flex items-center gap-2 bg-[#00A0EC] hover:bg-[#0088cc] text-white font-semibold px-5 py-2.5 rounded text-sm transition-colors"
                >
                  Next Episode →
                </button>
              )}
            </div>

            {/* Credits */}
            <div className="space-y-3">
              {director && (
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 text-sm w-20 shrink-0">Director</span>
                  <span className="text-white text-sm font-medium">{director.name}</span>
                </div>
              )}
              {cast.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 text-sm w-20 shrink-0">Cast</span>
                  <span className="text-white text-sm">{cast.map((c) => c.name).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Episode selector for TV */}
            {mediaType === 'tv' && (
              <EpisodeSelector
                details={details}
                season={season}
                episode={episode}
                onSelect={handleEpisodeSelect}
              />
            )}
          </div>

          {/* Poster sidebar */}
          <div className="hidden lg:block">
            {posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt={title}
                className="w-full rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>

        {/* Related rows */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <MovieRow title="More Like This" movies={recommendations} />
          </div>
        )}
        {similar.length > 0 && recommendations.length === 0 && (
          <div className="mt-12">
            <MovieRow title="Similar Titles" movies={similar} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Exported wrapper ─────────────────────────────────────────────────────────

export default function WatchClient(props: {
  details: TmdbMovieDetails;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  initialSeason: number;
  initialEpisode: number;
}) {
  return (
    <AuthProvider>
      <WatchClientInner {...props} />
    </AuthProvider>
  );
}
