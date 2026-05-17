'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MediaItem } from '@/lib/vidapi';

interface MovieCardProps {
  movie: MediaItem;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
}

export default function MovieCard({ movie, showInfo = true }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const watchUrl = `/watch/${movie.id}?type=${movie.type}`;
  const primaryGenre = movie.genre?.split(',')[0]?.trim() ?? '';
  const caption = [primaryGenre, movie.year].filter(Boolean).join(' · ');

  return (
    <Link href={watchUrl} className="block w-full group/card">
      {/* Poster — sharp corners, inner glow on hover */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[var(--card)] transition-[box-shadow] duration-200 group-hover/card:ring-1 group-hover/card:ring-inset group-hover/card:ring-[var(--accent)]">
        {/* Skeleton — only while image is loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 skeleton" />
        )}

        {movie.poster_url && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-3xl mb-2">{movie.type === 'tv' ? '📺' : '🎬'}</span>
            <span className="text-[11px] text-[var(--dim)] line-clamp-3">{movie.title}</span>
          </div>
        )}

        {/* TOP badge */}
        {movie.rating > 7.5 && (
          <div
            className="absolute top-0 left-0 text-[var(--oled)] text-[8px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5"
            style={{ background: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
          >
            Top
          </div>
        )}

        {/* TV badge */}
        {movie.type === 'tv' && (
          <div
            className="absolute top-0 right-0 text-[var(--dim)] text-[8px] tracking-[0.15em] uppercase px-2 py-0.5 border-l border-b border-[var(--hairline)]"
            style={{ background: 'var(--card)', fontFamily: 'var(--font-mono)' }}
          >
            TV
          </div>
        )}
      </div>

      {/* Info below poster */}
      {showInfo && (
        <div className="mt-1.5 px-0.5">
          <h3
            className="text-[var(--ivory)] text-[13px] leading-snug truncate group-hover/card:text-[var(--accent)] transition-colors duration-200"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500 }}
          >
            {movie.title}
          </h3>
          {caption && (
            <p
              className="text-[var(--dim)] text-[10px] tracking-[0.06em] mt-0.5 truncate"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {caption}
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
