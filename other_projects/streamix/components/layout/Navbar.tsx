'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const mediaParam = searchParams.get('media');

  const isActive = (href: string) => {
    if (href === '/browse' && pathname === '/browse' && !searchParams.get('type') && !mediaParam) return true;
    if (href === '/' && pathname === '/') return true;
    if (href === '/?media=series') return pathname === '/' && mediaParam === 'series';
    if (href === '/browse/watchlist') return pathname === '/browse/watchlist';
    if (href === '/browse/history') return pathname === '/browse/history';
    return false;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => { setDrawerOpen(false); setProfileOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/browse', label: 'Home' },
    { href: '/?media=series', label: 'TV Series' },
    { href: '/browse/watchlist', label: 'My List' },
    { href: '/browse/history', label: 'History' },
  ];

  const drawerLinks = [
    { href: '/browse', label: 'Home', icon: '⌂' },
    { href: '/', label: 'Browse', icon: '🎬' },
    { href: '/?media=series', label: 'TV Series', icon: '📺' },
    { href: '/browse/watchlist', label: 'My List', icon: '📋' },
    { href: '/browse/history', label: 'History', icon: '🕐' },
  ];

  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 bg-[#03171E] border-r border-[#1e4a5c] flex flex-col transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e4a5c]">
          <Link href="/browse">
            <span className="font-display text-2xl text-[#00A0EC] tracking-widest">STREAMIX</span>
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="text-[#7a9caa] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-4 mb-1">
            <p className="text-[#7a9caa] text-[10px] uppercase tracking-widest font-semibold mb-1">Navigate</p>
          </div>
          {drawerLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className={`drawer-link ${isActive(link.href) ? 'active' : ''}`}>
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {!user && (
            <div className="px-4 py-6 space-y-3 mt-4">
              <Link href="/login" className="block w-full text-center btn-outline py-2 text-sm rounded">Sign In</Link>
              <Link href="/register" className="block w-full text-center btn-primary py-2 text-sm rounded">Get Started</Link>
            </div>
          )}
        </div>

        {user && (
          <div className="border-t border-[#1e4a5c] px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-[#00A0EC] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{user.name}</p>
                <p className="text-xs text-[#7a9caa] truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full text-left text-sm text-[#7a9caa] hover:text-white transition-colors py-1">
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Top Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled ? 'bg-[#03171E] border-b border-[#1e4a5c]' : 'bg-gradient-to-b from-[#03171E]/90 to-transparent'
      }`}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)}
              className="text-[#7a9caa] hover:text-white transition-colors p-1" aria-label="Menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/browse">
              <span className="font-display text-2xl text-[#00A0EC] tracking-widest">STREAMIX</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-0.5 ml-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    isActive(link.href)
                      ? 'text-white bg-white/10 font-semibold'
                      : 'text-[#7a9caa] hover:text-white hover:bg-white/5'
                  }`}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Search */}
                <div className="flex items-center">
                  {searchOpen ? (
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                      <input ref={searchRef} type="text" value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search movies & shows..."
                        className="bg-[#0d2630] border border-[#1e4a5c] text-white text-sm px-3 py-1.5 rounded w-52 focus:outline-none focus:border-[#00A0EC] transition-all"
                        onBlur={() => { if (!searchQuery) setSearchOpen(false); }} />
                      <button type="submit" className="text-[#00A0EC]"><SearchIcon /></button>
                    </form>
                  ) : (
                    <button onClick={() => setSearchOpen(true)}
                      className="text-[#7a9caa] hover:text-white transition-colors" aria-label="Search">
                      <SearchIcon />
                    </button>
                  )}
                </div>

                {/* Profile */}
                <div className="relative">
                  <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#00A0EC] flex items-center justify-center text-white font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-[#0d2630] border border-[#1e4a5c] rounded shadow-2xl py-1 z-50">
                      <div className="px-3 py-2 border-b border-[#1e4a5c]">
                        <p className="text-xs text-white font-medium truncate">{user.name}</p>
                        <p className="text-[11px] text-[#7a9caa] truncate">{user.email}</p>
                      </div>
                      <Link href="/browse/history" className="block px-3 py-2 text-xs text-[#7a9caa] hover:text-white hover:bg-[#1a3a48] transition-colors">Watch History</Link>
                      <Link href="/browse/watchlist" className="block px-3 py-2 text-xs text-[#7a9caa] hover:text-white hover:bg-[#1a3a48] transition-colors">My List</Link>
                      <button onClick={logout}
                        className="w-full text-left px-3 py-2 text-xs text-[#7a9caa] hover:text-white hover:bg-[#1a3a48] transition-colors border-t border-[#1e4a5c]">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-[#7a9caa] hover:text-white transition-colors px-2 py-1">Sign In</Link>
                <Link href="/register" className="btn-primary text-xs py-1.5 px-3 rounded">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
