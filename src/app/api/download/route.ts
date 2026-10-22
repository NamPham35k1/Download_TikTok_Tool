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

async function handleDownloadStream(
  url: string,
  rawFilename: string,
  rawContentType: string,
  req: NextRequest
): Promise<NextResponse> {
  const clientIp = getClientIp(req);
  const rateCheck = downloadRateLimiter.check(clientIp);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Giới hạn tải file. Vui lòng thử lại sau ${rateCheck.retryAfterSeconds || 10} giây.`,
          recoverable: true,
        },
      },
      { status: 429 }
    );
  }

  // SSRF Safeguard
  const ssrfCheck = validateSafeMediaUrl(url);
  if (!ssrfCheck.isSafe) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN_MEDIA_HOST',
          message: ssrfCheck.error || 'Nguồn tải media không hợp lệ hoặc bị chặn.',
          recoverable: false,
        },
      },
      { status: 403 }
    );
  }

  const safeFilename = sanitizeFilename(rawFilename, 'tiktok-media.mp4');

  // Fetch upstream media stream
  const upstreamRes = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      Referer: 'https://www.tiktok.com/',
    },
  });

  if (!upstreamRes.ok || !upstreamRes.body) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPSTREAM_FETCH_FAILED',
          message: `Không thể tải dữ liệu từ máy chủ gốc (HTTP ${upstreamRes.status}). Link có thể đã hết hạn.`,
          recoverable: true,
        },
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  responseHeaders.set(
    'Content-Type',
    rawContentType || upstreamRes.headers.get('content-type') || 'application/octet-stream'
  );
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
}

/**
 * GET /api/download?url=...&filename=...&contentType=...
 * Mobile-friendly direct download endpoint for iOS Safari & Android Chrome.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'namit-tiktok-media.mp4';
    const contentType = searchParams.get('contentType') || 'video/mp4';

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_URL',
            message: 'Thiếu tham số URL media để tải về.',
            recoverable: false,
          },
        },
        { status: 400 }
      );
    }

    return await handleDownloadStream(url, filename, contentType, req);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: err instanceof Error ? err.message : 'Lỗi khi truyền luồng dữ liệu.',
          recoverable: true,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/download
 * JSON-body download endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    let bodyJson: unknown;
    try {
      bodyJson = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Dữ liệu JSON không hợp lệ.',
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
            message: parseResult.error.errors[0]?.message || 'Tham số tải về không hợp lệ.',
            recoverable: false,
          },
        },
        { status: 400 }
      );
    }

    const { url, filename, contentType } = parseResult.data;
    return await handleDownloadStream(url, filename, contentType, req);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: err instanceof Error ? err.message : 'Lỗi trong quá trình tải media.',
          recoverable: true,
        },
      },
      { status: 500 }
    );
  }
}
