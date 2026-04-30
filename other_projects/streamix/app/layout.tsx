import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Streamix — Watch Movies & TV Online',
  description: 'Stream thousands of movies and TV shows in HD.',
  keywords: 'movies, tv series, streaming, watch online, HD',
  openGraph: {
    title: 'Streamix',
    description: 'Stream thousands of movies and TV shows in HD',
    type: 'website',
  },
};

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
      </head>
      <body className="bg-netflix-dark text-white antialiased">
        {children}
      </body>
    </html>
  );
}
