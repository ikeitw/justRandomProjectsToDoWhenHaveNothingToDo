import { NextRequest, NextResponse } from 'next/server';
import { searchMovies, getTrending, getPopular, getTopRated, getByGenre } from '@/lib/tmdb';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY || '';

// Wrapper for TMDB API requests with ISR caching
async function tmdbGet<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const p = new URLSearchParams({ api_key: API_KEY, language: 'en-US', ...params });
  // Cache results for 1 hour to reduce API calls
  const res = await fetch(`${TMDB_BASE}${endpoint}?${p}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDb: ${res.status}`);
  return res.json();
}

// TV series query methods
const getTvTrending = (page = 1) =>
    tmdbGet<any>('/trending/tv/week', { page: String(page) });

const getTvPopular = (page = 1) =>
    tmdbGet<any>('/tv/popular', { page: String(page) });

const getTvTopRated = (page = 1) =>
    tmdbGet<any>('/tv/top_rated', { page: String(page) });

const getTvByGenre = (genreId: number, page = 1) =>
    tmdbGet<any>('/discover/tv', {
      with_genres: String(genreId),
      page: String(page),
      sort_by: 'popularity.desc',
    });

const searchTv = (query: string, page = 1) =>
    tmdbGet<any>('/search/tv', { query, page: String(page) });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Query parameters: q=search, type=trending|popular|toprated, mediaType=movies|series, page=1, genre=genreId
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'trending';
    const page = parseInt(searchParams.get('page') || '1');
    const genre = searchParams.get('genre');
    const mediaType = searchParams.get('mediaType') || 'movies'; // 'movies' | 'series'

    let data;

    if (mediaType === 'series') {
      if (q) data = await searchTv(q, page);
      else if (genre) data = await getTvByGenre(Number(genre), page);
      else if (type === 'popular') data = await getTvPopular(page);
      else if (type === 'toprated') data = await getTvTopRated(page);
      else data = await getTvTrending(page);
    } else {
      // movies
      if (q) data = await searchMovies(q, page);
      else if (genre) data = await getByGenre(Number(genre), page);
      else if (type === 'popular') data = await getPopular(page);
      else if (type === 'toprated') data = await getTopRated(page);
      else data = await getTrending();
    }

    // Normalize TV results to match movie schema (TMDB uses different field names)
    // TV: `name` -> `title`, `first_air_date` -> `release_date`
    if (mediaType === 'series' && data?.results) {
      data.results = data.results.map((item: any) => ({
        ...item,
        title: item.title ?? item.name ?? 'Untitled',
        release_date: item.release_date ?? item.first_air_date ?? '',
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Movies API error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
