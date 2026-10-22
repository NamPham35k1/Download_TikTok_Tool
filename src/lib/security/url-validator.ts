/**
 * Security: TikTok URL Validation and Normalization
 */

export const ALLOWED_TIKTOK_HOSTNAMES = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
  'v.douyin.com',
  'douyin.com',
  'www.douyin.com',
]);

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
  isShortUrl?: boolean;
}

/**
 * Validates whether the incoming URL is a legitimate TikTok or Douyin URL,
 * normalizes protocol and query parameters, and rejects malicious payloads.
 */
export function validateAndNormalizeTikTokUrl(rawInput: string): UrlValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Please enter a valid TikTok link.' };
  }

  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'URL cannot be empty.' };
  }

  // Prepend https:// if protocol was omitted
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { isValid: false, error: 'The provided link is not a valid URL.' };
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS URLs are supported.' };
  }

  // Normalize hostname to lowercase
  const hostname = parsed.hostname.toLowerCase();

  // Check domain allowlist
  const isAllowedHost =
    ALLOWED_TIKTOK_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.tiktok.com') ||
    hostname.endsWith('.douyin.com');

  if (!isAllowedHost) {
    return {
      isValid: false,
      error: `Unsupported domain "${parsed.hostname}". Only TikTok links (e.g. tiktok.com, vm.tiktok.com, vt.tiktok.com) are supported.`,
    };
  }

  // Ensure path is non-trivial
  const pathname = parsed.pathname;
  if (pathname === '/' || pathname === '') {
    return {
      isValid: false,
      error: 'Please provide a direct link to a TikTok video or photo post, not just the homepage.',
    };
  }

  const isShortUrl = hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com' || hostname === 'v.douyin.com';

  // Construct clean normalized URL: always enforce https and strip tracking query parameters
  const cleanUrl = new URL(`https://${hostname}${pathname}`);
  
  // Keep benign query parameters if present, but omit known tracking ones (e.g. utm_*, fbclid)
  parsed.searchParams.forEach((val, key) => {
    if (!key.startsWith('utm_') && key !== 'fbclid' && key !== 'gclid') {
      cleanUrl.searchParams.append(key, val);
    }
  });

  return {
    isValid: true,
    normalizedUrl: cleanUrl.toString(),
    isShortUrl,
  };
}

/**
 * Sanitizes a filename to prevent path traversal and unsafe character issues.
 */
export function sanitizeFilename(filename: string, fallback = 'tiktok-media.mp4'): string {
  if (!filename || typeof filename !== 'string') return fallback;

  // Remove any path traversal sequences
  const cleaned = filename
    .replace(/^.*[\\/]/, '') // get basename
    .replace(/[\0\x00-\x1f\x7f<>:"/\\|?*]/g, '_') // remove invalid characters
    .replace(/^_+|_+$/g, '') // trim leading and trailing underscores
    .replace(/\s+/g, '-') // spaces to dashes
    .slice(0, 100); // limit length

  return cleaned.length > 0 ? cleaned : fallback;
}
