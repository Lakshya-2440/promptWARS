export type RateLimitTier = "AUTH_REQUEST" | "AUTH_VERIFY" | "AI_INFERENCE" | "GENERAL_API" | "ADMIN_ACTION";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const TIER_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  AUTH_REQUEST: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 OTP requests per 15 min
  AUTH_VERIFY: { windowMs: 15 * 60 * 1000, maxRequests: 5 },  // 5 OTP verify attempts per 15 min
  AI_INFERENCE: { windowMs: 60 * 1000, maxRequests: 30 },     // 30 AI prompts per minute
  GENERAL_API: { windowMs: 60 * 1000, maxRequests: 120 },     // 120 API calls per minute
  ADMIN_ACTION: { windowMs: 60 * 1000, maxRequests: 20 },     // 20 admin actions per minute
};

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store
const store = new Map<string, RateLimitRecord>();

// Cleanup stale keys periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(identifier: string, tier: RateLimitTier): RateLimitResult {
  const config = TIER_CONFIGS[tier];
  const now = Date.now();
  const key = `${tier}:${identifier}`;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Remove timestamps outside the current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < config.windowMs);

  if (record.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetTimeMs = oldestTimestamp + config.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTimeMs,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = config.maxRequests - record.timestamps.length;
  const resetTimeMs = now + config.windowMs;

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining,
    resetTimeMs,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(identifier: string, tier: RateLimitTier): void {
  const key = `${tier}:${identifier}`;
  store.delete(key);
}
