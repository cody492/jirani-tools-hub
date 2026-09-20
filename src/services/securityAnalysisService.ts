import {
  HttpFinding,
  InfrastructureFinding,
  TechnologyReport,
  SecurityReport,
  SecurityInspectionError,
} from '../types';
import { analyzeSecurityConfiguration } from './securityAnalysisEngine';

export interface SecurityAnalysisResponse {
  success: boolean;
  report?: SecurityReport;
  error?: SecurityInspectionError;
}

export interface SecurityAnalysisParams {
  domain: string;
  hostname: string;
  targetUrl: string;
  httpFinding?: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
  technologyReport?: TechnologyReport | null;
}

export class SecurityAnalysisService {
  /**
   * Analyzes security configuration of the target.
   * Prioritizes the server-side API (/api/inspect-security) to perform passive TLS handshake.
   * If server is unreachable, executes client-side fallback using available HTTP telemetry.
   */
  public static async analyze(
    optionsOrDomain: SecurityAnalysisParams | string,
    hostname?: string,
    targetUrl?: string,
    httpFinding?: HttpFinding | null,
    infrastructureFinding?: InfrastructureFinding | null,
    technologyReport?: TechnologyReport | null
  ): Promise<SecurityAnalysisResponse> {
    let domain: string;
    let host: string;
    let url: string;
    let http: HttpFinding | null | undefined;
    let infra: InfrastructureFinding | null | undefined;
    let tech: TechnologyReport | null | undefined;

    if (typeof optionsOrDomain === 'object') {
      domain = optionsOrDomain.domain;
      host = optionsOrDomain.hostname;
      url = optionsOrDomain.targetUrl;
      http = optionsOrDomain.httpFinding;
      infra = optionsOrDomain.infrastructureFinding;
      tech = optionsOrDomain.technologyReport;
    } else {
      domain = optionsOrDomain;
      host = hostname || '';
      url = targetUrl || '';
      http = httpFinding;
      infra = infrastructureFinding;
      tech = technologyReport;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch('/api/inspect-security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          hostname: host,
          targetUrl: url,
          httpFinding: http || null,
          infrastructureFinding: infra || null,
          technologyReport: tech || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.report) {
          return { success: true, report: data.report };
        }
      }

      // If server returned structured error
      if (response.status >= 400 && response.status < 500) {
        const errData = await response.json().catch(() => null);
        if (errData?.error) {
          // Attempt client-side fallback before failing completely
          const fallbackReport = analyzeSecurityConfiguration({
            domain,
            hostname: host,
            targetUrl: url,
            httpFinding: http || null,
            infrastructureFinding: infra || null,
            technologyReport: tech || null,
          });
          return { success: true, report: fallbackReport };
        }
      }
    } catch {
      // Network or timeout failure on server-side endpoint; proceed to graceful local engine fallback
    }

    // Graceful fallback to client engine
    try {
      const fallbackReport = analyzeSecurityConfiguration({
        domain,
        hostname: host,
        targetUrl: url,
        httpFinding: http || null,
        infrastructureFinding: infra || null,
        technologyReport: tech || null,
      });

      return {
        success: true,
        report: fallbackReport,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          title: 'Security Analysis Failure',
          message: 'Unable to complete security configuration observations.',
          technicalDetail: err?.message || String(err),
          targetUrl: url,
        },
      };
    }
  }
}
