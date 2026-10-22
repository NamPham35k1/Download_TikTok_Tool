import { z } from 'zod';
import {
  TikTokMediaProvider,
  ProviderCapabilities,
  ProviderConfig,
  NormalizedMediaResult,
  VideoVariant,
  PhotoItem,
} from './types';

/**
 * Zod schema for RapidAPI TikTok Downloader response formats.
 */
const RapidApiResponseSchema = z.object({
  status: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
  data: z
    .object({
      id: z.string().optional(),
      title: z.string().optional(),
      cover: z.string().optional(),
      play: z.string().optional(),
      hdplay: z.string().optional(),
      wmplay: z.string().optional(),
      music: z.string().optional(),
      images: z.array(z.string()).optional(),
      author: z
        .object({
          unique_id: z.string().optional(),
          nickname: z.string().optional(),
          avatar: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export class RapidApiTikTokProvider implements TikTokMediaProvider {
  public readonly name = 'RapidAPI TikTok Provider';
  public readonly capabilities: ProviderCapabilities = {
    supportsVideo: true,
    supportsWatermarkFreeVideo: true,
    supportsHdVideo: true,
    supportsSlideshow: true,
    supportsAudioExtraction: true,
    requiresApiKey: true,
  };

  private apiKey?: string;
  private apiHost: string;
  private baseUrl: string;

  constructor(config?: ProviderConfig) {
    this.apiKey = config?.apiKey || process.env.RAPIDAPI_KEY || process.env.TIKTOK_PROVIDER_API_KEY;
    this.apiHost =
      process.env.RAPIDAPI_HOST || 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com';
    this.baseUrl = config?.baseUrl || `https://${this.apiHost}/index`;
  }

  public async resolveUrl(targetUrl: string): Promise<NormalizedMediaResult> {
    if (!this.apiKey) {
      throw new Error(
        'RapidAPI TikTok Provider requires an API key. Please set RAPIDAPI_KEY or TIKTOK_PROVIDER_API_KEY in your environment.'
      );
    }

    const endpoint = new URL(this.baseUrl);
    endpoint.searchParams.set('url', targetUrl);
    endpoint.searchParams.set('hd', '1');

    const res = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': this.apiHost,
        Accept: 'application/json',
      },
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('RapidAPI authentication failed. Please verify your RAPIDAPI_KEY.');
    }
    if (res.status === 429) {
      throw new Error('RapidAPI rate limit exceeded. Please try again later or upgrade your subscription.');
    }
    if (!res.ok) {
      throw new Error(`RapidAPI provider returned HTTP ${res.status}: ${res.statusText}`);
    }

    const rawJson = await res.json();
    const parsed = RapidApiResponseSchema.safeParse(rawJson);
    if (!parsed.success || !parsed.data.data) {
      throw new Error('RapidAPI response failed contract validation or returned no data.');
    }

    const data = parsed.data.data;
    const hasImages = Array.isArray(data.images) && data.images.length > 0;
    const contentType = hasImages ? 'slideshow' : 'video';

    const videoVariants: VideoVariant[] = [];
    if (data.hdplay) {
      videoVariants.push({
        id: 'no_watermark_hd',
        qualityLabel: 'HD (1080p) - No Watermark',
        hasWatermark: false,
        mimeType: 'video/mp4',
        downloadUrl: data.hdplay,
      });
    }
    if (data.play && data.play !== data.hdplay) {
      videoVariants.push({
        id: 'no_watermark',
        qualityLabel: 'Standard - No Watermark',
        hasWatermark: false,
        mimeType: 'video/mp4',
        downloadUrl: data.play,
      });
    }
    if (data.wmplay) {
      videoVariants.push({
        id: 'watermarked',
        qualityLabel: 'Original (With Watermark)',
        hasWatermark: true,
        mimeType: 'video/mp4',
        downloadUrl: data.wmplay,
      });
    }

    const photos: PhotoItem[] = [];
    if (hasImages && data.images) {
      data.images.forEach((imgUrl, idx) => {
        const paddedIndex = String(idx + 1).padStart(2, '0');
        photos.push({
          index: idx + 1,
          imageUrl: imgUrl,
          mimeType: 'image/jpeg',
          filename: `tiktok-photo-${paddedIndex}.jpg`,
        });
      });
    }

    return {
      id: data.id || String(Date.now()),
      sourceUrl: targetUrl,
      contentType,
      title: data.title,
      thumbnailUrl: data.cover,
      author: data.author
        ? {
            uniqueId: data.author.unique_id || 'unknown',
            nickname: data.author.nickname || 'Creator',
            avatarUrl: data.author.avatar,
          }
        : undefined,
      music: data.music
        ? {
            title: 'Audio Track',
            playUrl: data.music,
          }
        : undefined,
      videoVariants,
      photos,
      providerName: this.name,
      resolvedAt: new Date().toISOString(),
    };
  }

  public async checkHealth(): Promise<{ healthy: boolean; message: string }> {
    if (!this.apiKey) {
      return {
        healthy: false,
        message: 'RapidAPI provider is configured as active, but RAPIDAPI_KEY is missing.',
      };
    }
    return {
      healthy: true,
      message: 'RapidAPI provider credentials are configured.',
    };
  }
}
