import { describe, it, expect } from 'vitest';
import { RateLimiter } from '@/lib/security/rate-limiter';

describe('RateLimiter Token Bucket', () => {
  it('allows requests within capacity', () => {
    const limiter = new RateLimiter(5, 1);
    const ip = '192.0.2.1';

    const check1 = limiter.check(ip, 1);
    expect(check1.allowed).toBe(true);
    expect(check1.remaining).toBe(4);

    const check2 = limiter.check(ip, 2);
    expect(check2.allowed).toBe(true);
    expect(check2.remaining).toBe(2);
  });

  it('rejects requests when bucket is exhausted', () => {
    const limiter = new RateLimiter(2, 0.1);
    const ip = '192.0.2.2';

    // Consume all 2 tokens
    expect(limiter.check(ip, 2).allowed).toBe(true);

    // Immediate next request must be rejected
    const blocked = limiter.check(ip, 1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('tracks different client IPs independently', () => {
    const limiter = new RateLimiter(1, 0.1);
    const ipA = '192.0.2.10';
    const ipB = '192.0.2.20';

    expect(limiter.check(ipA, 1).allowed).toBe(true);
    expect(limiter.check(ipA, 1).allowed).toBe(false); // ipA exhausted

    // ipB should still be permitted
    expect(limiter.check(ipB, 1).allowed).toBe(true);
  });
});
