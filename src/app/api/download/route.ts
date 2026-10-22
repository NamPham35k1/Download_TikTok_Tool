import { NextRequest, NextResponse } from 'next/server';
import { DownloadRequestSchema } from '@/lib/providers/types';
import { validateSafeMediaUrl } from '@/lib/security/ssrf';
import { sanitizeFilename } from '@/lib/security/url-validator';
import { downloadRateLimiter } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    const rateCheck = downloadRateLimiter.check(clientIp);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Download rate limit reached. Please wait ${rateCheck.retryAfterSeconds || 10} seconds.`,
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

    const parseResult = DownloadRequestSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid download parameters.',
            recoverable: false,
          },
        },
        { status: 400 }
      );
    }

    const { url, filename, contentType } = parseResult.data;

    // SSRF Safeguard: Verify host is legitimate and not an internal network or metadata service
    const ssrfCheck = validateSafeMediaUrl(url);
    if (!ssrfCheck.isSafe) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN_MEDIA_HOST',
            message: ssrfCheck.error || 'Requested media source is not permitted.',
            recoverable: false,
          },
        },
        { status: 403 }
      );
    }

    const safeFilename = sanitizeFilename(filename, 'tiktok-media.mp4');

    // Fetch upstream media stream
    const upstreamRes = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.tiktok.com/',
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPSTREAM_FETCH_FAILED',
            message: `Failed to download media from source server (HTTP ${upstreamRes.status}). The media link may have expired.`,
            recoverable: true,
          },
        },
        { status: 502 }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType || upstreamRes.headers.get('content-type') || 'application/octet-stream');
    responseHeaders.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
    
    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }
    responseHeaders.set('Cache-Control', 'private, no-transform, max-age=3600');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(upstreamRes.body as unknown as ReadableStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: err instanceof Error ? err.message : 'An error occurred while streaming the requested media.',
          recoverable: true,
        },
      },
      { status: 500 }
    );
  }
}
