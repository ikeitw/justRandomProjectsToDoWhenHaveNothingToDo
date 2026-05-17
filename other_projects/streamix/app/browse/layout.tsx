import { Suspense } from 'react';
import { AuthProvider } from '@/components/AuthContext';
import Navbar from '@/components/layout/Navbar';

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="fixed top-0 left-0 right-0 z-30 h-14 border-b border-[var(--hairline)]" style={{ background: 'var(--oled)' }}>
          <div className="max-w-[1800px] mx-auto px-6 flex items-center h-full gap-4">
            <div className="w-24 h-5 skeleton" />
            <div className="w-16 h-4 skeleton" />
            <div className="w-16 h-4 skeleton" />
          </div>
        </div>
      }>
        <Navbar />
      </Suspense>
      <main className="pt-0">{children}</main>
      <footer className="mt-16 border-t border-[var(--hairline)] py-8 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span
              className="inline-flex items-center gap-1.5 mb-1"
              style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, letterSpacing: '0.32em', color: 'var(--ivory)' }}
            >
              <span
                className="inline-block w-1.5 h-1.5 flex-shrink-0"
                style={{ background: 'var(--accent)', transform: 'rotate(45deg)' }}
              />
              STREAMIX
            </span>
            <p className="text-[var(--dim)] text-xs mt-1">
              Streaming powered by{' '}
              <a href="https://vidapi.ru" className="text-[var(--dim)] hover:text-[var(--ivory)] transition-colors underline"
                target="_blank" rel="noopener noreferrer">VidAPI</a>
              {' '}· Metadata by{' '}
              <a href="https://www.themoviedb.org" className="text-[var(--dim)] hover:text-[var(--ivory)] transition-colors underline"
                target="_blank" rel="noopener noreferrer">TMDb</a>
            </p>
          </div>
          <p className="text-[var(--dim)] text-xs" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            © {new Date().getFullYear()} Streamix
          </p>
        </div>
      </footer>
    </AuthProvider>
  );
}
