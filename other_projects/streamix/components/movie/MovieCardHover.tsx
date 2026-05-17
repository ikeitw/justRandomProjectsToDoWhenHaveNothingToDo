'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import MovieCard from './MovieCard';
import { MediaItem } from '@/lib/vidapi';

interface MovieCardHoverProps {
  movie: MediaItem;
  size?: 'sm' | 'md' | 'lg';
}

export default function MovieCardHover({ movie, size = 'md' }: MovieCardHoverProps) {
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchUrl = `/watch/${movie.id}?type=${movie.type}`;

  const handleEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setActive(true), 600);
  }, []);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(false);
  }, []);

  const genres = movie.genre?.split(',').map((g) => g.trim()).filter(Boolean).slice(0, 3) ?? [];

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <MovieCard movie={movie} size={size} />

      <AnimatePresence>
        {active && (
          // Wrapper positions the preview card centered over the poster
          <div
            key="hover-preview"
            className="absolute top-0 left-1/2 z-50 pointer-events-none"
            style={{ transform: 'translateX(-50%)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="pointer-events-auto"
              style={{
                width: 236,
                background: 'var(--card)',
                border: '1px solid var(--hairline)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(200,155,90,0.08)',
              }}
            >
              {/* Top image — 16:9 crop of poster */}
              <div className="aspect-[16/9] overflow-hidden bg-[var(--surface)]">
                {movie.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 20%' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">{movie.type === 'tv' ? '📺' : '🎬'}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3
                  className="text-[var(--ivory)] leading-tight mb-1.5 line-clamp-2"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    fontSize: 17,
                  }}
                >
                  {movie.title}
                </h3>

                {/* Year · rating · type */}
                <div
                  className="flex items-center gap-2 mb-2.5"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dim)', letterSpacing: '0.08em' }}
                >
                  {movie.year && <span>{movie.year}</span>}
                  {movie.rating > 0 && (
                    <span style={{ color: 'var(--accent)' }}>★ {movie.rating.toFixed(1)}</span>
                  )}
                  {movie.type === 'tv' && (
                    <span className="border border-[var(--hairline)] px-1">Series</span>
                  )}
                </div>

                {/* Genre tags */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {genres.map((g) => (
                      <span
                        key={g}
                        className="border border-[var(--hairline)] px-2 py-0.5"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--dim)',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="flex gap-2">
                  <Link
                    href={watchUrl}
                    className="flex-1 h-8 flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--oled)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </Link>
                  <button
                    className="h-8 px-3 border border-[var(--hairline)] hover:border-[var(--accent)] transition-colors"
                    style={{
                      color: 'var(--ivory)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    + List
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
