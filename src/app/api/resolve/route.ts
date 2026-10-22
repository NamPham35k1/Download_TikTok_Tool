import { NextRequest, NextResponse } from 'next/server';
import { ResolveRequestSchema } from '@/lib/providers/types';
import { validateAndNormalizeTikTokUrl } from '@/lib/security/url-validator';
import { resolveRateLimiter } from '@/lib/security/rate-limiter';
import { getActiveProvider } from '@/lib/providers/selected-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = resolveRateLimiter.check(clientIp);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Please wait ${rateCheck.retryAfterSeconds || 10} seconds before trying again.`,
            recoverable: true,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds || 10),
          },
        }
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

    const parseResult = ResolveRequestSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid input data.',
            recoverable: false,
          },
        },
        { status: 400 }
      );
    }

    const { url: rawUrl } = parseResult.data;
    const urlValidation = validateAndNormalizeTikTokUrl(rawUrl);

    if (!urlValidation.isValid || !urlValidation.normalizedUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_OR_INVALID_URL',
            message: urlValidation.error || 'The provided URL is not a recognized TikTok link.',
            recoverable: false,
          },
        },
        { status: 400 }
      );
    }

    const provider = getActiveProvider();
    const mediaResult = await provider.resolveUrl(urlValidation.normalizedUrl);

    return NextResponse.json({
      success: true,
      data: mediaResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred while resolving the TikTok URL.';
    const isTimeout = /timeout/i.test(message);
    const isPrivateOrMissing = /private|removed|not found/i.test(message);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isTimeout ? 'PROVIDER_TIMEOUT' : isPrivateOrMissing ? 'MEDIA_NOT_ACCESSIBLE' : 'PROVIDER_ERROR',
          message,
          recoverable: isTimeout,
        },
      },
      { status: isTimeout ? 504 : isPrivateOrMissing ? 404 : 502 }
    );
  }
}
