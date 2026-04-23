'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MediaItem } from '@/lib/vidapi';

interface MovieCardProps {
  movie: MediaItem;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
}

export default function MovieCard({ movie, size = 'md', showInfo = true }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = { sm: 'w-28 sm:w-32', md: 'w-36 sm:w-44', lg: 'w-44 sm:w-56' };

  // Build the watch URL including media type so the watch page knows what to embed
  const watchUrl = `/watch/${movie.id}?type=${movie.type}`;

  return (
    <Link href={watchUrl} className={`movie-card ${sizeClasses[size]} group`}>
      <div className="relative rounded overflow-hidden bg-[#0d2630] border border-[#1e4a5c]/40 aspect-[2/3]">
        {!imageLoaded && !imageError && <div className="absolute inset-0 skeleton" />}

        {movie.poster_url && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
            <span className="text-3xl mb-2">{movie.type === 'tv' ? '📺' : '🎬'}</span>
            <span className="text-xs text-[#7a9caa] line-clamp-3">{movie.title}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#03171E] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-white text-xs font-medium">{movie.rating.toFixed(1)}</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#00A0EC] flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {movie.rating > 7.5 && (
          <div className="absolute top-1.5 left-1.5 bg-[#00A0EC] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">TOP</div>
        )}
        {movie.type === 'tv' && (
          <div className="absolute top-1.5 right-1.5 bg-[#0d2630]/80 text-[#7a9caa] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#1e4a5c]">TV</div>
        )}
      </div>

      {showInfo && (
        <div className="mt-1.5 px-0.5">
          <h3 className="text-white text-xs font-medium truncate group-hover:text-[#00A0EC] transition-colors">{movie.title}</h3>
          {movie.year && <p className="text-[#7a9caa] text-[11px] mt-0.5">{movie.year}</p>}
        </div>
      )}
    </Link>
  );
}
