import { z } from 'zod';

/**
 * Normalized representation of a video variant.
 */
export interface VideoVariant {
  id: string; // e.g., 'no_watermark_hd', 'no_watermark', 'watermarked'
  qualityLabel: string; // e.g., 'HD No-Watermark (MP4)', 'Standard No-Watermark (MP4)'
  hasWatermark: boolean;
  mimeType: string;
  fileSizeBytes?: number;
  downloadUrl: string;
}

/**
 * Normalized representation of a single photo in a slideshow/carousel.
 */
export interface PhotoItem {
  index: number;
  imageUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  filename: string;
}

/**
 * Author details associated with the media.
 */
export interface MediaAuthor {
  id?: string;
  uniqueId: string;
  nickname: string;
  avatarUrl?: string;
}

/**
 * Engagement statistics.
 */
export interface MediaStats {
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  downloadCount?: number;
}

/**
 * Background audio track information.
 */
export interface MediaAudio {
  id?: string;
  title?: string;
  author?: string;
  playUrl?: string;
  duration?: number;
}

/**
 * High-level content classification.
 */
export type ContentType = 'video' | 'slideshow';

/**
 * Complete normalized TikTok media metadata returned to clients.
 */
export interface NormalizedMediaResult {
  id: string;
  sourceUrl: string;
  contentType: ContentType;
  title?: string;
  thumbnailUrl?: string;
  duration?: number;
  author?: MediaAuthor;
  stats?: MediaStats;
  music?: MediaAudio;
  videoVariants: VideoVariant[];
  photos: PhotoItem[];
  providerName: string;
  resolvedAt: string;
}

/**
 * Provider capability descriptor.
 */
export interface ProviderCapabilities {
  supportsVideo: boolean;
  supportsWatermarkFreeVideo: boolean;
  supportsHdVideo: boolean;
  supportsSlideshow: boolean;
  supportsAudioExtraction: boolean;
  requiresApiKey: boolean;
}

/**
 * Provider configuration interface.
 */
export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
}

/**
 * Core interface that all TikTok media providers must implement.
 */
export interface TikTokMediaProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Resolve a TikTok URL and return normalized metadata.
   */
  resolveUrl(url: string): Promise<NormalizedMediaResult>;

  /**
   * Check provider health/availability.
   */
  checkHealth(): Promise<{ healthy: boolean; message: string }>;
}

/**
 * Standard API error structure.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    recoverable: boolean;
  };
}

/**
 * Standard API success structure.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Zod schema for client URL resolve request.
 */
export const ResolveRequestSchema = z.object({
  url: z
    .string({ required_error: 'URL is required' })
    .trim()
    .min(1, 'URL cannot be empty')
    .max(2048, 'URL length exceeds maximum allowed limit'),
});

export type ResolveRequestBody = z.infer<typeof ResolveRequestSchema>;

/**
 * Zod schema for single media download request.
 */
export const DownloadRequestSchema = z.object({
  url: z.string().url('A valid media URL must be provided'),
  filename: z.string().trim().min(1).max(255).default('tiktok-media.mp4'),
  contentType: z.enum(['video/mp4', 'image/jpeg', 'image/png', 'image/webp', 'audio/mpeg']).default('video/mp4'),
});

export type DownloadRequestBody = z.infer<typeof DownloadRequestSchema>;

/**
 * Zod schema for ZIP download request.
 */
export const DownloadZipRequestSchema = z.object({
  items: z
    .array(
      z.object({
        url: z.string().url('Item URL must be a valid URL'),
        filename: z.string().trim().min(1).max(255),
      })
    )
    .min(1, 'At least one photo item is required')
    .max(50, 'Cannot package more than 50 photos in a single ZIP'),
  zipFilename: z.string().trim().min(1).max(255).default('tiktok-photos.zip'),
});

export type DownloadZipRequestBody = z.infer<typeof DownloadZipRequestSchema>;
