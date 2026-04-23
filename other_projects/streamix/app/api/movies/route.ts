import { NextRequest, NextResponse } from 'next/server';
import { getLatestMovies, getLatestShows } from '@/lib/vidapi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType') || 'movies'; // 'movies' | 'series'
    const page = parseInt(searchParams.get('page') || '1');
    const q = searchParams.get('q');

    // Search via TMDB if query present
    if (q) {
      const TMDB_KEY = process.env.TMDB_API_KEY || '';
      if (!TMDB_KEY) {
        return NextResponse.json({ results: [], total_pages: 1 });
      }
      const type = mediaType === 'series' ? 'tv' : 'movie';
      const p = new URLSearchParams({ api_key: TMDB_KEY, language: 'en-US', query: q, page: String(page) });
      const res = await fetch(`https://api.themoviedb.org/3/search/${type}?${p}`, { next: { revalidate: 300 } });
      const data = await res.json();

      const items = (data.results ?? []).map((item: any) => ({
        id: String(item.id),
        imdb_id: '',
        title: item.title ?? item.name ?? 'Untitled',
        year: (item.release_date ?? item.first_air_date ?? '').slice(0, 4),
        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
        rating: item.vote_average ?? 0,
        genre: '',
        type: type as 'movie' | 'tv',
        embed_url: `https://vaplayer.ru/embed/${type}/${item.id}`,
      }));

      return NextResponse.json({ results: items, total_pages: data.total_pages ?? 1 });
    }

    // Use VidAPI listing endpoints
    const data = mediaType === 'series'
      ? await getLatestShows(page)
      : await getLatestMovies(page);

    return NextResponse.json({
      results: data.items,
      total_pages: data.total_pages,
      total: data.total,
    });
  } catch (error) {
    console.error('Movies API error:', error);
    return NextResponse.json({ error: 'Failed to fetch', results: [], total_pages: 1 }, { status: 500 });
  }
}
