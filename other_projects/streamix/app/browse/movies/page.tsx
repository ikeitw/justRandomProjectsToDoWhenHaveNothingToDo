import { Suspense } from 'react';
import MoviesClient from './MoviesClient';

export const metadata = { title: 'Movies — Streamix' };

export default function MoviesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#03171E] pt-24 px-4 sm:px-8 max-w-[1800px] mx-auto">
        <div className="h-7 w-40 skeleton rounded mb-6" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-full aspect-[2/3] skeleton rounded" />
          ))}
        </div>
      </div>
    }>
      <MoviesClient />
    </Suspense>
  );
}
