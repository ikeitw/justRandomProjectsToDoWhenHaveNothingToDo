'use client';

import { useRef } from 'react';
import MovieCard from './MovieCard';
import Eyebrow from '@/components/ui/Eyebrow';
import { MediaItem } from '@/lib/vidapi';

interface MovieRowProps {
  title: string;
  eyebrow?: string;
  movies: MediaItem[];
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const SIZE_WIDTH: Record<string, string> = {
  sm: 'w-28 sm:w-32',
  md: 'w-36 sm:w-44',
  lg: 'w-44 sm:w-56',
};

export default function MovieRow({ title, eyebrow, movies, size = 'md', loading = false }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Scroll logic unchanged from original
  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: dir === 'right' ? rowRef.current.clientWidth * 0.75 : -rowRef.current.clientWidth * 0.75,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="mb-10">
        <div className="h-2.5 w-20 skeleton mb-1.5" />
        <div className="h-6 w-52 skeleton mb-4" />
        <div className="h-px bg-[var(--hairline)] mb-3" />
        <div className="flex gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`${SIZE_WIDTH[size]} aspect-[2/3] skeleton flex-shrink-0`} />
          ))}
        </div>
      </div>
    );
  }

  if (!movies.length) return null;

  return (
    <div className="mb-10 group/row">
      {/* Header */}
      <div className="px-1 mb-2">
        <Eyebrow label={eyebrow ?? 'TITLES'} number={String(movies.length)} className="mb-1.5" />
        <h2
          className="text-[var(--ivory)] text-xl sm:text-2xl leading-none"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500 }}
        >
          {title}
        </h2>
      </div>

      {/* Hairline separator */}
      <div className="h-px bg-[var(--hairline)] mx-1 mb-3" />

      {/* Scrollable row */}
      <div className="relative">
        {/* Left arrow — square, appears on row hover */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-r from-[var(--oled)] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-start"
          aria-label="Scroll left"
        >
          <div className="w-7 h-7 bg-[var(--card)] border border-[var(--hairline)] flex items-center justify-center hover:border-[var(--accent)] transition-colors">
            <svg className="w-3.5 h-3.5 text-[var(--ivory)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </button>

        {/* Right arrow — square, appears on row hover */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-l from-[var(--oled)] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-end"
          aria-label="Scroll right"
        >
          <div className="w-7 h-7 bg-[var(--card)] border border-[var(--hairline)] flex items-center justify-center hover:border-[var(--accent)] transition-colors">
            <svg className="w-3.5 h-3.5 text-[var(--ivory)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Scroll container — ref and behavior unchanged */}
        <div ref={rowRef} className="movie-row px-1 py-2">
          {movies.map((movie) => (
            <div key={`${movie.id}-${movie.type}`} className={`flex-shrink-0 ${SIZE_WIDTH[size]}`}>
              <MovieCard movie={movie} size={size} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
