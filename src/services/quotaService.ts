/**
 * Quota and Rate Limiting Service (Client-Side)
 * Connects to /api/quota to check analysis quota and respect sliding-window limits.
 */

export interface QuotaInfo {
  limit: number;
  remaining: number;
  used: number;
  windowMs: number;
  resetInSeconds: number;
  resetTime: string;
  isBlocked: boolean;
}

export class QuotaService {
  /**
   * Fetches the current analysis quota status from the server
   */
  static async getQuota(): Promise<QuotaInfo | null> {
    try {
      const res = await fetch('/api/quota');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Resets quota (useful during development / testing)
   */
  static async resetQuota(): Promise<QuotaInfo | null> {
    try {
      const res = await fetch('/api/quota/reset', { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.quota || null;
    } catch {
      return null;
    }
  }

  /**
   * Formats remaining seconds into a human-readable duration (e.g., '48m 20s')
   */
  static formatResetTime(seconds: number): string {
    if (seconds <= 0) return 'Ready';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }
}
