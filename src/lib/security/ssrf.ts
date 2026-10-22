import net from 'net';

/**
 * Checks if an IPv4 address belongs to a private, loopback, or link-local range.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // invalid IP format considered unsafe
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata service)
  if (a === 169 && b === 254) return true;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  return false;
}

/**
 * Checks if an IPv6 address belongs to loopback, unique local, or link-local range.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // fc00::/7
  if (normalized.startsWith('fe80:')) return true; // fe80::/10
  return false;
}

/**
 * Validates a media download URL to prevent Server-Side Request Forgery (SSRF).
 * Ensures host is not localhost, private IP, or internal network.
 */
export function validateSafeMediaUrl(rawUrl: string): { isSafe: boolean; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isSafe: false, error: 'Empty media URL.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { isSafe: false, error: 'Malformed media URL.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, error: 'Disallowed protocol for media download.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and standard internal names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0'
  ) {
    return { isSafe: false, error: 'SSRF blocked: host is local or internal.' };
  }

  // Check if hostname is directly an IP
  const ipType = net.isIP(hostname);
  if (ipType === 4 && isPrivateIPv4(hostname)) {
    return { isSafe: false, error: 'SSRF blocked: IPv4 address is in a reserved/private range.' };
  }
  if (ipType === 6 && isPrivateIPv6(hostname)) {
    return { isSafe: false, error: 'SSRF blocked: IPv6 address is in a reserved/private range.' };
  }

  // Verify against trusted media CDN patterns (TikTok, Douyin, ByteDance, TikWM)
  const isTrustedCdn =
    hostname.endsWith('tiktokcdn.com') ||
    hostname.endsWith('tiktokcdn-us.com') ||
    hostname.endsWith('tiktokcdn-eu.com') ||
    hostname.endsWith('tiktokcdn-in.com') ||
    hostname.endsWith('tokcdn.com') ||
    hostname.endsWith('byteoversea.com') ||
    hostname.endsWith('ibytedtos.com') ||
    hostname.endsWith('douyinvod.com') ||
    hostname.endsWith('douyinpic.com') ||
    hostname.endsWith('tikwm.com') ||
    hostname.endsWith('tiktok.com');

  if (!isTrustedCdn) {
    return {
      isSafe: false,
      error: `Media host "${hostname}" is not recognized as a legitimate TikTok CDN or authorized provider host.`,
    };
  }

  return { isSafe: true };
}
