const VIDAPI_BASE = 'https://vidapi.ru';
const VAPLAYER_BASE = 'https://vaplayer.ru';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VidApiMovie {
  tmdb_id: string;
  imdb_id: string;
  title: string;
  year: string;
  poster_url: string | null;
  rating: string;
  genre: string;
  popularity: string;
  type: 'movie';
  embed_url: string;
}

export interface VidApiShow {
  tmdb_id: string;
  imdb_id: string;
  title: string;
  year: string;
  poster_url: string | null;
  rating: string;
  genre: string;
  popularity: string;
  type: 'tv';
  embed_url: string;
  seasons?: number;
  episodes?: number;
}

export interface VidApiEpisode {
  show_tmdb_id: string;
  season_number: string;
  episode_number: string;
  episode_title: string;
  air_date: string;
  show_title: string;
  show_imdb_id: string;
  type: 'episode';
  embed_url: string;
}

export interface VidApiListResponse<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: T[];
}

export interface VidApiStats {
  imdb: {
    total_titles: number;
    movies: number;
    tv_series: number;
    episodes: number;
  };
  content_library: {
    movies: number;
    tv_shows: number;
    episodes: number;
  };
}

// ─── Normalised card type used across the whole UI ───────────────────────────

export interface MediaItem {
  id: string;           // tmdb_id
  imdb_id: string;
  title: string;
  year: string;
  poster_url: string | null;
  rating: number;
  genre: string;
  type: 'movie' | 'tv';
  embed_url: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function tmdbPoster(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w342') {
  if (!path) return null;
  // Already a full URL (VidAPI returns full tmdb URLs)
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function normaliseMovie(m: VidApiMovie): MediaItem {
  return {
    id: m.tmdb_id,
    imdb_id: m.imdb_id,
    title: m.title,
    year: m.year,
    poster_url: m.poster_url,
    rating: parseFloat(m.rating) || 0,
    genre: m.genre,
    type: 'movie',
    embed_url: m.embed_url,
  };
}

function normaliseShow(s: VidApiShow): MediaItem {
  return {
    id: s.tmdb_id,
    imdb_id: s.imdb_id,
    title: s.title,
    year: s.year,
    poster_url: s.poster_url,
    rating: parseFloat(s.rating) || 0,
    genre: s.genre,
    type: 'tv',
    embed_url: s.embed_url,
  };
}

async function vidapiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`VidAPI error: ${res.status} ${url}`);
  return res.json();
}

// ─── Listing endpoints ────────────────────────────────────────────────────────

export async function getLatestMovies(page = 1): Promise<{ items: MediaItem[]; total_pages: number; total: number }> {
  const data = await vidapiFetch<VidApiListResponse<VidApiMovie>>(
    `${VIDAPI_BASE}/movies/latest/page-${page}.json`
  );
  return {
    items: data.items.map(normaliseMovie),
    total_pages: data.total_pages,
    total: data.total,
  };
}

export async function getLatestShows(page = 1): Promise<{ items: MediaItem[]; total_pages: number; total: number }> {
  const data = await vidapiFetch<VidApiListResponse<VidApiShow>>(
    `${VIDAPI_BASE}/tvshows/latest/page-${page}.json`
  );
  return {
    items: data.items.map(normaliseShow),
    total_pages: data.total_pages,
    total: data.total,
  };
}

export async function getLatestEpisodes(page = 1): Promise<VidApiListResponse<VidApiEpisode>> {
  return vidapiFetch<VidApiListResponse<VidApiEpisode>>(
    `${VIDAPI_BASE}/episodes/latest/page-${page}.json`
  );
}

export async function getStats(): Promise<VidApiStats> {
  return vidapiFetch<VidApiStats>(`${VIDAPI_BASE}/imdb/api/?action=stats`);
}

// Fetch multiple pages and merge
export async function getLatestMoviesMulti(pages = 3): Promise<MediaItem[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => getLatestMovies(i + 1))
  );
  return results.flatMap((r) => r.items);
}

export async function getLatestShowsMulti(pages = 3): Promise<MediaItem[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => getLatestShows(i + 1))
  );
  return results.flatMap((r) => r.items);
}

// ─── Embed URL builders ───────────────────────────────────────────────────────

export function movieEmbedUrl(tmdbId: string | number, opts?: { resumeAt?: number; color?: string; lang?: string }): string {
  const params = new URLSearchParams();
  if (opts?.resumeAt && opts.resumeAt > 30) params.set('resumeAt', String(Math.floor(opts.resumeAt)));
  if (opts?.color) params.set('primaryColor', opts.color);
  if (opts?.lang) params.set('lang', opts.lang);
  const qs = params.toString();
  return `${VAPLAYER_BASE}/embed/movie/${tmdbId}${qs ? `?${qs}` : ''}`;
}

export function tvEmbedUrl(
  tmdbId: string | number,
  season: number,
  episode: number,
  opts?: { resumeAt?: number; color?: string; lang?: string }
): string {
  const params = new URLSearchParams();
  if (opts?.resumeAt && opts.resumeAt > 30) params.set('resumeAt', String(Math.floor(opts.resumeAt)));
  if (opts?.color) params.set('primaryColor', opts.color);
  if (opts?.lang) params.set('lang', opts.lang);
  const qs = params.toString();
  return `${VAPLAYER_BASE}/embed/tv/${tmdbId}/${season}/${episode}${qs ? `?${qs}` : ''}`;
}

// Legacy compat
export const STREAM_PROVIDERS = [
  {
    name: 'VidAPI',
    getUrl: (tmdbId: number) => movieEmbedUrl(tmdbId),
    isIframe: true,
  },
];

// ─── TMDB search/details (still needed for /watch page metadata) ──────────────

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!TMDB_KEY) throw new Error('No TMDB API key');
  const p = new URLSearchParams({ api_key: TMDB_KEY, language: 'en-US', ...params });
  const res = await fetch(`${TMDB_BASE}${endpoint}?${p}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB: ${res.status}`);
  return res.json();
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
  genres?: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[];
    crew: { id: number; name: string; job: string; department: string }[];
  };
  videos?: { results: { id: string; key: string; name: string; site: string; type: string; official: boolean }[] };
  similar?: { results: TmdbMovieDetails[] };
  recommendations?: { results: TmdbMovieDetails[] };
  number_of_seasons?: number;
  seasons?: { id: number; name: string; season_number: number; episode_count: number; poster_path: string | null }[];
  media_type?: 'movie' | 'tv';
}

export async function getTmdbDetails(tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`/${mediaType}/${tmdbId}`, {
    append_to_response: 'videos,credits,similar,recommendations',
  });
}

export async function searchTmdb(query: string, page = 1): Promise<{ results: TmdbMovieDetails[]; total_pages: number }> {
  return tmdbFetch<{ results: TmdbMovieDetails[]; total_pages: number }>('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}
