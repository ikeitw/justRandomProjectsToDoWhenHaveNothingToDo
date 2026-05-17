'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import Eyebrow from '@/components/ui/Eyebrow';
import CTA from '@/components/ui/CTA';

interface HistoryItem {
  id: number;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_rating: number;
  movie_year: number | null;
  watched_at: string;
}

function ProfilesInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/history?limit=5')
      .then((r) => r.json())
      .then((d) => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--oled)' }}>
        <div className="w-10 h-10 border border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lastWatched = history[0] ?? null;
  const recentPosters = history.slice(0, 4);

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--oled)', color: 'var(--ivory)', fontFamily: 'var(--font-sans)' }}
    >
      {/* Ambient radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1612 0%, #050403 70%)', opacity: 0.8 }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 sm:px-12 py-8">
        <Link href="/browse" className="inline-flex items-center gap-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, letterSpacing: '0.32em', color: 'var(--ivory)' }}>
          <span className="inline-block w-1.5 h-1.5 flex-shrink-0" style={{ background: 'var(--accent)', transform: 'rotate(45deg)' }} />
          STREAMIX
        </Link>
        <Link
          href="/browse/settings"
          className="border border-[var(--hairline)] px-4 py-2 text-[var(--dim)] hover:text-[var(--ivory)] hover:border-[var(--accent)]/40 transition-colors"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          Manage Profiles
        </Link>
      </div>

      {/* Center */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <Eyebrow label="Welcome back" />
        <h1
          className="text-center mt-4"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(32px, 6vw, 88px)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            color: 'var(--ivory)',
          }}
        >
          Who is watching tonight?
        </h1>

        {/* Profile cards */}
        <div className="flex gap-8 sm:gap-14 mt-14 flex-wrap justify-center">
          <ProfileCard
            initial={user.name.charAt(0).toUpperCase()}
            name={user.name}
            tint="#1c1915"
            active
            label="Adult"
            onClick={() => router.push('/browse')}
          />
          <ProfileCard
            initial="+"
            name="Add Profile"
            tint="#0f0e0c"
            active={false}
            label="New"
            muted
            onClick={() => {}}
          />
        </div>

        {/* Keyboard hint */}
        <div
          className="mt-14 flex items-center gap-5 text-[var(--dimmer)]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          <span>Click to enter</span>
          <span className="w-px h-3 bg-[var(--dimmer)]" />
          <span>Settings in top right</span>
        </div>
      </div>

      {/* Bottom strip — last watched */}
      {historyLoaded && lastWatched && (
        <div
          className="relative z-10 mx-6 sm:mx-12 mb-8 p-6 sm:p-8 border border-[var(--hairline)] grid grid-cols-1 sm:grid-cols-3 gap-8"
          style={{ background: 'rgba(20,18,15,0.6)', backdropFilter: 'blur(12px)' }}
        >
          {/* Last watched title */}
          <div>
            <Eyebrow label={`${user.name.split(' ')[0]} · last watched`} />
            <div
              className="mt-3 leading-tight"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(18px, 2.5vw, 26px)', color: 'var(--ivory)' }}
            >
              {lastWatched.movie_title}
            </div>
            <div
              className="mt-1.5"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dim)' }}
            >
              {lastWatched.movie_year && `${lastWatched.movie_year} · `}★ {Number(lastWatched.movie_rating).toFixed(1)}
            </div>
          </div>

          {/* Recent poster strip */}
          <div className="flex items-center gap-3">
            {recentPosters.map((item) => (
              <div key={item.id} className="w-12 sm:w-14 aspect-[2/3] bg-[var(--card)] overflow-hidden flex-shrink-0">
                {item.movie_poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.movie_poster} alt={item.movie_title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[var(--dim)] text-[8px]">{item.movie_title.slice(0, 2)}</span>
                  </div>
                )}
              </div>
            ))}
            {history.length > 4 && (
              <div
                className="ml-1 text-[var(--dim)] leading-snug"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                +{history.length - 4}<br />MORE
              </div>
            )}
          </div>

          {/* Resume CTA */}
          <div className="flex flex-col items-start sm:items-end justify-center gap-3">
            <CTA href={`/watch/${lastWatched.movie_id}`} variant="primary">
              Resume Watching
            </CTA>
            <span
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dim)' }}
            >
              Or click your profile above
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileCard({
  initial, name, tint, active, label, muted = false, onClick,
}: {
  initial: string;
  name: string;
  tint: string;
  active: boolean;
  label: string;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center group focus:outline-none">
      <div
        className="relative w-28 sm:w-32 aspect-square flex items-center justify-center transition-all duration-300"
        style={{
          background: tint,
          border: `1px solid ${active ? 'var(--accent)' : 'var(--hairline)'}`,
          boxShadow: active ? '0 0 0 6px rgba(200,155,90,0.06)' : 'none',
        }}
      >
        {/* Diagonal texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 14px)' }}
        />
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: muted ? 40 : 64,
            color: muted ? 'var(--dimmer)' : 'var(--ivory)',
            position: 'relative',
            lineHeight: 1,
          }}
        >
          {initial}
        </span>
        {active && (
          <div className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="var(--oled)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/5 transition-colors duration-200" />
      </div>
      <div
        className="mt-4 transition-colors duration-200"
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 22,
          color: active ? 'var(--ivory)' : 'var(--text-2)',
        }}
      >
        {name}
      </div>
      <div
        className="mt-1.5"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: active ? 'var(--accent)' : 'var(--dim)',
        }}
      >
        {label}
      </div>
    </button>
  );
}

export default function ProfilesPage() {
  return (
    <AuthProvider>
      <ProfilesInner />
    </AuthProvider>
  );
}
