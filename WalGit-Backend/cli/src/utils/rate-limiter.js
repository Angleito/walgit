/**
 * Rate limiting utility for WalGit API endpoints
 * Implements token bucket algorithm for smooth rate limiting
 */

/**
 * Token bucket rate limiter
 * Allows for bursts of activity while maintaining average request rate limits
 */
class TokenBucket {
  /**
   * Creates a new token bucket
   * @param {number} capacity - Maximum number of tokens (max burst size)
   * @param {number} refillRate - Tokens added per second
   */
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Refills the bucket based on elapsed time
   * @private
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Attempts to consume tokens from the bucket
   * @param {number} count - Number of tokens to consume (default: 1)
   * @returns {boolean} Whether tokens were successfully consumed
   */
  consume(count = 1) {
    this.refill();
    
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    
    return false;
  }

  /**
   * Gets the number of seconds until the bucket will have enough tokens
   * @param {number} count - Number of tokens needed
   * @returns {number} Seconds until enough tokens will be available
   */
  getWaitTime(count = 1) {
    if (this.tokens >= count) return 0;
    
    const tokensNeeded = count - this.tokens;
    return tokensNeeded / this.refillRate;
  }
}

// Map of rate limiters by key (user ID, IP, etc.)
const limiters = new Map();

// Rate limit configurations by endpoint type
const rateLimitConfig = {
  auth: {
    capacity: 5,      // 5 requests burst
    refillRate: 1/12, // 1 token per 12 seconds (5 per minute)
    keyPrefix: 'auth'
  },
  repositoryWrite: {
    capacity: 30,     // 30 requests burst
    refillRate: 0.5,  // 0.5 tokens per second (30 per minute)
    keyPrefix: 'repo_write'
  },
  repositoryRead: {
    capacity: 60,     // 60 requests burst
    refillRate: 1,    // 1 token per second (60 per minute)
    keyPrefix: 'repo_read'
  },
  storage: {
    capacity: 100,    // 100 requests burst
    refillRate: 1.67, // 1.67 tokens per second (100 per minute)
    keyPrefix: 'storage'
  }
};

/**
 * Gets or creates a rate limiter for a specific key
 * @param {string} key - Identifier (user ID, IP address)
 * @param {string} type - Type of endpoint (auth, repositoryWrite, repositoryRead, storage)
 * @returns {TokenBucket} The rate limiter instance
 */
function getLimiter(key, type) {
  const config = rateLimitConfig[type] || rateLimitConfig.repositoryRead;
  const limiterId = `${config.keyPrefix}:${key}`;
  
  if (!limiters.has(limiterId)) {
    limiters.set(limiterId, new TokenBucket(config.capacity, config.refillRate));
  }
  
  return limiters.get(limiterId);
}

/**
 * Checks if a request should be rate limited
 * @param {string} key - Identifier (user ID, IP address)
 * @param {string} type - Type of endpoint (auth, repositoryWrite, repositoryRead, storage)
 * @param {number} cost - Token cost of the request (default: 1)
 * @returns {Object} Result with allowed status and retry info
 */
export function checkRateLimit(key, type, cost = 1) {
  const limiter = getLimiter(key, type);
  const allowed = limiter.consume(cost);
  
  return {
    allowed,
    retryAfter: allowed ? 0 : Math.ceil(limiter.getWaitTime(cost)),
    limit: limiter.capacity,
    remaining: Math.floor(limiter.tokens)
  };
}

/**
 * Middleware function for rate limiting API requests
 * @param {string} type - Type of endpoint (auth, repositoryWrite, repositoryRead, storage)
 * @param {Function} keyFn - Function to extract key from request context
 * @param {number} cost - Token cost of the request (default: 1)
 * @returns {Function} Middleware function
 */
export function rateLimitMiddleware(type, keyFn, cost = 1) {
  return (ctx, next) => {
    const key = keyFn(ctx);
    const result = checkRateLimit(key, type, cost);
    
    // Add rate limit headers
    ctx.set('X-RateLimit-Limit', result.limit.toString());
    ctx.set('X-RateLimit-Remaining', result.remaining.toString());
    
    if (!result.allowed) {
      ctx.set('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + result.retryAfter).toString());
      ctx.set('Retry-After', result.retryAfter.toString());
      ctx.status = 429;
      ctx.body = {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`
      };
      return;
    }
    
    return next();
  };
}

/**
 * Cleans up old rate limiters to prevent memory leaks
 * Removes limiters that haven't been used for more than an hour
 */
export function cleanupLimiters() {
  const now = Date.now();
  for (const [key, limiter] of limiters.entries()) {
    if (now - limiter.lastRefill > 3600000) { // 1 hour in milliseconds
      limiters.delete(key);
    }
  }
}

// Setup cleanup task
setInterval(cleanupLimiters, 3600000); // Run every hour

export default {
  checkRateLimit,
  rateLimitMiddleware,
  cleanupLimiters,
  TokenBucket
};