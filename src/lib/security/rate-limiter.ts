/**
 * In-memory token bucket / sliding window rate limiter
 */

interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private maxTokens: number;
  private refillRatePerSecond: number;
  private cleanupIntervalMs: number;

  constructor(maxTokens = 30, refillRatePerSecond = 2, cleanupIntervalMs = 60000) {
    this.maxTokens = maxTokens;
    this.refillRatePerSecond = refillRatePerSecond;
    this.cleanupIntervalMs = cleanupIntervalMs;

    // Periodically clean up stale entries
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
      if (timer.unref) {
        timer.unref();
      }
    }
  }

  /**
   * Consume 1 or more tokens for a given identifier (e.g. client IP).
   * Returns whether request is allowed and remaining tokens.
   */
  public check(identifier: string, cost = 1): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
    const now = Date.now();
    let record = this.store.get(identifier);

    if (!record) {
      record = {
        tokens: this.maxTokens,
        lastRefill: now,
      };
      this.store.set(identifier, record);
    } else {
      // Calculate token replenishment
      const elapsedSeconds = (now - record.lastRefill) / 1000;
      const refilled = elapsedSeconds * this.refillRatePerSecond;
      record.tokens = Math.min(this.maxTokens, record.tokens + refilled);
      record.lastRefill = now;
    }

    if (record.tokens >= cost) {
      record.tokens -= cost;
      return {
        allowed: true,
        remaining: Math.floor(record.tokens),
      };
    }

    // Need more tokens
    const missingTokens = cost - record.tokens;
    const retryAfterSeconds = Math.ceil(missingTokens / this.refillRatePerSecond);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    this.store.forEach((record, key) => {
      // If tokens are full and inactive for 5 minutes, remove
      if (record.tokens >= this.maxTokens && now - record.lastRefill > 300000) {
        this.store.delete(key);
      }
    });
  }
}

// Global singleton instances for API endpoints
export const resolveRateLimiter = new RateLimiter(20, 2); // 20 burst, 2 per sec
export const downloadRateLimiter = new RateLimiter(30, 3); // 30 burst, 3 per sec
export const zipRateLimiter = new RateLimiter(5, 0.2); // 5 burst, 1 per 5 sec
