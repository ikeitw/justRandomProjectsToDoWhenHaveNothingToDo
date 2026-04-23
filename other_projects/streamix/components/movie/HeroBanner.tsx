'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MediaItem } from '@/lib/vidapi';

export default function HeroBanner({ movies }: { movies: MediaItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const featured = movies.slice(0, 5);
  const movie = featured[currentIndex];

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

  // VidAPI posters are already full TMDB URLs – use them directly
  // Upgrade w342 to w780 for the hero banner
  const backdropUrl = movie.poster_url
    ? movie.poster_url.replace('/w342/', '/w780/').replace('/original/', '/w780/')
    : null;

  return (
    <div className="relative w-full h-[52vw] max-h-[650px] min-h-[380px] overflow-hidden">
      {backdropUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdropUrl}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-400 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      <div className="hero-gradient absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#03171E]/80 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#03171E] to-transparent" />

      <div className={`absolute inset-0 flex flex-col justify-end pb-16 px-8 sm:px-14 transition-opacity duration-400 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#00A0EC] text-xs font-bold uppercase tracking-widest">
              #{currentIndex + 1} {movie.type === 'tv' ? 'Latest Series' : 'Latest Movie'}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#7a9caa]" />
            {movie.year && <span className="text-[#7a9caa] text-xs">{movie.year}</span>}
            {movie.type === 'tv' && (
              <span className="bg-[#0d2630] border border-[#1e4a5c] text-[#7a9caa] text-[10px] font-bold px-1.5 py-0.5 rounded">TV SERIES</span>
            )}
          </div>

          <h1 className="text-white font-display text-5xl sm:text-6xl tracking-wide leading-none mb-3 drop-shadow-2xl">
            {movie.title}
          </h1>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="flex items-center gap-1 text-yellow-400 font-semibold text-sm">
              <span>★</span><span>{movie.rating.toFixed(1)}</span>
            </span>
            {movie.rating > 7 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-900/60 text-green-400 border border-green-700/40">
                CERTIFIED FRESH
              </span>
            )}
            <span className="border border-[#1e4a5c] text-[#7a9caa] text-xs px-1.5 py-0.5 rounded">HD</span>
            {movie.genre && (
              <span className="text-[#7a9caa] text-xs">{movie.genre.split(',')[0].trim()}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/watch/${movie.id}?type=${movie.type}`}
              className="flex items-center gap-2 bg-[#00A0EC] hover:bg-[#0088cc] text-white font-bold px-5 py-2.5 rounded transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Play Now
            </Link>
            <Link
              href={`/watch/${movie.id}?type=${movie.type}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded transition-colors border border-white/20 text-sm backdrop-blur-sm"
            >
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-6 right-8 flex items-center gap-1.5">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentIndex(i); setIsTransitioning(false); }}
            className={`h-0.5 transition-all duration-300 rounded-full ${i === currentIndex ? 'w-6 bg-[#00A0EC]' : 'w-3 bg-white/30'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
