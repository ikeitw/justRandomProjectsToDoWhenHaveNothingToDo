import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    // Pagination support - default 20 items per page
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch watch history ordered by most recent
    const history = await query(
      `SELECT * FROM watch_history WHERE user_id = $1 ORDER BY watched_at DESC LIMIT $2 OFFSET $3`,
      [session.userId, limit, offset]
    );

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { movie } = await request.json();
    if (!movie?.id || !movie?.title)
      return NextResponse.json({ error: 'Movie data required' }, { status: 400 });

    // Build image URLs from TMDB paths
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
    const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

    // Insert or update (upsert) - updates timestamp if already viewed
    await query(
      `INSERT INTO watch_history
         (user_id, movie_id, movie_title, movie_poster, movie_backdrop, movie_rating, movie_year, watched_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id, movie_id)
       DO UPDATE SET watched_at = NOW(), movie_poster = EXCLUDED.movie_poster`,
      [session.userId, movie.id, movie.title, poster, backdrop, movie.vote_average ?? 0, year]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    // Delete specific movie or entire history
    if (movieId) {
      await query('DELETE FROM watch_history WHERE user_id = $1 AND movie_id = $2',
        [session.userId, parseInt(movieId)]);
    } else {
      await query('DELETE FROM watch_history WHERE user_id = $1', [session.userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
  }
}
