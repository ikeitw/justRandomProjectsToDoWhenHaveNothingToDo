import type { Metadata } from 'next';
import './globals.css';

// SEO metadata for root layout
export const metadata: Metadata = {
  title: 'Streamix — Watch Movies Online',
  description: 'Stream thousands of movies in HD. No ads. No interruptions.',
  keywords: 'movies, streaming, watch online, HD movies',
  openGraph: {
    title: 'Streamix',
    description: 'Stream thousands of movies in HD',
    type: 'website',
  },
};

// Root layout with font preloading and global styles
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
          <title></title>
      </head>
      <body className="bg-netflix-dark text-white antialiased">
        {children}
      </body>
    </html>
  );
}
