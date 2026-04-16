import { getMovieDetails } from '@/lib/tmdb';
import WatchClient from './WatchClient';
import { notFound } from 'next/navigation';

interface WatchPageProps {
  params: { id: string };
}

// Generate SEO metadata for watch page
export async function generateMetadata({ params }: WatchPageProps) {
  try {
    const movie = await getMovieDetails(parseInt(params.id));
    return {
      title: `Watch ${movie.title} — Streamix`,
      description: movie.overview,
    };
  } catch {
    return { title: 'Watch — Streamix' };
  }
}

// Server component - fetches movie details and passes to client for interactivity
export default async function WatchPage({ params }: WatchPageProps) {
  const movieId = parseInt(params.id);
  if (isNaN(movieId)) return notFound();

  // Fetch movie details with credits, similar, and recommendations
  let movie;
  try {
    movie = await getMovieDetails(movieId);
  } catch {
    return notFound();
  }

  return <WatchClient movie={movie} />;
}
