import { signToken, verifyToken, type JWTPayload } from './jwt';
export { signToken, verifyToken, type JWTPayload };
import { cookies } from 'next/headers';
import { query, queryOne } from './db';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  plan: string;
  created_at: string;
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('streamix-token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function getUserFromSession(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await queryOne<User>(
      'SELECT id, name, email, avatar, plan, created_at FROM users WHERE id = $1',
      [session.userId]
  );
  return user;
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function saveWatchHistory(
    userId: number,
    movie: {
      id: number;
      title: string;
      poster_path: string | null;
      backdrop_path: string | null;
      vote_average: number;
      release_date: string;
    }
): Promise<void> {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
  const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null;

  await query(
      `INSERT INTO watch_history (user_id, movie_id, movie_title, movie_poster, movie_backdrop, movie_rating, movie_year, watched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (user_id, movie_id)
     DO UPDATE SET watched_at = NOW(), movie_poster = EXCLUDED.movie_poster`,
      [userId, movie.id, movie.title, poster, backdrop, movie.vote_average, year]
  );
}