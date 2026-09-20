import { HttpFinding, HttpInspectionError } from '../types';

export interface HttpAnalysisResponse {
  success: boolean;
  finding?: HttpFinding;
  error?: HttpInspectionError;
}

export class HttpAnalysisService {
  /**
   * Analyze target HTTP endpoint via the backend analysis service.
   */
  public static async analyze(targetUrl: string): Promise<HttpAnalysisResponse> {
    try {
      const response = await fetch('/api/inspect-http', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.error) {
          return {
            success: false,
            error: data.error,
          };
        }

        return {
          success: false,
          error: {
            code: 'HTTP_ERROR_RESPONSE',
            title: `HTTP ${response.status} Error`,
            message: data?.message || 'Server-side analysis endpoint returned an error.',
            technicalDetail: `Endpoint responded with status ${response.status} ${response.statusText}`,
            targetUrl,
          },
        };
      }

      return {
        success: true,
        finding: data as HttpFinding,
      };
    } catch (err: any) {
      // If the backend endpoint itself was unreachable
      const errMsg = err?.message || String(err);

      // Distinguish CORS / direct restriction if trying direct client requests
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          title: 'Analysis Service Unreachable',
          message: 'Unable to communicate with the HTTP analysis endpoint.',
          technicalDetail: `Client network fault: ${errMsg}. Ensure local inspection daemon or /api/inspect-http is active.`,
          targetUrl,
        },
      };
    }
  }
}
