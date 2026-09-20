/**
 * Server-Side Rate Limiter with Sliding Window
 * Restricts the number of target analysis investigations per client IP.
 */

interface RateLimitRecord {
  timestamps: number[];
  lastTarget?: string;
  lastTargetTimestamp?: number;
}

export interface QuotaStatus {
  limit: number;
  remaining: number;
  used: number;
  windowMs: number;
  resetInSeconds: number;
  resetTime: string;
  isBlocked: boolean;
}

// Default policy: 10 target investigations per 1 hour (3600000 ms)
const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// In-memory store keyed by client IP (or session)
const ipStore = new Map<string, RateLimitRecord>();

/**
 * Normalizes client IP from Express request, respecting proxies
 */
export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips.trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Cleans expired timestamps for a given record
 */
function cleanRecord(record: RateLimitRecord, now: number, windowMs: number): void {
  const cutoff = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
}

/**
 * Returns current quota status for an IP without consuming quota
 */
export function getQuotaStatus(clientIp: string, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS): QuotaStatus {
  const now = Date.now();
  let record = ipStore.get(clientIp);

  if (!record) {
    return {
      limit,
      remaining: limit,
      used: 0,
      windowMs,
      resetInSeconds: Math.ceil(windowMs / 1000),
      resetTime: new Date(now + windowMs).toISOString(),
      isBlocked: false,
    };
  }

  cleanRecord(record, now, windowMs);

  const used = record.timestamps.length;
  const remaining = Math.max(0, limit - used);
  const isBlocked = remaining === 0;

  // Next reset is based on the oldest timestamp in the active window
  const oldestTimestamp = record.timestamps[0] || now;
  const resetTimestamp = oldestTimestamp + windowMs;
  const resetInSeconds = isBlocked ? Math.max(1, Math.ceil((resetTimestamp - now) / 1000)) : Math.ceil(windowMs / 1000);

  return {
    limit,
    remaining,
    used,
    windowMs,
    resetInSeconds,
    resetTime: new Date(resetTimestamp).toISOString(),
    isBlocked,
  };
}

function normalizeTarget(raw?: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/:\d+$/, '')
    .replace(/\/.*$/, '');
}

/**
 * Attempts to consume 1 quota unit for an investigation.
 * If the request is for the exact same target domain probed within the last 60 seconds
 * (e.g. parallel probes for HTTP, DNS, Tech, Security), it counts as part of the same investigation!
 */
export function consumeQuota(
  clientIp: string,
  targetIdentifier?: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS
): { allowed: boolean; quota: QuotaStatus } {
  const now = Date.now();
  let record = ipStore.get(clientIp);

  if (!record) {
    record = { timestamps: [] };
    ipStore.set(clientIp, record);
  }

  cleanRecord(record, now, windowMs);

  const normTarget = normalizeTarget(targetIdentifier);
  const normLast = normalizeTarget(record.lastTarget);

  // If this probe is for the SAME target domain within 60 seconds of an active investigation,
  // do NOT double-charge the client (parallel forensic probe grace window)
  if (
    normTarget &&
    normLast === normTarget &&
    record.lastTargetTimestamp &&
    now - record.lastTargetTimestamp < 60000
  ) {
    return {
      allowed: true,
      quota: getQuotaStatus(clientIp, limit, windowMs),
    };
  }

  if (record.timestamps.length >= limit) {
    return {
      allowed: false,
      quota: getQuotaStatus(clientIp, limit, windowMs),
    };
  }

  // Consume 1 quota credit
  record.timestamps.push(now);
  if (targetIdentifier) {
    record.lastTarget = targetIdentifier;
    record.lastTargetTimestamp = now;
  }

  return {
    allowed: true,
    quota: getQuotaStatus(clientIp, limit, windowMs),
  };
}

/**
 * Resets quota for a given IP (useful for testing and admin overrides)
 */
export function resetQuota(clientIp: string): QuotaStatus {
  ipStore.delete(clientIp);
  return getQuotaStatus(clientIp);
}
