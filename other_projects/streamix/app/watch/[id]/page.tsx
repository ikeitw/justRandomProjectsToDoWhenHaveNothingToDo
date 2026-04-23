import WatchClient from './WatchClient';
import { getTmdbDetails } from '@/lib/vidapi';
import { notFound } from 'next/navigation';

interface WatchPageProps {
  params: { id: string };
  searchParams: { type?: string; season?: string; episode?: string };
}

export async function generateMetadata({ params, searchParams }: WatchPageProps) {
  try {
    const mediaType = searchParams.type === 'tv' ? 'tv' : 'movie';
    const details = await getTmdbDetails(parseInt(params.id), mediaType);
    const title = details.title ?? details.name ?? 'Untitled';
    return {
      title: `Watch ${title} — Streamix`,
      description: details.overview,
    };
  } catch {
    return { title: 'Watch — Streamix' };
  }
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const tmdbId = parseInt(params.id);
  if (isNaN(tmdbId)) return notFound();

  const mediaType = searchParams.type === 'tv' ? 'tv' : 'movie';
  const initialSeason = parseInt(searchParams.season ?? '1') || 1;
  const initialEpisode = parseInt(searchParams.episode ?? '1') || 1;

  let details;
  try {
    details = await getTmdbDetails(tmdbId, mediaType);
  } catch {
    return notFound();
  }

  return (
    <WatchClient
      details={details}
      tmdbId={tmdbId}
      mediaType={mediaType}
      initialSeason={initialSeason}
      initialEpisode={initialEpisode}
    />
  );
}
