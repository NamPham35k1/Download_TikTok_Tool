import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as resolveRoute } from '@/app/api/resolve/route';
import { GET as healthRoute } from '@/app/api/health/route';
import { POST as downloadRoute } from '@/app/api/download/route';
import { NextRequest } from 'next/server';

describe('API Route Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns application status without exposing secrets or keys', async () => {
      const res = await healthRoute();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.application.name).toBe('Nam IT TikTok Tool');
      expect(json.provider.name).toBeDefined();

      // Ensure no secrets or API keys are present in the response
      const jsonStr = JSON.stringify(json);
      expect(jsonStr).not.toContain('apiKey');
      expect(jsonStr).not.toContain('secret');
      expect(jsonStr).not.toContain('authorization');
    });
  });

  describe('POST /api/resolve', () => {
    it('rejects unsupported domains with a 400 status', async () => {
      const req = new NextRequest('http://localhost:3000/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://youtube.com/watch?v=123' }),
      });

      const res = await resolveRoute(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNSUPPORTED_OR_INVALID_URL');
    });

    it('rejects empty or malformed requests with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await resolveRoute(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/download', () => {
    it('blocks SSRF attempts to localhost and private IPs with a 403 status', async () => {
      const req = new NextRequest('http://localhost:3000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'http://127.0.0.1:3000/secret.mp4',
          filename: 'exploit.mp4',
          contentType: 'video/mp4',
        }),
      });

      const res = await downloadRoute(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN_MEDIA_HOST');
    });
  });
});
