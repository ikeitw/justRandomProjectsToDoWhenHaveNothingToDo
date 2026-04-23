'use client';

import { useRef } from 'react';
import MovieCard from './MovieCard';
import { MediaItem } from '@/lib/vidapi';

interface MovieRowProps {
  title: string;
  movies: MediaItem[];
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function MovieRow({ title, movies, size = 'md', loading = false }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: dir === 'right' ? rowRef.current.clientWidth * 0.75 : -rowRef.current.clientWidth * 0.75,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-4 w-36 skeleton rounded mb-3" />
        <div className="flex gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-36 sm:w-44 aspect-[2/3] skeleton rounded flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!movies.length) return null;

  return (
    <div className="mb-8 group/row">
      <h2 className="text-white font-semibold text-sm sm:text-base mb-2.5 px-1 flex items-center gap-2">
        {title}
        <span className="text-[#7a9caa] text-xs font-normal">{movies.length} titles</span>
      </h2>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-r from-[#03171E] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-start"
          aria-label="Scroll left"
        >
          <div className="w-7 h-7 rounded-full bg-[#0d2630] border border-[#1e4a5c] flex items-center justify-center hover:border-[#00A0EC] transition-colors">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-l from-[#03171E] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-end"
          aria-label="Scroll right"
        >
          <div className="w-7 h-7 rounded-full bg-[#0d2630] border border-[#1e4a5c] flex items-center justify-center hover:border-[#00A0EC] transition-colors">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <div ref={rowRef} className="movie-row px-1 py-2">
          {movies.map((movie) => (
            <MovieCard key={`${movie.id}-${movie.type}`} movie={movie} size={size} />
          ))}
        </div>
      </div>
    </div>
  );
}
