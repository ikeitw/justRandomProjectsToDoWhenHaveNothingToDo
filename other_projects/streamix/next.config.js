/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['image.tmdb.org', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Allow vaplayer.ru iframes; don't block ourselves
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  // Allow fetching from VidAPI listing endpoints
  async rewrites() {
    return [];
  },
  webpack: (config) => {
    config.externals.push({ 'pg-native': 'pg-native' });
    return config;
  },
};

module.exports = nextConfig;
