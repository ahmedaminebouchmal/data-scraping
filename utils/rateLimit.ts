interface RateLimiter {
  timestamp: number;
  tokens: number;
}

const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_TOKENS = 60; // Maximum requests per minute
const rateLimiters = new Map<string, RateLimiter>();

export function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const limiter = rateLimiters.get(clientId);

  if (!limiter) {
    // First request from this client
    rateLimiters.set(clientId, {
      timestamp: now,
      tokens: MAX_TOKENS - 1
    });
    return false;
  }

  // Calculate tokens to restore based on time elapsed
  const timeElapsed = now - limiter.timestamp;
  const tokensToRestore = Math.floor(timeElapsed / (RATE_LIMIT_WINDOW / MAX_TOKENS));
  const newTokens = Math.min(MAX_TOKENS, limiter.tokens + tokensToRestore);

  if (newTokens < 1) {
    // Update timestamp but keep tokens at 0
    rateLimiters.set(clientId, {
      timestamp: now,
      tokens: 0
    });
    return true;
  }

  // Update timestamp and tokens
  rateLimiters.set(clientId, {
    timestamp: now,
    tokens: newTokens - 1
  });
  return false;
}

export function getRemainingTokens(clientId: string): number {
  const limiter = rateLimiters.get(clientId);
  return limiter ? limiter.tokens : MAX_TOKENS;
}

export function getTimeUntilReset(clientId: string): number {
  const limiter = rateLimiters.get(clientId);
  if (!limiter) return 0;
  
  const now = Date.now();
  const timeElapsed = now - limiter.timestamp;
  return Math.max(0, RATE_LIMIT_WINDOW - timeElapsed);
}
