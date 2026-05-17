'use client';

import { useState, useEffect } from 'react';
import { MediaItem } from '@/lib/vidapi';
import CTA from '@/components/ui/CTA';
import Eyebrow from '@/components/ui/Eyebrow';

const TMDB_ORIGINAL = 'https://image.tmdb.org/t/p/original';

interface HeroBannerProps {
  movies: MediaItem[];
  backdropPaths?: (string | null)[];
}

export default function HeroBanner({ movies, backdropPaths = [] }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const featured = movies.slice(0, 5);
  const movie = featured[currentIndex];

  // Auto-rotate — logic unchanged from original
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % featured.length);
        setIsTransitioning(false);
      }, 400);
    }, 8000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!movie) return null;

  const backdropPath = backdropPaths[currentIndex] ?? null;
  const backdropUrl = backdropPath ? `${TMDB_ORIGINAL}${backdropPath}` : null;
  // Fallback: poster_url at larger size when no TMDB backdrop
  const fallbackUrl = movie.poster_url
    ? movie.poster_url.replace('/w342/', '/w780/').replace('/original/', '/w780/')
    : null;
  const imageUrl = backdropUrl ?? fallbackUrl;

  const watchUrl = `/watch/${movie.id}?type=${movie.type}`;

  return (
    <div className="relative w-full h-[56vw] sm:h-[52vw] max-h-[760px] min-h-[460px] overflow-hidden bg-[var(--oled)]">

      {/* Backdrop — cross-fade on slide change */}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-[400ms] ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Mood gradient — shown when no image at all */}
      {!imageUrl && (
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 70% 40%, #1a2733 0%, #0d1820 50%, #050403 100%)' }}
        />
      )}

      {/* Film grain texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 2px)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Top vignette + bottom fade to page */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.55) 0%, transparent 18%, transparent 58%, #050403 100%)' }}
      />

      {/* Left-to-right vignette — pushes content left off backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(5,5,5,0.88) 0%, rgba(5,5,5,0.45) 38%, transparent 68%)' }}
      />

      {/* Content — also fades on slide change */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-[400ms] ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="px-8 sm:px-12 pb-16 sm:pb-20 max-w-[720px]">

          <Eyebrow
            number={`No. 0${currentIndex + 1}`}
            label={movie.type === 'tv' ? 'Featured Series' : 'Featured Tonight'}
            className="mb-5"
          />

          {/* Centrepiece title — fluid scale clamped at 124px */}
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(44px, 8.5vw, 124px)',
              lineHeight: 0.92,
              letterSpacing: '-0.025em',
              color: 'var(--ivory)',
              margin: '20px 0 20px',
            }}
          >
            {movie.title}
          </h1>

          {/* Meta row — year · genre · rating with vertical hairlines */}
          <div
            className="flex items-center flex-wrap mb-8"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-2)' }}
          >
            {movie.year && (
              <>
                <span>{movie.year}</span>
                <span className="inline-block w-px h-2.5 bg-[var(--dimmer)] mx-3" />
              </>
            )}
            {movie.genre && (
              <>
                <span style={{ color: 'var(--accent)' }}>{movie.genre.split(',')[0].trim()}</span>
                <span className="inline-block w-px h-2.5 bg-[var(--dimmer)] mx-3" />
              </>
            )}
            {movie.rating > 0 && <span>★ {movie.rating.toFixed(1)}</span>}
            {movie.type === 'tv' && (
              <>
                <span className="inline-block w-px h-2.5 bg-[var(--dimmer)] mx-3" />
                <span
                  className="border border-[var(--hairline)] px-2 py-0.5"
                  style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}
                >
                  Series
                </span>
              </>
            )}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <CTA
              href={watchUrl}
              variant="primary"
              size="lg"
              icon={
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 14 14">
                  <path d="M3 2L11.5 7L3 12V2Z" />
                </svg>
              }
            >
              Play
            </CTA>
            <CTA
              href="/browse/watchlist"
              variant="outline"
              size="lg"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" viewBox="0 0 14 14">
                  <path d="M7 2V12M2 7H12" />
                </svg>
              }
            >
              My Library
            </CTA>
            <CTA
              href={watchUrl}
              variant="ghost"
              size="lg"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 14 14">
                  <circle cx="7" cy="7" r="5.5" />
                  <circle cx="7" cy="4.5" r="0.6" fill="currentColor" />
                  <path d="M7 6.5V10.5" strokeLinecap="round" />
                </svg>
              }
            >
              More
            </CTA>
          </div>
        </div>
      </div>

      {/* Slide indicators — bottom-right, asymmetric */}
      <div className="absolute bottom-6 right-8 sm:right-12 flex flex-col items-end gap-2">
        <div
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--dim)', letterSpacing: '0.2em' }}
        >
          0{currentIndex + 1} / 0{featured.length}
        </div>
        <div className="flex items-center gap-1">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setIsTransitioning(false); }}
              className="block h-px transition-all duration-[400ms]"
              style={{
                width: i === currentIndex ? 36 : 12,
                background: i === currentIndex ? 'var(--accent)' : 'var(--dimmer)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
