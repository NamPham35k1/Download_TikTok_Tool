import { describe, it, expect } from 'vitest';
import {
  validateAndNormalizeTikTokUrl,
  sanitizeFilename,
  ALLOWED_TIKTOK_HOSTNAMES,
} from '@/lib/security/url-validator';

describe('URL Validator and Normalizer', () => {
  it('accepts standard desktop TikTok video URLs', () => {
    const input = 'https://www.tiktok.com/@tiktok/video/7106594312292453675';
    const result = validateAndNormalizeTikTokUrl(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toBe('https://www.tiktok.com/@tiktok/video/7106594312292453675');
    expect(result.isShortUrl).toBe(false);
  });

  it('accepts TikTok mobile and short share links (vm.tiktok.com and vt.tiktok.com)', () => {
    const vmUrl = 'https://vm.tiktok.com/ZMkY7uX1x/';
    const vtUrl = 'https://vt.tiktok.com/ZS2qabcde/';

    const vmRes = validateAndNormalizeTikTokUrl(vmUrl);
    expect(vmRes.isValid).toBe(true);
    expect(vmRes.isShortUrl).toBe(true);

    const vtRes = validateAndNormalizeTikTokUrl(vtUrl);
    expect(vtRes.isValid).toBe(true);
    expect(vtRes.isShortUrl).toBe(true);
  });

  it('accepts Douyin share links', () => {
    const douyinUrl = 'https://v.douyin.com/iJ7mKLp/';
    const res = validateAndNormalizeTikTokUrl(douyinUrl);
    expect(res.isValid).toBe(true);
  });

  it('automatically prepends https:// if protocol is omitted', () => {
    const input = 'www.tiktok.com/@user/video/1234567890';
    const result = validateAndNormalizeTikTokUrl(input);
    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toContain('https://www.tiktok.com/@user/video/1234567890');
  });

  it('strips tracking parameters while preserving benign queries', () => {
    const input =
      'https://www.tiktok.com/@user/video/1234567890?utm_source=copy&utm_medium=android&fbclid=12345&lang=en';
    const result = validateAndNormalizeTikTokUrl(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).not.toContain('utm_source');
    expect(result.normalizedUrl).not.toContain('fbclid');
    expect(result.normalizedUrl).toContain('lang=en');
  });

  it('rejects unsupported and malicious domains', () => {
    const malicious = [
      'https://google.com/search?q=tiktok',
      'https://tiktok.com.attacker.com/@user/video/123',
      'https://phishing-tiktok.com/video/123',
      'https://evil.org',
    ];

    malicious.forEach((url) => {
      const res = validateAndNormalizeTikTokUrl(url);
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  it('rejects non-HTTP protocols', () => {
    const badProtocols = [
      'javascript:alert(1)',
      'file:///etc/passwd',
      'ftp://tiktok.com/video',
    ];

    badProtocols.forEach((url) => {
      const res = validateAndNormalizeTikTokUrl(url);
      expect(res.isValid).toBe(false);
    });
  });

  it('rejects empty strings and homepage URLs without post identifier', () => {
    expect(validateAndNormalizeTikTokUrl('').isValid).toBe(false);
    expect(validateAndNormalizeTikTokUrl('   ').isValid).toBe(false);
    expect(validateAndNormalizeTikTokUrl('https://www.tiktok.com/').isValid).toBe(false);
  });
});

describe('Filename Sanitizer', () => {
  it('sanitizes unsafe characters from filenames', () => {
    const input = '../../secret/photo:01?.jpg';
    const output = sanitizeFilename(input);
    expect(output).not.toContain('..');
    expect(output).not.toContain('/');
    expect(output).not.toContain(':');
    expect(output).not.toContain('?');
  });

  it('replaces spaces with dashes and truncates long filenames', () => {
    const input = 'my awesome tiktok download 2026.mp4';
    const output = sanitizeFilename(input);
    expect(output).toBe('my-awesome-tiktok-download-2026.mp4');
  });

  it('uses fallback if filename becomes empty after cleaning', () => {
    const output = sanitizeFilename('???:::');
    expect(output).toBe('tiktok-media.mp4');
  });
});
