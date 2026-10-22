import { describe, it, expect } from 'vitest';
import { isPrivateIPv4, isPrivateIPv6, validateSafeMediaUrl } from '@/lib/security/ssrf';

describe('SSRF Protection Guards', () => {
  describe('Private IPv4 Detection', () => {
    it('identifies loopback addresses', () => {
      expect(isPrivateIPv4('127.0.0.1')).toBe(true);
      expect(isPrivateIPv4('127.1.2.3')).toBe(true);
    });

    it('identifies 10.0.0.0/8 private addresses', () => {
      expect(isPrivateIPv4('10.0.0.1')).toBe(true);
      expect(isPrivateIPv4('10.255.255.255')).toBe(true);
    });

    it('identifies 172.16.0.0/12 private addresses', () => {
      expect(isPrivateIPv4('172.16.0.1')).toBe(true);
      expect(isPrivateIPv4('172.31.255.255')).toBe(true);
      expect(isPrivateIPv4('172.32.0.1')).toBe(false); // public
    });

    it('identifies 192.168.0.0/16 private addresses', () => {
      expect(isPrivateIPv4('192.168.1.1')).toBe(true);
      expect(isPrivateIPv4('192.168.0.254')).toBe(true);
    });

    it('identifies link-local and cloud metadata addresses', () => {
      expect(isPrivateIPv4('169.254.169.254')).toBe(true);
      expect(isPrivateIPv4('0.0.0.0')).toBe(true);
    });

    it('permits public IP addresses', () => {
      expect(isPrivateIPv4('8.8.8.8')).toBe(false);
      expect(isPrivateIPv4('1.1.1.1')).toBe(false);
    });
  });

  describe('Private IPv6 Detection', () => {
    it('identifies loopback IPv6', () => {
      expect(isPrivateIPv6('::1')).toBe(true);
    });

    it('identifies unique local and link-local IPv6', () => {
      expect(isPrivateIPv6('fc00::1')).toBe(true);
      expect(isPrivateIPv6('fe80::1')).toBe(true);
    });
  });

  describe('validateSafeMediaUrl', () => {
    it('blocks internal hostnames and loopbacks', () => {
      expect(validateSafeMediaUrl('http://localhost:3000/media.mp4').isSafe).toBe(false);
      expect(validateSafeMediaUrl('http://127.0.0.1:8080/image.jpg').isSafe).toBe(false);
      expect(validateSafeMediaUrl('http://169.254.169.254/latest/meta-data/').isSafe).toBe(false);
      expect(validateSafeMediaUrl('http://server.internal/video.mp4').isSafe).toBe(false);
    });

    it('blocks unauthorized third-party domains', () => {
      expect(validateSafeMediaUrl('https://evil-attacker.com/exploit.mp4').isSafe).toBe(false);
    });

    it('allows verified TikTok and CDN domains', () => {
      expect(
        validateSafeMediaUrl('https://v16m.tiktokcdn-us.com/video123.mp4').isSafe
      ).toBe(true);
      expect(
        validateSafeMediaUrl('https://p16-sign-useast2a.tiktokcdn.com/image123.jpeg').isSafe
      ).toBe(true);
      expect(
        validateSafeMediaUrl('https://www.tikwm.com/video/media.mp4').isSafe
      ).toBe(true);
    });
  });
});
