'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import CTA from '@/components/ui/CTA';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  const isActive = (href: string) => {
    if (href === '/browse' && pathname === '/browse') return true;
    if (href === '/browse/movies' && pathname === '/browse/movies') return true;
    if (href === '/browse/series' && pathname === '/browse/series') return true;
    if (href === '/browse/watchlist' && pathname === '/browse/watchlist') return true;
    if (href === '/browse/history' && pathname === '/browse/history') return true;
    return false;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ⌘K / Ctrl+K focuses the desktop search input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (pathname === '/browse/series') {
      router.push(`/browse/series?q=${encodeURIComponent(q)}`);
    } else {
      router.push(`/browse/movies?q=${encodeURIComponent(q)}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Desktop nav — clean labels, no emojis
  const navLinks = [
    { href: '/browse', label: 'Home' },
    { href: '/browse/movies', label: 'Movies' },
    { href: '/browse/series', label: 'Series' },
    { href: '/browse/watchlist', label: 'My List' },
    { href: '/browse/history', label: 'History' },
  ];

  // Mobile drawer — keeps icons for spatial context
  const drawerLinks = [
    { href: '/browse', label: 'Home', icon: '⌂' },
    { href: '/browse/movies', label: 'Movies', icon: '🎬' },
    { href: '/browse/series', label: 'TV Series', icon: '📺' },
    { href: '/browse/watchlist', label: 'My List', icon: '📋' },
    { href: '/browse/history', label: 'History', icon: '🕐' },
    { href: '/browse/settings', label: 'Settings', icon: '⚙' },
    { href: '/profiles', label: 'Profiles', icon: '◈' },
  ];

  return (
    <>
      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 border-r border-[var(--hairline)] flex flex-col transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--graphite)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)]">
          <Link href="/browse">
            <Wordmark />
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-[var(--dim)] hover:text-[var(--ivory)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer nav */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-4 mb-1">
            <p
              className="text-[var(--dim)] text-[9px] tracking-[0.2em] uppercase mb-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Navigate
            </p>
          </div>
          {drawerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`drawer-link ${isActive(link.href) ? 'active' : ''}`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {!user && (
            <div className="px-4 py-6 space-y-3 mt-4">
              <CTA href="/login" variant="outline" size="sm" className="w-full justify-center">
                Sign In
              </CTA>
              <CTA href="/register" variant="primary" size="sm" className="w-full justify-center">
                Get Started
              </CTA>
            </div>
          )}
        </div>

        {/* Drawer footer — authenticated user */}
        {user && (
          <div className="border-t border-[var(--hairline)] px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 flex items-center justify-center text-[var(--ivory)] text-sm flex-shrink-0"
                style={{ background: '#3a2e1c', fontFamily: 'var(--font-serif)', fontWeight: 500 }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[var(--ivory)] font-medium truncate">{user.name}</p>
                <p className="text-xs text-[var(--dim)] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full text-left text-xs text-[var(--dim)] hover:text-[var(--ivory)] transition-colors py-1"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* ── Top navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[var(--hairline)]'
            : ''
        }`}
        style={{
          background: scrolled
            ? 'var(--oled)'
            : 'linear-gradient(180deg, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0) 100%)',
        }}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between h-14">

          {/* Left: hamburger (mobile) + wordmark + desktop nav */}
          <div className="flex items-center gap-3 lg:gap-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-[var(--dim)] hover:text-[var(--ivory)] transition-colors p-1 lg:hidden"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/browse" className="lg:mr-8">
              <Wordmark />
            </Link>

            {/* Vertical hairline separator — desktop only */}
            <div className="hidden lg:block w-px h-4 bg-[var(--dimmer)] mr-8" />

            {/* Desktop nav links — mono uppercase, hairline-bottom for active */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`pb-0.5 transition-colors text-[11px] tracking-[0.1em] uppercase ${
                    isActive(link.href)
                      ? 'text-[var(--ivory)] border-b border-[var(--accent)]'
                      : 'text-[var(--dim)] border-b border-transparent hover:text-[var(--ivory)]'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: search + profile */}
          <div className="flex items-center gap-3 lg:gap-5">

            {/* Desktop search — always visible, hairline border + ⌘K hint */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 border border-[var(--hairline)] min-w-[240px]" style={{ background: 'rgba(5,5,5,0.4)' }}>
              <svg className="w-3 h-3 text-[var(--dim)] flex-shrink-0" fill="none" viewBox="0 0 14 14">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
                <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, people, moods…"
                className="flex-1 bg-transparent text-[var(--ivory)] text-[12px] outline-none min-w-0 placeholder:text-[var(--dimmer)]"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
              <span
                className="ml-auto text-[var(--dimmer)] flex-shrink-0"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em' }}
              >
                ⌘K
              </span>
            </form>

            {/* Mobile search — toggle */}
            <div className="flex lg:hidden items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search…"
                    className="border border-[var(--hairline)] text-[var(--ivory)] text-sm px-3 py-1.5 w-44 outline-none focus:border-[var(--accent)] transition-colors"
                    style={{ background: 'rgba(5,5,5,0.8)', fontFamily: 'var(--font-sans)' }}
                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                  />
                  <button type="submit" className="text-[var(--accent)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 14 14">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
                      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="text-[var(--dim)] hover:text-[var(--ivory)] transition-colors"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>

            {user ? (
              /* Profile dropdown */
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2"
                  aria-label="Profile"
                >
                  <div
                    className="w-7 h-7 flex items-center justify-center text-[var(--ivory)] text-sm"
                    style={{ background: '#3a2e1c', fontFamily: 'var(--font-serif)', fontWeight: 500 }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-44 border border-[var(--hairline)] shadow-2xl py-1 z-50"
                    style={{ background: 'var(--card)' }}
                  >
                    <div className="px-3 py-2 border-b border-[var(--hairline)]">
                      <p className="text-xs text-[var(--ivory)] font-medium truncate">{user.name}</p>
                      <p className="text-[11px] text-[var(--dim)] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/browse/history"
                      className="block px-3 py-2 text-xs text-[var(--dim)] hover:text-[var(--ivory)] hover:bg-white/[0.04] transition-colors"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                    >
                      Watch History
                    </Link>
                    <Link
                      href="/browse/watchlist"
                      className="block px-3 py-2 text-xs text-[var(--dim)] hover:text-[var(--ivory)] hover:bg-white/[0.04] transition-colors"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                    >
                      My List
                    </Link>
                    <Link
                      href="/browse/settings"
                      className="block px-3 py-2 text-xs text-[var(--dim)] hover:text-[var(--ivory)] hover:bg-white/[0.04] transition-colors"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/profiles"
                      className="block px-3 py-2 text-xs text-[var(--dim)] hover:text-[var(--ivory)] hover:bg-white/[0.04] transition-colors"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                    >
                      Switch Profile
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--dim)] hover:text-[var(--ivory)] hover:bg-white/[0.04] transition-colors border-t border-[var(--hairline)]"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-[var(--dim)] hover:text-[var(--ivory)] transition-colors"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  Sign In
                </Link>
                <CTA href="/register" variant="primary" size="sm">
                  Get Started
                </CTA>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

// ── Wordmark — Inter Tight 600, gold diamond, ivory text ──
function Wordmark() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[var(--ivory)]"
      style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, letterSpacing: '0.32em' }}
    >
      <span
        className="inline-block w-1.5 h-1.5 flex-shrink-0"
        style={{ background: 'var(--accent)', transform: 'rotate(45deg)' }}
      />
      STREAMIX
    </span>
  );
}
