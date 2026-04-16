import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch user's watchlist sorted by most recently added
    const watchlist = await query(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC',
      [session.userId]
    );

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { movie } = await request.json();
    if (!movie?.id) return NextResponse.json({ error: 'Movie data required' }, { status: 400 });

    // Build image URLs from TMDB paths
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
    const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
    const genre = movie.genres?.[0]?.name || movie.genre_ids?.[0] || null;

    // Check if movie already exists in watchlist
    const existing = await queryOne(
      'SELECT id FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [session.userId, movie.id]
    );

    if (existing) {
      // Toggle: remove from watchlist if already exists
      await query('DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2',
        [session.userId, movie.id]);
      return NextResponse.json({ success: true, action: 'removed' });
    }

    await query(
      `INSERT INTO watchlist (user_id, movie_id, movie_title, movie_poster, movie_backdrop, movie_rating, movie_year, movie_genre)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [session.userId, movie.id, movie.title, poster, backdrop, movie.vote_average ?? 0, year, genre]
    );

    return NextResponse.json({ success: true, action: 'added' });
  } catch (error) {
    console.error('Watchlist POST error:', error);
    return NextResponse.json({ error: 'Failed to update watchlist' }, { status: 500 });
  }
}
