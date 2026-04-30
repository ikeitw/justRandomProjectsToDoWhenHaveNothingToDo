import { Suspense } from 'react';
import { AuthProvider } from '@/components/AuthContext';
import Navbar from '@/components/layout/Navbar';

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-[#03171E] border-b border-[#1e4a5c]">
          <div className="max-w-[1800px] mx-auto px-6 flex items-center h-full gap-4">
            <div className="w-24 h-5 skeleton rounded" />
            <div className="w-16 h-4 skeleton rounded" />
            <div className="w-16 h-4 skeleton rounded" />
          </div>
        </div>
      }>
        <Navbar />
      </Suspense>
      <main className="pt-0">{children}</main>
      <footer className="mt-16 border-t border-[#1e4a5c]/50 py-8 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-display text-xl text-[#00A0EC] tracking-widest mb-1">STREAMIX</p>
            <p className="text-[#7a9caa] text-xs">
              Streaming powered by{' '}
              <a href="https://vidapi.ru" className="text-[#7a9caa] hover:text-white transition-colors underline"
                target="_blank" rel="noopener noreferrer">VidAPI</a>
              {' '}· Metadata by{' '}
              <a href="https://www.themoviedb.org" className="text-[#7a9caa] hover:text-white transition-colors underline"
                target="_blank" rel="noopener noreferrer">TMDb</a>
            </p>
          </div>
          <p className="text-[#7a9caa] text-xs">© {new Date().getFullYear()} Streamix</p>
        </div>
      </footer>
    </AuthProvider>
  );
}
