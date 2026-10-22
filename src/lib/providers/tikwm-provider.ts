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
 * Zod schema for TikWM API JSON response.
 */
const TikWmAuthorSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    unique_id: z.string().optional(),
    nickname: z.string().optional(),
    avatar: z.string().optional(),
  })
  .optional();

const TikWmMusicInfoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    author: z.string().optional(),
    play: z.string().optional(),
    duration: z.number().optional(),
  })
  .optional();

const TikWmDataSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional().default(''),
  cover: z.string().optional(),
  origin_cover: z.string().optional(),
  duration: z.number().optional().default(0),
  play: z.string().optional(),
  hdplay: z.string().optional(),
  wmplay: z.string().optional(),
  size: z.number().optional(),
  wm_size: z.number().optional(),
  hd_size: z.number().optional(),
  music: z.string().optional(),
  music_info: TikWmMusicInfoSchema,
  images: z.array(z.string()).optional(),
  play_count: z.number().optional(),
  digg_count: z.number().optional(),
  comment_count: z.number().optional(),
  share_count: z.number().optional(),
  download_count: z.number().optional(),
  author: TikWmAuthorSchema,
});

const TikWmResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  processed_time: z.number().optional(),
  data: TikWmDataSchema.optional(),
});

export class TikWmProvider implements TikTokMediaProvider {
  public readonly name = 'TikWM Media Provider';
  public readonly capabilities: ProviderCapabilities = {
    supportsVideo: true,
    supportsWatermarkFreeVideo: true,
    supportsHdVideo: true,
    supportsSlideshow: true,
    supportsAudioExtraction: true,
    requiresApiKey: false,
  };

  private baseUrl: string;
  private timeoutMs: number;
  private customHeaders: Record<string, string>;

  constructor(config?: ProviderConfig) {
    this.baseUrl = config?.baseUrl || process.env.TIKTOK_PROVIDER_BASE_URL || 'https://www.tikwm.com/api/';
    this.timeoutMs = config?.timeoutMs || 15000;
    this.customHeaders = {
      'User-Agent': 'TikSaveStudio/1.0 (+https://tiksave.studio)',
      Accept: 'application/json',
      ...config?.customHeaders,
    };
  }

