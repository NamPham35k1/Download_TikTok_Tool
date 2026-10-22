import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { DownloadZipRequestSchema } from '@/lib/providers/types';
import { validateSafeMediaUrl } from '@/lib/security/ssrf';
import { sanitizeFilename } from '@/lib/security/url-validator';
import { zipRateLimiter } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_TOTAL_BYTES = 150 * 1024 * 1024; // 150 MB safety cap
const MAX_ITEM_BYTES = 25 * 1024 * 1024; // 25 MB per image cap
const FETCH_TIMEOUT_MS = 20000;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = zipRateLimiter.check(clientIp);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `ZIP generation rate limit reached. Please wait ${rateCheck.retryAfterSeconds || 15} seconds before creating another archive.`,
            recoverable: true,
          },
        },
        { status: 429 }
      );
    }

    let bodyJson: unknown;
    try {
      bodyJson = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON request payload.',
            recoverable: false,
          },
        },
        { status: 400 }
      );
    }

    const parseResult = DownloadZipRequestSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid parameters for ZIP packaging.',
            recoverable: false,
          },
        },
        { status: 400 }
      );
    }

    const { items, zipFilename } = parseResult.data;

    // Validate SSRF for every item URL before performing any network operations
    for (const item of items) {
      const ssrfCheck = validateSafeMediaUrl(item.url);
      if (!ssrfCheck.isSafe) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN_MEDIA_HOST',
              message: `Security validation failed for photo item "${item.filename}": ${ssrfCheck.error}`,
              recoverable: false,
            },
          },
          { status: 403 }
        );
      }
    }

    const zip = new JSZip();
    let totalBytesAccumulated = 0;
    const failedItems: string[] = [];

    // Download images concurrently with batching to preserve order and avoid socket congestion
    const BATCH_SIZE = 4;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (item, batchOffset) => {
          const itemIndex = i + batchOffset;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

          try {
            const res = await fetch(item.url, {
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Referer: 'https://www.tiktok.com/',
              },
              signal: controller.signal,
            });

            if (!res.ok) {
              failedItems.push(`${item.filename} (HTTP ${res.status})`);
              return;
            }

            const arrayBuf = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            if (buffer.length > MAX_ITEM_BYTES) {
              failedItems.push(`${item.filename} (exceeds individual size limit of 25MB)`);
              return;
            }

            totalBytesAccumulated += buffer.length;
            if (totalBytesAccumulated > MAX_TOTAL_BYTES) {
              throw new Error('Total uncompressed ZIP size exceeded maximum permitted limit of 150MB.');
            }

            // Ensure filename is padded and ordered
            const paddedIdx = String(itemIndex + 1).padStart(2, '0');
            const cleanName = sanitizeFilename(item.filename, `tiktok-photo-${paddedIdx}.jpg`);

            zip.file(cleanName, buffer);
          } catch (itemErr: unknown) {
            const msg = itemErr instanceof Error ? itemErr.message : 'Download failed';
            failedItems.push(`${item.filename} (${msg})`);
          } finally {
            clearTimeout(timer);
          }
        })
      );
    }

    // If all items failed, return an actionable error
    const zipEntries = Object.keys(zip.files);
    if (zipEntries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ZIP_GENERATION_FAILED',
            message: `Could not download any of the requested photos. Reasons: ${failedItems.join('; ')}`,
            recoverable: true,
          },
        },
        { status: 502 }
      );
    }

    // Generate real ZIP archive
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    });

    const safeZipName = sanitizeFilename(zipFilename, 'tiktok-photos.zip');
    const finalZipName = safeZipName.endsWith('.zip') ? safeZipName : `${safeZipName}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${finalZipName}"`);
    headers.set('Content-Length', String(zipBuffer.length));
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');

    if (failedItems.length > 0) {
      headers.set('X-Partial-Failures', encodeURIComponent(failedItems.join(', ')));
    }

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ZIP_PACKAGING_ERROR',
          message: err instanceof Error ? err.message : 'Unexpected error during ZIP generation.',
          recoverable: true,
        },
      },
      { status: 500 }
    );
  }
}
