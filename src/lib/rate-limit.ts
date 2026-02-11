/**
 * Simple in-memory rate limiter
 * For production with multiple servers, use Redis-based rate limiting
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis for production with multiple servers)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter middleware
 * 
 * @example
 * ```typescript
 * // Limit: 1 request per 2 seconds per user
 * const limiter = createRateLimiter({
 *   windowMs: 2000,
 *   max: 1,
 * });
 * 
 * const isAllowed = limiter.check('user-123');
 * if (!isAllowed) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, max, keyGenerator } = config;

  return {
    /**
     * Check if request is allowed
     * @param identifier - Unique identifier (e.g., userId, IP address)
     * @returns true if allowed, false if rate limit exceeded
     */
    check(identifier: string): boolean {
      const key = keyGenerator ? keyGenerator(identifier) : identifier;
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetTime < now) {
        // First request or window expired
        store.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        return true;
      }

      if (entry.count < max) {
        // Within limit
        entry.count++;
        return true;
      }

      // Rate limit exceeded
      return false;
    },

    /**
     * Get remaining requests for identifier
     */
    getRemaining(identifier: string): number {
      const key = keyGenerator ? keyGenerator(identifier) : identifier;
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetTime < now) {
        return max;
      }

      return Math.max(0, max - entry.count);
    },

    /**
     * Get reset time for identifier
     */
    getResetTime(identifier: string): number | null {
      const key = keyGenerator ? keyGenerator(identifier) : identifier;
      const entry = store.get(key);

      if (!entry) {
        return null;
      }

      return entry.resetTime;
    },

    /**
     * Reset rate limit for identifier
     */
    reset(identifier: string): void {
      const key = keyGenerator ? keyGenerator(identifier) : identifier;
      store.delete(key);
    },
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Save answer endpoint: 1 request per 2 seconds per question per student
   */
  saveAnswer: createRateLimiter({
    windowMs: 2000,
    max: 1,
  }),

  /**
   * Submit exam: 1 request per 5 seconds per student
   */
  submitExam: createRateLimiter({
    windowMs: 5000,
    max: 1,
  }),

  /**
   * Login: 5 attempts per minute per IP
   */
  login: createRateLimiter({
    windowMs: 60000,
    max: 5,
  }),

  /**
   * API general: 100 requests per minute per user
   */
  general: createRateLimiter({
    windowMs: 60000,
    max: 100,
  }),
};

/**
 * Helper to get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get from headers (for proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}