  /**
   * Resolves relative URLs against the TikWM host if needed.
   */
  private formatMediaUrl(urlStr?: string): string | undefined {
    if (!urlStr) return undefined;
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      return urlStr;
    }
    const baseOrigin = new URL(this.baseUrl).origin;
    return `${baseOrigin}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
  }

  public async resolveUrl(targetUrl: string): Promise<NormalizedMediaResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      const endpoint = new URL(this.baseUrl);
      endpoint.searchParams.set('url', targetUrl);
      endpoint.searchParams.set('hd', '1');

      response = await fetch(endpoint.toString(), {
        method: 'GET',
        headers: this.customHeaders,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Provider request timed out after 15 seconds. Please try again.');
      }
      throw new Error(`Failed to connect to TikTok provider: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Provider returned HTTP status ${response.status}: ${response.statusText}`);
    }

    let rawJson: unknown;
    try {
      rawJson = await response.json();
    } catch {
      throw new Error('Provider returned an unparseable response.');
    }

    const parsed = TikWmResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      throw new Error('Provider response failed validation against contract schema.');
    }

    const resData = parsed.data;

    // Check provider-level error code
    if (resData.code !== 0 || !resData.data) {
      const providerMsg = resData.msg || 'Unknown provider error';
      if (/private/i.test(providerMsg)) {
        throw new Error('This TikTok post is private or has been removed.');
      }
      if (/not found/i.test(providerMsg) || /parsing is failed/i.test(providerMsg)) {
        throw new Error('Could not find or resolve this TikTok post. Please check the URL and ensure it is public.');
      }
      throw new Error(`Provider error: ${providerMsg}`);
    }

    const data = resData.data;
    const mediaId = String(data.id || Date.now());

    // Determine content type: if images array is present and has items, it's a slideshow
    const hasImages = Array.isArray(data.images) && data.images.length > 0;
    const contentType = hasImages ? 'slideshow' : 'video';

    // Normalize Video Variants
    const videoVariants: VideoVariant[] = [];
    const formattedHd = this.formatMediaUrl(data.hdplay);
    const formattedSd = this.formatMediaUrl(data.play);
    const formattedWm = this.formatMediaUrl(data.wmplay);

    if (formattedHd) {
      videoVariants.push({
        id: 'no_watermark_hd',
        qualityLabel: 'HD (1080p) - No Watermark',
        hasWatermark: false,
        mimeType: 'video/mp4',
        fileSizeBytes: data.hd_size,
        downloadUrl: formattedHd,
      });
    }

    if (formattedSd && formattedSd !== formattedHd) {
      videoVariants.push({
        id: 'no_watermark',
        qualityLabel: 'Standard - No Watermark',
        hasWatermark: false,
        mimeType: 'video/mp4',
        fileSizeBytes: data.size,
        downloadUrl: formattedSd,
      });
    }

    if (formattedWm) {
      videoVariants.push({
        id: 'watermarked',
        qualityLabel: 'Original (With Watermark)',
        hasWatermark: true,
        mimeType: 'video/mp4',
        fileSizeBytes: data.wm_size,
        downloadUrl: formattedWm,
      });
    }

    // Normalize Photo Items (preserving original order)
    const photos: PhotoItem[] = [];
    if (hasImages && data.images) {
      data.images.forEach((imgUrl, idx) => {
        const formattedImg = this.formatMediaUrl(imgUrl);
        if (formattedImg) {
          const paddedIndex = String(idx + 1).padStart(2, '0');
          photos.push({
            index: idx + 1,
            imageUrl: formattedImg,
            mimeType: 'image/jpeg',
            filename: `tiktok-photo-${paddedIndex}.jpg`,
          });
        }
      });
    }

    // Normalize Audio / Music
    const musicUrl = this.formatMediaUrl(data.music || data.music_info?.play);
    const music = musicUrl
      ? {
          id: data.music_info?.id ? String(data.music_info.id) : undefined,
          title: data.music_info?.title || 'Original Sound',
          author: data.music_info?.author || data.author?.nickname,
          playUrl: musicUrl,
          duration: data.music_info?.duration,
        }
      : undefined;

    // Normalize Author
    const author = data.author
      ? {
          id: data.author.id ? String(data.author.id) : undefined,
          uniqueId: data.author.unique_id || 'unknown',
          nickname: data.author.nickname || data.author.unique_id || 'TikTok Creator',
          avatarUrl: this.formatMediaUrl(data.author.avatar),
        }
      : undefined;

    // Engagement Stats
    const stats = {
      playCount: data.play_count,
      likeCount: data.digg_count,
      commentCount: data.comment_count,
      shareCount: data.share_count,
      downloadCount: data.download_count,
    };

    return {
      id: mediaId,
      sourceUrl: targetUrl,
      contentType,
      title: data.title?.trim() || undefined,
      thumbnailUrl: this.formatMediaUrl(data.cover || data.origin_cover),
      duration: data.duration,
      author,
      stats,
      music,
      videoVariants,
      photos,
      providerName: this.name,
      resolvedAt: new Date().toISOString(),
    };
  }

  public async checkHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      const endpoint = new URL(this.baseUrl);
      endpoint.searchParams.set('url', 'https://www.tiktok.com/@tiktok/video/7106594312292453675');
      const res = await fetch(endpoint.toString(), {
        method: 'GET',
        headers: this.customHeaders,
      });

      if (res.ok) {
        return { healthy: true, message: 'TikWM Provider is reachable and responding.' };
      }
      return { healthy: false, message: `TikWM Provider returned HTTP status ${res.status}` };
    } catch (err: unknown) {
      return {
        healthy: false,
        message: `TikWM Provider connectivity check failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
