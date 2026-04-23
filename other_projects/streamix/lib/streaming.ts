// Re-export from vidapi for backwards compat — all embed logic lives in vidapi.ts
export { movieEmbedUrl, tvEmbedUrl, STREAM_PROVIDERS } from './vidapi';

export interface StreamProvider {
  name: string;
  getUrl: (tmdbId: number) => string;
  isIframe: boolean;
}
