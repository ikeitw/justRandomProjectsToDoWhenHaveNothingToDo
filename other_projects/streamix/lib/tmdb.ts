const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

// Build TMDB image URL with specified resolution
export const tmdbImage = (path: string | null, size: 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

// Generic fetch wrapper with ISR caching (1 hour)
async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({
    api_key: API_KEY,
    language: 'en-US',
    ...params,
  });
  const url = `${TMDB_BASE_URL}${endpoint}?${searchParams}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDb API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  status?: string;
  adult: boolean;
  popularity: number;
  original_language: string;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  videos?: { results: Video[] };
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  similar?: MovieListResponse;
  recommendations?: MovieListResponse;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

// TMDB API query functions
export const getTrending = (timeWindow: 'day' | 'week' = 'week') =>
  tmdbFetch<MovieListResponse>(`/trending/movie/${timeWindow}`);

export const getPopular = (page = 1) =>
  tmdbFetch<MovieListResponse>('/movie/popular', { page: String(page) });

export const getTopRated = (page = 1) =>
  tmdbFetch<MovieListResponse>('/movie/top_rated', { page: String(page) });

export const getNowPlaying = () =>
  tmdbFetch<MovieListResponse>('/movie/now_playing');

export const getUpcoming = () =>
  tmdbFetch<MovieListResponse>('/movie/upcoming');

export const getMovieDetails = (movieId: number) =>
  tmdbFetch<MovieDetails>(`/movie/${movieId}`, {
    append_to_response: 'videos,credits,similar,recommendations',
  });

export const searchMovies = (query: string, page = 1) =>
  tmdbFetch<MovieListResponse>('/search/movie', { query, page: String(page) });

export const getByGenre = (genreId: number, page = 1) =>
  tmdbFetch<MovieListResponse>('/discover/movie', {
    with_genres: String(genreId),
    page: String(page),
    sort_by: 'popularity.desc',
  });

export const getGenres = () =>
  tmdbFetch<{ genres: Genre[] }>('/genre/movie/list');

// Popular genres hardcoded for quick access (matches TMDB IDs)
export const FEATURED_GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 18, name: 'Drama' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
];
