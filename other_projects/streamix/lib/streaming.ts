export interface StreamProvider {
  name: string;
  getUrl: (movieId: number) => string;
  isIframe: boolean;
}

export const STREAM_PROVIDERS: StreamProvider[] = [
  {
    name: 'VidAPI',
    getUrl: (movieId) => `https://vaplayer.ru/embed/movie/${movieId}`,
    isIframe: true,
  },
];

export const getStreamUrl = (movieId: number, providerIndex = 0): string => {
  const provider = STREAM_PROVIDERS[providerIndex] ?? STREAM_PROVIDERS[0];
  return provider.getUrl(movieId);
};

export const getProviderName = (index: number): string => {
  return STREAM_PROVIDERS[index]?.name ?? 'Unknown';
};